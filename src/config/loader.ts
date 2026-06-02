import { readFileSync, existsSync } from "fs"
import { join } from "path"

export interface PhaseConfig {
  id: number
  name: string
  blocked_tools: string[]
  allowed_tools: string[]
  skill?: string
  additional_skills?: string[]
  skill_invoke_mode?: "pre_phase" | "during_phase" | "pre_gate" | "post_gate"
  required_files: string[]
  required_sections: string[]
  gate_requirements: string[]
}

export interface WorkflowConfig {
  version: string
  phases: PhaseConfig[]
  transitions: Record<string, number[]>
  thresholds: {
    edit_warning: number
    edit_hard_limit: number
    refresh_interval: number
  }
  skill_invoke_modes?: Record<string, string>
}

const DEFAULT_CONFIG: WorkflowConfig = {
  version: "2.5",
  phases: [
    {
      id: 0,
      name: "Research & Understanding",
      blocked_tools: ["edit", "write", "bash"],
      allowed_tools: ["read", "glob", "grep"],
      skill: "comprehensive-research-agent",
      additional_skills: [],
      skill_invoke_mode: "pre_phase",
      required_files: ["findings.md"],
      required_sections: ["## Phase 0: Research"],
      gate_requirements: [
        "5+ specific files analyzed",
        "2+ external citations",
        "2+ constraints",
        "2+ alternatives",
      ],
    },
    {
      id: 1,
      name: "Requirements & Design",
      blocked_tools: ["bash"],
      allowed_tools: ["read", "glob", "grep", "edit", "write"],
      skill: "brainstorming",
      additional_skills: [],
      skill_invoke_mode: "pre_phase",
      required_files: ["findings.md", "design.md"],
      required_sections: ["## Phase 1: Design Summary"],
      gate_requirements: [
        "Design document generated",
        "Constitution compliance passed",
      ],
    },
    {
      id: 2,
      name: "Implementation Planning",
      blocked_tools: [],
      allowed_tools: ["all"],
      skill: "writing-plans",
      additional_skills: [],
      skill_invoke_mode: "pre_phase",
      required_files: ["task_plan.md"],
      required_sections: ["## Phase 2: Plan Summary"],
      gate_requirements: ["Implementation plan exists"],
    },
    {
      id: 3,
      name: "Module Development",
      blocked_tools: [],
      allowed_tools: ["all"],
      skill: "subagent-driven-development",
      additional_skills: ["code-review-quality"],
      skill_invoke_mode: "pre_gate",
      required_files: ["task_plan.md"],
      required_sections: ["## Phase 3: Implementation Summary"],
      gate_requirements: ["All tasks completed", "Unit tests pass"],
    },
    {
      id: 4,
      name: "Integration & Testing",
      blocked_tools: [],
      allowed_tools: ["all"],
      skill: "verification-before-completion",
      additional_skills: [],
      skill_invoke_mode: "pre_phase",
      required_files: ["findings.md"],
      required_sections: ["## Phase 4: Test Summary"],
      gate_requirements: ["Integration tests pass", "E2E tests pass"],
    },
    {
      id: 5,
      name: "Code Quality Review",
      blocked_tools: [],
      allowed_tools: ["all"],
      skill: "requesting-code-review",
      additional_skills: ["code-review-quality"],
      skill_invoke_mode: "pre_gate",
      required_files: [
        "reviews/architecture_review.md",
        "reviews/code_quality_review.md",
      ],
      required_sections: ["## Phase 5: Review Summary"],
      gate_requirements: ["Architecture review complete", "Code quality review complete"],
    },
    {
      id: 6,
      name: "Memory Persistence",
      blocked_tools: [],
      allowed_tools: ["all"],
      skill: "memory-systems",
      additional_skills: [],
      skill_invoke_mode: "pre_phase",
      required_files: ["PROJECT_STATE.md", "AGENTS.md"],
      required_sections: [],
      gate_requirements: ["All memory artifacts exist"],
    },
  ],
  transitions: {
    "0": [1],
    "1": [2],
    "2": [3],
    "3": [4],
    "4": [5],
    "5": [6],
    "6": [7],
  },
  thresholds: {
    edit_warning: 5,
    edit_hard_limit: 15,
    refresh_interval: 20,
  },
  skill_invoke_modes: {
    pre_phase: "Invoke before phase execution",
    during_phase: "Invoke during phase execution",
    pre_gate: "Invoke before gate check",
    post_gate: "Invoke after gate approval",
  },
}

export class ConfigLoader {
  private config: WorkflowConfig
  private projectDir: string

  constructor(projectDir: string) {
    this.projectDir = projectDir
    this.config = this.loadConfig()
  }

  private loadConfig(): WorkflowConfig {
    const configFile = join(this.projectDir, ".sdd", "workflow_config.json")
    if (existsSync(configFile)) {
      try {
        const data = JSON.parse(readFileSync(configFile, "utf-8"))
        return this.mergeConfig(DEFAULT_CONFIG, data)
      } catch {
        return DEFAULT_CONFIG
      }
    }
    return DEFAULT_CONFIG
  }

  private mergeConfig(defaultConfig: WorkflowConfig, userConfig: Partial<WorkflowConfig>): WorkflowConfig {
    const merged = { ...defaultConfig }

    if (userConfig.version) {
      merged.version = userConfig.version
    }

    if (userConfig.thresholds) {
      merged.thresholds = { ...defaultConfig.thresholds, ...userConfig.thresholds }
    }

    if (userConfig.phases && Array.isArray(userConfig.phases)) {
      for (const userPhase of userConfig.phases) {
        const defaultPhase = defaultConfig.phases.find(p => p.id === userPhase.id)
        if (defaultPhase) {
          const mergedPhase: PhaseConfig = {
            ...defaultPhase,
            ...userPhase,
            skill: defaultPhase.skill,
            additional_skills: userPhase.additional_skills ?? defaultPhase.additional_skills,
          }
          const index = merged.phases.findIndex(p => p.id === userPhase.id)
          if (index >= 0) {
            merged.phases[index] = mergedPhase
          }
        }
      }
    }

    if (userConfig.transitions) {
      merged.transitions = { ...defaultConfig.transitions, ...userConfig.transitions }
    }

    return merged
  }

  getConfig(): WorkflowConfig {
    return this.config
  }

  getPhaseConfig(phaseId: number): PhaseConfig | undefined {
    return this.config.phases.find((p) => p.id === phaseId)
  }

  getBlockedTools(phaseId: number): string[] {
    const phase = this.getPhaseConfig(phaseId)
    return phase?.blocked_tools ?? []
  }

  getSkill(phaseId: number): string | undefined {
    const phase = this.getPhaseConfig(phaseId)
    return phase?.skill
  }

  getAdditionalSkills(phaseId: number): string[] {
    const phase = this.getPhaseConfig(phaseId)
    return phase?.additional_skills ?? []
  }

  getSkillInvokeMode(phaseId: number): string {
    const phase = this.getPhaseConfig(phaseId)
    return phase?.skill_invoke_mode ?? "pre_phase"
  }

  getAllSkills(phaseId: number): string[] {
    const primary = this.getSkill(phaseId)
    const additional = this.getAdditionalSkills(phaseId)
    const all = primary ? [primary, ...additional] : additional
    return all.filter((s) => s && s.length > 0)
  }

  canTransition(from: number, to: number): boolean {
    const transitions = this.config.transitions[String(from)]
    return transitions?.includes(to) ?? false
  }

  getThresholds(): { edit_warning: number; edit_hard_limit: number; refresh_interval: number } {
    return this.config.thresholds
  }

  reload(): void {
    this.config = this.loadConfig()
  }
}