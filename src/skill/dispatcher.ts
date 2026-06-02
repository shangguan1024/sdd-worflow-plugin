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
    const primarySkills = this.configLoader.getSkills(phase)
    const additionalSkills = this.configLoader.getAdditionalSkills(phase)
    const invokeMode = this.configLoader.getSkillInvokeMode(phase)
    const phaseConfig = this.configLoader.getPhaseConfig(phase)

    const allSkills = [...primarySkills, ...additionalSkills].filter(s => s && s.length > 0)

    if (allSkills.length === 0) {
      return {
        success: false,
        message: `No skills configured for Phase ${phase}`,
        skills: [],
        instruction: "",
      }
    }

    const skills: SkillInvocation[] = [
      ...primarySkills.map((name, index) => ({
        name,
        order: index,
        mode: "primary" as const,
        invoke_timing: invokeMode as SkillInvocation["invoke_timing"],
      })),
      ...additionalSkills.map((name, index) => ({
        name,
        order: primarySkills.length + index,
        mode: "additional" as const,
        invoke_timing: invokeMode as SkillInvocation["invoke_timing"],
      })),
    ]

    const instruction = this.generateSkillChainInstruction(skills, phase, phaseConfig, primarySkills, additionalSkills)

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

    const instruction = this.generateSkillChainInstruction(skills, phase, phaseConfig, [skillName], [])

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
    phaseConfig?: PhaseConfig,
    primarySkills: string[] = [],
    additionalSkills: string[] = []
  ): string {
    const invokeTiming = skills[0]?.invoke_timing ?? "pre_phase"

    let instruction = `
## ⚠️ MANDATORY Skill Chain for Phase ${phase} (${phaseConfig?.name ?? `Phase ${phase}`})

**Primary Skills**: ${primarySkills.length > 0 ? primarySkills.join(", ") : "None"}
**Additional Skills**: ${additionalSkills.length > 0 ? additionalSkills.join(", ") : "None"}

### Invoke Timing: ${invokeTiming}

You MUST invoke these skills according to the timing below. This is NOT optional.

`

    if (invokeTiming === "pre_phase") {
      instruction += `
### 🚨 REQUIRED ACTION NOW

You MUST execute the following skill invocations IMMEDIATELY before starting Phase ${phase} tasks:

`
      if (primarySkills.length > 0) {
        instruction += `**Step 1 - Invoke Primary Skills (REQUIRED)**:
\`\`\`
${primarySkills.map(s => `skill("${s}")`).join("\n")}
\`\`\`

`
      }
      if (additionalSkills.length > 0) {
        instruction += `**Step 2 - Invoke Additional Skills (REQUIRED)**:
After primary skills complete, you MUST invoke:
\`\`\`
${additionalSkills.map(s => `skill("${s}")`).join("\n")}
\`\`\`

`
      }
      instruction += `**Do NOT proceed with Phase ${phase} tasks until ALL skills above are invoked.**`
    } else if (invokeTiming === "pre_gate") {
      instruction += `
### 🚨 REQUIRED ACTION BEFORE GATE

After completing Phase ${phase} tasks, you MUST invoke skill chain BEFORE calling sdd_gate:

**Required Skill Invocations**:
\`\`\`
${primarySkills.map(s => `skill("${s}")`).join("\n")}
${additionalSkills.map(s => `skill("${s}")`).join("\n")}
sdd_gate phase=${phase + 1} action=check
\`\`\`

**Do NOT call sdd_gate until ALL skills above are invoked.**`
    } else if (invokeTiming === "during_phase") {
      instruction += `
### 🚨 REQUIRED ACTION DURING PHASE

During Phase ${phase} execution, you MUST invoke skills when appropriate:

**When you encounter a situation matching skill purpose, invoke IMMEDIATELY**:
\`\`\`
${primarySkills.map(s => `skill("${s}")`).join("\n")}
${additionalSkills.map(s => `skill("${s}")`).join("\n")}
\`\`\`
`
    }

    instruction += `

### Skill Purpose Reference

| Skill | Type | When to Invoke | Purpose |
|-------|------|----------------|---------|
${primarySkills.map(s => `| ${s} | Primary | ${this.getInvokeWhen(invokeTiming)} | ${this.getSkillPurpose(s)} |`).join("\n")}
${additionalSkills.map(s => `| ${s} | Additional | ${this.getInvokeWhen(invokeTiming)} | ${this.getSkillPurpose(s)} |`).join("\n")}

### ⚠️ REMINDER
- Primary skills: configured in workflow_config.json as \`skills: []\`
- Additional skills: configured as \`additional_skills: []\`
- Plugin does NOT hardcode skill names
- You MUST invoke ALL skills as instructed above
- After skill chain: continue tasks → sdd_gate → wait for approval
`

    return instruction
  }

  private getInvokeWhen(timing: string): string {
    const timingMap: Record<string, string> = {
      "pre_phase": "Before phase starts",
      "during_phase": "During execution (as needed)",
      "pre_gate": "Before gate check",
      "post_gate": "After gate approval",
    }
    return timingMap[timing] ?? "As configured"
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