import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { CORE_PRINCIPLES } from "../templates/core-principles.js";
import { DESIGN_RULES, IMPL_RULES, REVIEW_RULES, WORKFLOW_RULES } from "../templates/core-principles.js";
import { FINDINGS_TEMPLATE } from "../templates/findings.js";
import { TASK_PLAN_TEMPLATE } from "../templates/task-plan.js";
export class ProjectInitializer {
    projectDir;
    constructor(projectDir) {
        this.projectDir = projectDir;
    }
    isInitialized(path) {
        return existsSync(join(path, "CONSTITUTION"))
            || existsSync(join(path, ".sdd"))
            || existsSync(join(path, "PROJECT_STATE.md"));
    }
    initializeAll(path, template) {
        this.createDirectoryStructure(path);
        this.initializeConstitution(path);
        this.initializeMemoryArtifacts(path);
        this.initializeConfig(path, template);
    }
    createDirectoryStructure(path) {
        const dirs = [
            ".sdd", "CONSTITUTION", ".nexus-map",
            "docs/knowledge", "docs/modules", "docs/features", "docs/collaboration",
        ];
        for (const d of dirs) {
            mkdirSync(join(path, d), { recursive: true });
        }
    }
    initializeConstitution(path) {
        const constDir = join(path, "CONSTITUTION");
        mkdirSync(constDir, { recursive: true });
        writeFileSync(join(constDir, "core.md"), CORE_PRINCIPLES, "utf-8");
        writeFileSync(join(constDir, "design-rules.md"), DESIGN_RULES, "utf-8");
        writeFileSync(join(constDir, "implementation-rules.md"), IMPL_RULES, "utf-8");
        writeFileSync(join(constDir, "review-rules.md"), REVIEW_RULES, "utf-8");
        writeFileSync(join(constDir, "workflow-rules.md"), WORKFLOW_RULES, "utf-8");
    }
    initializeMemoryArtifacts(path) {
        writeFileSync(join(path, "PROJECT_STATE.md"), "# Project State\n\n## Features\n\nNo active features.\n\n## Quality Metrics\n\n| Metric | Current | Target |\n|--------|---------|--------|\n", "utf-8");
        writeFileSync(join(path, "AGENTS.md"), "# AI Agent Context\n\nNo active session.\n", "utf-8");
    }
    initializeConfig(path, template) {
        mkdirSync(join(path, ".sdd"), { recursive: true });
        writeFileSync(join(path, ".sdd", "project.json"), JSON.stringify({
            project: { name: this.projectDir.split(/[/\\]/).pop() || "project", type: template, complexity: "medium" },
            harness: { enabled: true },
        }, null, 2), "utf-8");
        writeFileSync(join(path, ".sdd", "workflow_config.json"), JSON.stringify({
            version: "2.5",
            comment: "skills field completely replaces default_primary_skills for that phase (not appended). additional_skills are appended after primary skills.",
            default_primary_skills: {
                0: "comprehensive-research-agent",
                1: "brainstorming",
                2: "writing-plans",
                3: "subagent-driven-development",
                4: "verification-before-completion",
                5: "requesting-code-review",
                6: "memory-systems",
            },
            phases: [
                { id: 0, skills: null, additional_skills: [] },
                { id: 1, skills: null, additional_skills: [] },
                { id: 2, skills: null, additional_skills: [] },
                { id: 3, skills: null, additional_skills: ["code-review-quality"] },
                { id: 4, skills: null, additional_skills: [] },
                { id: 5, skills: null, additional_skills: ["receiving-code-review"] },
                { id: 6, skills: null, additional_skills: [] },
            ],
        }, null, 2), "utf-8");
    }
    initializeFeatureArtifacts(featureDir, featureName) {
        mkdirSync(featureDir, { recursive: true });
        mkdirSync(join(featureDir, ".sdd"), { recursive: true });
        writeFileSync(join(featureDir, "findings.md"), FINDINGS_TEMPLATE(featureName), "utf-8");
        writeFileSync(join(featureDir, "task_plan.md"), TASK_PLAN_TEMPLATE(featureName), "utf-8");
    }
}
//# sourceMappingURL=initializer.js.map