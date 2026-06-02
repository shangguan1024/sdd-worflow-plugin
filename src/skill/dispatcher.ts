import { ConfigLoader, PhaseConfig } from "../config/loader.js"
import { SddState } from "../state.js"

export interface SkillDispatchResult {
  success: boolean
  message: string
  skills: SkillInvocation[]
  instruction: string
}

export interface SkillInvocation {
  name: string
  order: number
  mode: "primary" | "additional"
  invoke_timing: "pre_phase" | "during_phase" | "pre_gate" | "post_gate"
}

export class SkillDispatcher {
  private configLoader: ConfigLoader
  private state: SddState

  constructor(configLoader: ConfigLoader, state: SddState) {
    this.configLoader = configLoader
    this.state = state
  }

  dispatchForCurrentPhase(): SkillDispatchResult {
    return this.dispatchForPhase(this.state.currentPhase)
  }

  dispatchForPhase(phase: number): SkillDispatchResult {
    const allSkills = this.configLoader.getAllSkills(phase)
    const invokeMode = this.configLoader.getSkillInvokeMode(phase)
    const phaseConfig = this.configLoader.getPhaseConfig(phase)

    if (allSkills.length === 0) {
      return {
        success: false,
        message: `No skills configured for Phase ${phase}`,
        skills: [],
        instruction: "",
      }
    }

    const skills: SkillInvocation[] = allSkills.map((name, index) => ({
      name,
      order: index,
      mode: index === 0 ? "primary" : "additional",
      invoke_timing: invokeMode as SkillInvocation["invoke_timing"],
    }))

    const instruction = this.generateSkillChainInstruction(skills, phase, phaseConfig)

    return {
      success: true,
      message: `${allSkills.length} skills ready for Phase ${phase}`,
      skills,
      instruction,
    }
  }

  dispatchSkill(skillName: string, args?: Record<string, unknown>): SkillDispatchResult {
    const phase = this.state.currentPhase
    const phaseConfig = this.configLoader.getPhaseConfig(phase)

    const skills: SkillInvocation[] = [{
      name: skillName,
      order: 0,
      mode: "primary",
      invoke_timing: "during_phase",
    }]

    const instruction = this.generateSkillChainInstruction(skills, phase, phaseConfig)

    return {
      success: true,
      message: `Skill '${skillName}' invoked`,
      skills,
      instruction,
    }
  }

  getRecommendedSkill(): string | undefined {
    return this.configLoader.getSkill(this.state.currentPhase)
  }

  getAdditionalSkills(): string[] {
    return this.configLoader.getAdditionalSkills(this.state.currentPhase)
  }

  private generateSkillChainInstruction(
    skills: SkillInvocation[],
    phase: number,
    phaseConfig?: PhaseConfig
  ): string {
    const primarySkill = skills.find((s) => s.mode === "primary")
    const additionalSkills = skills.filter((s) => s.mode === "additional")

    let instruction = `
## Skill Chain for Phase ${phase} (${phaseConfig?.name ?? `Phase ${phase}`})

**Primary Skill**: ${primarySkill?.name ?? "None"}
${additionalSkills.length > 0 ? `**Additional Skills**: ${additionalSkills.map((s) => s.name).join(", ")}` : ""}

### Invoke Timing: ${primarySkill?.invoke_timing ?? "pre_phase"}

`

    if (primarySkill?.invoke_timing === "pre_phase") {
      instruction += `
**Execution Order**:
1. Invoke primary skill BEFORE starting phase tasks
2. Invoke additional skills AFTER primary skill completes

**How to invoke**:
\`\`\`
skill("${primarySkill?.name}")
\`\`\`
`
      if (additionalSkills.length > 0) {
        instruction += `
Then for additional skills:
\`\`\`
skill("${additionalSkills[0]?.name}")
\`\`\`
`
      }
    } else if (primarySkill?.invoke_timing === "pre_gate") {
      instruction += `
**Execution Order**:
1. Complete phase tasks FIRST
2. Invoke skill chain BEFORE gate check
3. Then call sdd_gate action=check

**How to invoke**:
After completing phase tasks:
\`\`\`
skill("${primarySkill?.name}")
`
      if (additionalSkills.length > 0) {
        instruction += `skill("${additionalSkills[0]?.name}")\n`
      }
      instruction += `sdd_gate phase=${phase + 1} action=check
\`\`\`
`
    } else if (primarySkill?.invoke_timing === "during_phase") {
      instruction += `
**Execution Order**:
1. Start phase tasks
2. Invoke skills when needed during execution
3. Complete phase tasks
4. Call sdd_gate action=check

**How to invoke**:
During phase execution:
\`\`\`
skill("${primarySkill?.name}")
\`\`\`
`
    }

    instruction += `
### Skill Purpose

| Skill | Purpose |
|-------|---------|
${skills.map((s) => `| ${s.name} | ${this.getSkillPurpose(s.name)} |`).join("\n")}

### After Skill Chain Complete
- Continue phase tasks
- Call sdd_gate phase=${phase + 1} action=check
- Wait for user approval
`

    return instruction
  }

  private getSkillPurpose(skillName: string): string {
    const purposes: Record<string, string> = {
      "comprehensive-research-agent": "Deep research with error recovery",
      "brainstorming": "Design exploration before implementation",
      "writing-plans": "Implementation planning",
      "subagent-driven-development": "Parallel module development",
      "verification-before-completion": "Testing verification",
      "requesting-code-review": "Code review request",
      "memory-systems": "Persistence architecture",
      "code-review-quality": "Code quality and best practices check",
    }
    return purposes[skillName] ?? "Custom skill"
  }
}