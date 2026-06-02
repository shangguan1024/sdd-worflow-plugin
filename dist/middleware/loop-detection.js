const WARNING_THRESHOLD = 5;
const HARD_LIMIT = 15;
const EDIT_TOOLS = new Set(["edit", "write"]);
export const loopDetectionMiddleware = {
    afterEdit(toolName, args, state) {
        if (!EDIT_TOOLS.has(toolName))
            return {};
        const filePath = args.filePath || args.file_path || "";
        if (!filePath)
            return {};
        const count = state.perFileEdits[filePath] ?? 0;
        if (count >= HARD_LIMIT) {
            return {
                blocked: true,
                message: `Hard limit: ${filePath} edited ${count} times. Context may have drifted from original requirements.`,
            };
        }
        if (count >= WARNING_THRESHOLD) {
            return {
                message: `Warning: ${filePath} edited ${count} times. Verify implementation direction is correct.`,
            };
        }
        return {};
    },
};
//# sourceMappingURL=loop-detection.js.map