import { Phase } from "../state.js";
const BLOCKED_TOOLS_BY_PHASE = {
    [Phase.INIT]: ["bash", "edit"],
    [Phase.REQUIREMENTS]: ["bash"],
    [Phase.PLANNING]: [],
    [Phase.DEVELOPMENT]: [],
    [Phase.INTEGRATION]: [],
    [Phase.REVIEW]: [],
    [Phase.PERSISTENCE]: [],
};
function isPathAllowed(targetPath, allowedPaths, featureName) {
    if (allowedPaths.length === 0)
        return false;
    const normalized = targetPath.replace(/\\/g, "/");
    for (const pattern of allowedPaths) {
        const resolved = pattern.replace("{feature}", featureName);
        if (normalized.includes(resolved)) {
            return true;
        }
    }
    return false;
}
export function phaseGateMiddleware(phase, toolName, toolArgs, state, configLoader) {
    if (phase === Phase.COMPLETED) {
        return { allowed: true };
    }
    const blockedTools = BLOCKED_TOOLS_BY_PHASE[phase] ?? [];
    if (blockedTools.includes(toolName)) {
        return {
            allowed: false,
            message: `Phase ${phase} (${state.getPhaseName()}): Cannot use ${toolName}. Current phase must be completed first.`,
            suggestion: "Use sdd-gate tool with action=approve to pass the current phase gate.",
        };
    }
    if (toolName === "write") {
        const targetPath = toolArgs.filePath ?? "";
        const allowedPaths = configLoader.getAllowedToolsPaths(phase);
        if (isPathAllowed(targetPath, allowedPaths, state.featureName)) {
            return { allowed: true };
        }
        if (allowedPaths.length > 0) {
            return {
                allowed: false,
                message: `Phase ${phase}: Cannot write to '${targetPath}'. Only paths matching ${allowedPaths.join(", ")} are allowed.`,
                suggestion: "Write to allowed paths only, or complete current phase first.",
            };
        }
    }
    return { allowed: true };
}
export { BLOCKED_TOOLS_BY_PHASE };
//# sourceMappingURL=phase-gate.js.map