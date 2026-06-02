import { ConfigLoader } from "../config/loader.js"
import { SddState, PHASE_SKILLS } from "../state.js"

export interface SkillDispatchResult {
  success: boolean
  message: string
  skill_name?: string
  skill_args?: Record<string, unknown>
  instruction?: string
}

export class SkillDispatcher {
  private configLoader: ConfigLoader
  private state: SddState

  constructor(configLoader: ConfigLoader, state: SddState) {
    this.configLoader = configLoader
    this.state = state
  }

  dispatchForCurrentPhase(): SkillDispatchResult {
    const phase = this.state.currentPhase
    const skillName = this.configLoader.getSkill(phase)

    if (!skillName) {
      return {
        success: false,
        message: `No skill configured for Phase ${phase}`,
      }
    }

    const instruction = this.generateSkillInstruction(skillName, phase)

    return {
      success: true,
      message: `Skill '${skillName}' dispatched for Phase ${phase}`,
      skill_name: skillName,
      skill_args: { feature: this.state.featureName },
      instruction,
    }
  }

  dispatchSkill(skillName: string, args?: Record<string, unknown>): SkillDispatchResult {
    const instruction = this.generateSkillInstruction(skillName, this.state.currentPhase)

    return {
      success: true,
      message: `Skill '${skillName}' invoked`,
      skill_name: skillName,
      skill_args: args ?? {},
      instruction,
    }
  }

  getRecommendedSkill(): string | undefined {
    return PHASE_SKILLS[this.state.currentPhase]
  }

  private generateSkillInstruction(skillName: string, phase: number): string {
    const phaseConfig = this.configLoader.getPhaseConfig(phase)

    return `
## Skill Dispatch: ${skillName}

**Phase**: ${phase} (${phaseConfig?.name ?? `Phase ${phase}`})
**Feature**: ${this.state.featureName}

**Instruction**: Invoke the '${skillName}' skill for guidance.

### How to invoke skill
In opencode, you can invoke a skill by:
1. Using the skill tool: \`skill("${skillName}")\`
2. Or saying: "Use ${skillName} skill"

### Skill Purpose
This skill provides detailed guidance for Phase ${phase} execution.

### Phase Requirements
${phaseConfig?.gate_requirements?.map((r) => `- ${r}`).join("\n") ?? "See phases-reference.md"}

### After Skill Completion
Return here and use sdd_gate phase=${phase + 1} action=approve to proceed.
`
  }
}