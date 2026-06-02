import { SddState } from "../state.js"

interface LoopResult {
  message?: string
  blocked?: boolean
}

const WARNING_THRESHOLD = 5
const HARD_LIMIT = 15
const EDIT_TOOLS = new Set(["edit", "write"])

export const loopDetectionMiddleware = {
  afterEdit(
    toolName: string,
    args: Record<string, unknown>,
    state: SddState
  ): LoopResult {
    if (!EDIT_TOOLS.has(toolName)) return {}

    const filePath =
      (args.filePath as string) || (args.file_path as string) || ""
    if (!filePath) return {}

    const count = state.perFileEdits[filePath] ?? 0

    if (count >= HARD_LIMIT) {
      return {
        blocked: true,
        message: `Hard limit: ${filePath} edited ${count} times. Context may have drifted from original requirements.`,
      }
    }

    if (count >= WARNING_THRESHOLD) {
      return {
        message: `Warning: ${filePath} edited ${count} times. Verify implementation direction is correct.`,
      }
    }

    return {}
  },
}
