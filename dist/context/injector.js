import { existsSync } from "fs";
import { join } from "path";
export const contextInjector = {
    getPhaseSkeleton(phase, state) {
        return `## SDD-Workflow (Phase ${phase}: ${state.getPhaseName()})

**Current Feature**: ${state.featureName || "Not set"}`;
    },
    injectFileHints(phase, state, projectDir) {
        const files = [];
        const agentsFile = join(projectDir, "AGENTS.md");
        if (existsSync(agentsFile)) {
            files.push("- AGENTS.md");
        }
        if (state.featureName) {
            const featureDir = join(projectDir, "docs", "features", state.featureName);
            for (const filename of ["findings.md", "task_plan.md", "design.md"]) {
                const filepath = join(featureDir, filename);
                if (existsSync(filepath)) {
                    files.push(`- docs/features/${state.featureName}/${filename}`);
                }
            }
        }
        const constitutionFile = join(projectDir, "CONSTITUTION", "core.md");
        if (existsSync(constitutionFile)) {
            files.push("- CONSTITUTION/core.md");
        }
        if (files.length === 0) {
            return "";
        }
        return `Context files (需要时用read工具读取，不要全量注入):
${files.join("\n")}`;
    }
};
//# sourceMappingURL=injector.js.map