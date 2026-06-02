import { Phase, SddState } from "../state.js"
import { ConfigLoader } from "../config/loader.js"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"

export interface TransitionResult {
  success: boolean
  message: string
  from_phase: number
  to_phase: number
}

export class PhaseOrchestrator {
  private state: SddState
  private configLoader: ConfigLoader
  private projectDir: string

  constructor(state: SddState, configLoader: ConfigLoader, projectDir: string) {
    this.state = state
    this.configLoader = configLoader
    this.projectDir = projectDir
  }

  transitionTo(phase: Phase): TransitionResult {
    const from = this.state.currentPhase
    const canTransition = this.configLoader.canTransition(from, phase)

    if (!canTransition) {
      return {
        success: false,
        message: `Cannot transition from Phase ${from} to Phase ${phase}. Invalid transition.`,
        from_phase: from,
        to_phase: phase,
      }
    }

    const success = this.state.transition(phase)
    if (!success) {
      return {
        success: false,
        message: `Transition failed. State unchanged.`,
        from_phase: from,
        to_phase: phase,
      }
    }

    if (this.state.featureName) {
      this.writeCheckpoint(this.state.featureName)
    }

    return {
      success: true,
      message: `Transitioned from Phase ${from} to Phase ${phase} (${this.state.getPhaseName()})`,
      from_phase: from,
      to_phase: phase,
    }
  }

  startFeature(featureName: string): TransitionResult {
    this.state.featureName = featureName
    this.state.currentPhase = Phase.INIT
    this.state.resetContextMonitor()

    const featureDir = join(this.projectDir, "docs", "features", featureName)
    mkdirSync(featureDir, { recursive: true })
    mkdirSync(join(featureDir, ".sdd"), { recursive: true })

    this.writeCheckpoint(featureName)
    this.state.save()

    return {
      success: true,
      message: `Feature '${featureName}' started at Phase 0 (Research & Understanding)`,
      from_phase: -1,
      to_phase: Phase.INIT,
    }
  }

  completeFeature(): TransitionResult {
    const from = this.state.currentPhase
    const featureName = this.state.featureName

    if (from !== Phase.PERSISTENCE) {
      return {
        success: false,
        message: `Cannot complete from Phase ${from}. Must be at Phase 6 (Persistence).`,
        from_phase: from,
        to_phase: Phase.COMPLETED,
      }
    }

    this.state.currentPhase = Phase.COMPLETED
    this.state.save()

    const featureDir = join(this.projectDir, "docs", "features", featureName)
    mkdirSync(featureDir, { recursive: true })
    writeFileSync(join(featureDir, "COMPLETED"), new Date().toISOString(), "utf-8")

    return {
      success: true,
      message: `Feature '${featureName}' completed. Ready for merge.`,
      from_phase: from,
      to_phase: Phase.COMPLETED,
    }
  }

  getPhaseConfig(phase: number) {
    return this.configLoader.getPhaseConfig(phase)
  }

  getBlockedTools(): string[] {
    return this.configLoader.getBlockedTools(this.state.currentPhase)
  }

  private writeCheckpoint(featureName: string): void {
    const checkpointDir = join(this.projectDir, "docs", "features", featureName, ".sdd")
    mkdirSync(checkpointDir, { recursive: true })
    writeFileSync(
      join(checkpointDir, "checkpoint.json"),
      JSON.stringify({
        feature: featureName,
        phase: String(this.state.currentPhase),
        phaseName: this.state.getPhaseName(),
        updatedAt: new Date().toISOString(),
      }, null, 2),
      "utf-8"
    )
  }
}