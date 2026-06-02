import { Phase } from "../state.js";
const BLOCKED_TOOLS_BY_PHASE = {
    [Phase.INIT]: ["bash", "edit", "write"],
    [Phase.REQUIREMENTS]: ["bash"],
    [Phase.PLANNING]: [],
    [Phase.DEVELOPMENT]: [],
    [Phase.INTEGRATION]: [],
    [Phase.REVIEW]: [],
    [Phase.PERSISTENCE]: [],
};
export function phaseGateMiddleware(phase, toolName, state) {
    if (phase === Phase.INIT || phase === Phase.COMPLETED) {
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
    return { allowed: true };
}
//# sourceMappingURL=phase-gate.js.map