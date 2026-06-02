import { existsSync, readFileSync } from "fs";
import { join } from "path";
const PHASE_SUMMARY_MAP = {
    0: { file: "findings.md", marker: "## Phase 0: Research" },
    1: { file: "findings.md", marker: "## Phase 1: Design Summary" },
    2: { file: "findings.md", marker: "## Phase 2: Plan Summary" },
    3: { file: "findings.md", marker: "## Phase 3: Implementation Summary" },
    4: { file: "findings.md", marker: "## Phase 4: Test Summary" },
    5: { file: "findings.md", marker: "## Phase 5: Review Summary" },
};
export const phaseCompressionMiddleware = {
    check(phase, state, projectDir) {
        if (phase <= 0 || !state.featureName)
            return { allowed: true };
        const spec = PHASE_SUMMARY_MAP[phase - 1];
        if (!spec)
            return { allowed: true };
        const featureDir = join(projectDir, "docs", "features", state.featureName);
        const targetFile = join(featureDir, spec.file);
        if (!existsSync(targetFile)) {
            return {
                allowed: false,
                message: `Phase ${phase - 1} boundary compression incomplete. File ${spec.file} missing ${spec.marker} section.`,
                suggestion: `Add ${spec.marker} section to ${spec.file} before proceeding to Phase ${phase}.`,
            };
        }
        const content = readFileSync(targetFile, "utf-8");
        if (!content.toLowerCase().includes(spec.marker.toLowerCase())) {
            const altMarkers = {
                "## Phase 0: Research": ["## Phase 0", "## Research"],
                "## Phase 1: Design Summary": ["## Phase 1", "## Design"],
                "## Phase 2: Plan Summary": ["## Phase 2", "## Plan"],
                "## Phase 3: Implementation Summary": [
                    "## Phase 3",
                    "## Implementation",
                ],
                "## Phase 4: Test Summary": ["## Phase 4", "## Test"],
                "## Phase 5: Review Summary": ["## Phase 5", "## Review"],
            };
            const alts = altMarkers[spec.marker] ?? [spec.marker];
            const found = alts.some((alt) => content.toLowerCase().includes(alt.toLowerCase()));
            if (!found) {
                return {
                    allowed: false,
                    message: `Missing '${spec.marker}' in ${spec.file}. Generate structured summary first.`,
                    suggestion: "Include: what completed, key decisions, issues, pending, next phase notes.",
                };
            }
        }
        return {
            allowed: true,
            message: `Phase ${phase - 1} compression complete.`,
        };
    },
};
//# sourceMappingURL=phase-compression.js.map