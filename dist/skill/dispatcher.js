const SKILL_DESCRIPTIONS = {
    "comprehensive-research-agent": "Research and requirement clarification — ask the user for feature overview, requirement specs, performance requirements, and core module design",
    "brainstorming": "Design exploration before implementation, collaborative requirement refinement",
    "writing-plans": "Implementation planning with task decomposition",
    "subagent-driven-development": "Parallel module development with independent tasks",
    "verification-before-completion": "Testing verification before claiming completion",
    "requesting-code-review": "Code review request with quality assessment",
    "memory-systems": "Cross-session knowledge persistence and memory architecture",
    "code-review-quality": "Context-driven code quality review, focusing on testability and maintainability",
};
export class SkillDispatcher {
    configLoader;
    state;
    constructor(configLoader, state) {
        this.configLoader = configLoader;
        this.state = state;
    }
    dispatchForCurrentPhase() {
        return this.dispatchForPhase(this.state.currentPhase);
    }
    dispatchForPhase(phase) {
        const primarySkills = this.configLoader.getSkills(phase);
        const additionalSkills = this.configLoader.getAdditionalSkills(phase);
        const phaseConfig = this.configLoader.getPhaseConfig(phase);
        if (primarySkills.length === 0) {
            return {
                success: false,
                message: `No primary skill configured for Phase ${phase}`,
                skills: [],
                instruction: "",
            };
        }
        const skills = [
            ...primarySkills.map(name => ({
                name,
                mode: "primary",
                description: this.getSkillDescription(name),
            })),
            ...additionalSkills.map(name => ({
                name,
                mode: "additional",
                description: this.getSkillDescription(name),
            })),
        ];
        const instruction = this.generateInstruction(phase, phaseConfig, skills);
        return {
            success: true,
            message: `${skills.length} skills ready for Phase ${phase}`,
            skills,
            instruction,
        };
    }
    dispatchSkill(skillName) {
        const phase = this.state.currentPhase;
        const phaseConfig = this.configLoader.getPhaseConfig(phase);
        const skills = [{
                name: skillName,
                mode: "primary",
                description: this.getSkillDescription(skillName),
            }];
        const instruction = this.generateInstruction(phase, phaseConfig, skills);
        return {
            success: true,
            message: `Skill '${skillName}' invoked`,
            skills,
            instruction,
        };
    }
    getRecommendedSkill() {
        return this.configLoader.getSkill(this.state.currentPhase);
    }
    getAdditionalSkills() {
        return this.configLoader.getAdditionalSkills(this.state.currentPhase);
    }
    generateInstruction(phase, phaseConfig, skills) {
        const primarySkills = skills.filter(s => s.mode === "primary");
        const additionalSkills = skills.filter(s => s.mode === "additional");
        const phaseName = phaseConfig?.name ?? `Phase ${phase}`;
        let instruction = `
⚠️ MANDATORY - 不可跳过:

Step 1: 读取sdd-workflow skill文档
  → ~/.config/opencode/skills/sdd-workflow/phases-reference.md
  → 读取Phase ${phase} section
  → 知道要做什么、Gate要求什么、产出格式是什么

Step 2: 调Primary skill
  → ${primarySkills.map(s => `skill("${s.name}")`).join("\n  → ")}
  → ${primarySkills.map(s => s.description).join("\n  → ")}

⚠️ 顺序不可颠倒：先看说明书，再拿工具干活
⚠️ 不要跳过Step 1直接调skill，否则不知道Phase的具体要求

Step 3: 执行Phase任务
  → 按phases-reference.md的Phase ${phase} section指导执行

Step 4: Gate检查
  → sdd_gate phase=${phase + 1} action=check
  → sdd_gate phase=${phase + 1} action=approve (需用户确认)
`;
        if (additionalSkills.length > 0) {
            instruction += `
📋 Available additional skills (可选, 自行判断调用时机):

${additionalSkills.map(s => `- ${s.name}\n  功能: ${s.description}\n  建议: 需要时调用, 无固定时机`).join("\n\n")}
`;
        }
        return instruction;
    }
    getSkillDescription(skillName) {
        return SKILL_DESCRIPTIONS[skillName] ?? "Custom skill";
    }
}
//# sourceMappingURL=dispatcher.js.map