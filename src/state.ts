import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"

export enum Phase {
  INIT = 0,
  REQUIREMENTS = 1,    // Phase 1
  PLANNING = 2,        // Phase 2
  DEVELOPMENT = 3,     // Phase 3
  INTEGRATION = 4,     // Phase 4
  REVIEW = 5,          // Phase 5
  PERSISTENCE = 6,     // Phase 6
  COMPLETED = 7,
}

export const REQUIREMENT_CLARIFICATION = Phase.INIT  // Phase 0 alias

export const PHASE_NAMES: Record<number, string> = {
  [Phase.INIT]: "Research & Requirement Clarification",
  [Phase.REQUIREMENTS]: "Requirements & Design",
  [Phase.PLANNING]: "Implementation Planning",
  [Phase.DEVELOPMENT]: "Module Development",
  [Phase.INTEGRATION]: "Integration & Testing",
  [Phase.REVIEW]: "Code Quality Review",
  [Phase.PERSISTENCE]: "Memory Persistence",
  [Phase.COMPLETED]: "Completed",
}

export const PHASE_SKILLS: Record<number, string> = {
  [Phase.INIT]: "comprehensive-research-agent",
  [Phase.REQUIREMENTS]: "brainstorming",
  [Phase.PLANNING]: "writing-plans",
  [Phase.DEVELOPMENT]: "subagent-driven-development",
  [Phase.INTEGRATION]: "verification-before-completion",
  [Phase.REVIEW]: "requesting-code-review",
  [Phase.PERSISTENCE]: "memory-systems",
}

const VALID_TRANSITIONS: Record<number, number[]> = {
  [Phase.INIT]: [Phase.REQUIREMENTS],
  [Phase.REQUIREMENTS]: [Phase.PLANNING],
  [Phase.PLANNING]: [Phase.DEVELOPMENT],
  [Phase.DEVELOPMENT]: [Phase.INTEGRATION],
  [Phase.INTEGRATION]: [Phase.REVIEW],
  [Phase.REVIEW]: [Phase.PERSISTENCE],
  [Phase.PERSISTENCE]: [Phase.COMPLETED],
}

export interface SddStateData {
  currentPhase: number
  featureName: string
  sessionId: string
  editCount: number
  taskCount: number
  perFileEdits: Record<string, number>
  lastRefreshAtEdit: number
  lastRefreshAtTask: number
  refreshCount: number
  refreshHistory: Array<Record<string, unknown>>
  gateApprovals: Record<number, boolean>
  qualityProfile: string
}

export class SddState {
  currentPhase: Phase = Phase.INIT
  featureName: string = ""
  sessionId: string = ""
  editCount: number = 0
  taskCount: number = 0
  perFileEdits: Record<string, number> = {}
  lastRefreshAtEdit: number = 0
  lastRefreshAtTask: number = 0
  refreshCount: number = 0
  refreshHistory: Array<Record<string, unknown>> = []
  gateApprovals: Record<number, boolean> = {}
  qualityProfile: string = "standard"
  private stateDir: string
  private projectDir: string

  constructor(projectDir: string) {
    this.projectDir = projectDir
    this.stateDir = join(projectDir, ".sdd")
    this.sessionId = generateSessionId()
  }

  async load(): Promise<void> {
    const stateFile = join(this.stateDir, "state.json")
    if (existsSync(stateFile)) {
      try {
        const data: SddStateData = JSON.parse(readFileSync(stateFile, "utf-8"))
        this.currentPhase = data.currentPhase ?? Phase.INIT
        this.featureName = data.featureName ?? ""
        this.sessionId = data.sessionId ?? this.sessionId
        this.editCount = data.editCount ?? 0
        this.taskCount = data.taskCount ?? 0
        this.perFileEdits = data.perFileEdits ?? {}
        this.lastRefreshAtEdit = data.lastRefreshAtEdit ?? 0
        this.lastRefreshAtTask = data.lastRefreshAtTask ?? 0
        this.refreshCount = data.refreshCount ?? 0
        this.refreshHistory = data.refreshHistory ?? []
        this.gateApprovals = data.gateApprovals ?? {}
        this.qualityProfile = data.qualityProfile ?? "standard"
      } catch {
        this.currentPhase = Phase.INIT
      }
    }
  }

  save(): void {
    mkdirSync(this.stateDir, { recursive: true })
    writeFileSync(
      join(this.stateDir, "state.json"),
      JSON.stringify(this.getState(), null, 2),
      "utf-8"
    )
  }

  getState(): SddStateData {
    return {
      currentPhase: this.currentPhase,
      featureName: this.featureName,
      sessionId: this.sessionId,
      editCount: this.editCount,
      taskCount: this.taskCount,
      perFileEdits: this.perFileEdits,
      lastRefreshAtEdit: this.lastRefreshAtEdit,
      lastRefreshAtTask: this.lastRefreshAtTask,
      refreshCount: this.refreshCount,
      refreshHistory: this.refreshHistory,
      gateApprovals: this.gateApprovals,
      qualityProfile: this.qualityProfile,
    }
  }

  canTransition(from: Phase, to: Phase): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false
  }

  transition(to: Phase): boolean {
    if (this.canTransition(this.currentPhase, to)) {
      this.currentPhase = to
      this.save()
      return true
    }
    return false
  }

  approveGate(phase: Phase): void {
    this.gateApprovals[phase] = true
    this.save()
  }

  isGateApproved(phase: Phase): boolean {
    return this.gateApprovals[phase] === true
  }

  getPhaseName(): string {
    return PHASE_NAMES[this.currentPhase] ?? `Phase ${this.currentPhase}`
  }

  getPhaseSkill(): string | undefined {
    return PHASE_SKILLS[this.currentPhase]
  }

  resetContextMonitor(): void {
    this.editCount = 0
    this.taskCount = 0
    this.lastRefreshAtEdit = 0
    this.lastRefreshAtTask = 0
    this.refreshCount = 0
    this.perFileEdits = {}
    this.refreshHistory = []
    this.save()
  }

  recordEdit(filePath: string): void {
    this.editCount++
    this.perFileEdits[filePath] = (this.perFileEdits[filePath] ?? 0) + 1
    this.save()
  }

  recordTask(taskName: string): void {
    this.taskCount++
    this.save()
  }

  markRefreshed(): void {
    this.lastRefreshAtEdit = this.editCount
    this.lastRefreshAtTask = this.taskCount
    this.refreshCount++
    this.refreshHistory.push({
      atEdit: this.editCount,
      atTask: this.taskCount,
      time: new Date().toISOString(),
    })
    this.save()
  }

  rollbackTo(targetPhase: number): void {
    this.currentPhase = targetPhase
    const approvalsToKeep: Record<number, boolean> = {}
    for (const [phase, approved] of Object.entries(this.gateApprovals)) {
      if (parseInt(phase) < targetPhase && approved) {
        approvalsToKeep[parseInt(phase)] = true
      }
    }
    this.gateApprovals = approvalsToKeep
    this.resetContextMonitor()
  }

  getProjectDir(): string {
    return this.projectDir
  }

  isInitialized(): boolean {
    return existsSync(join(this.projectDir, ".sdd", "state.json"))
      || existsSync(join(this.projectDir, "CONSTITUTION"))
  }
}

function generateSessionId(): string {
  return Math.random().toString(36).slice(2, 10)
}