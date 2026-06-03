import { Phase, SddState } from "../state.js"
import { ConfigLoader } from "../config/loader.js"

interface GateResult {
  allowed: boolean
  message?: string
  suggestion?: string
}

const BLOCKED_TOOLS_BY_PHASE: Record<number, string[]> = {
  [Phase.INIT]: ["bash", "edit"],
  [Phase.REQUIREMENTS]: ["bash"],
  [Phase.PLANNING]: [],
  [Phase.DEVELOPMENT]: [],
  [Phase.INTEGRATION]: [],
  [Phase.REVIEW]: [],
  [Phase.PERSISTENCE]: [],
}

function isPathAllowed(targetPath: string, allowedPaths: string[], featureName: string): boolean {
  if (allowedPaths.length === 0) return false

  const normalized = targetPath.replace(/\\/g, "/")

  for (const pattern of allowedPaths) {
    const resolved = pattern.replace("{feature}", featureName)
    if (normalized.includes(resolved)) {
      return true
    }
  }

  return false
}

export function phaseGateMiddleware(
  phase: number,
  toolName: string,
  toolArgs: Record<string, unknown>,
  state: SddState,
  configLoader: ConfigLoader
): GateResult {
  if (phase === Phase.COMPLETED) {
    return { allowed: true }
  }

  const blockedTools = BLOCKED_TOOLS_BY_PHASE[phase] ?? []
  if (blockedTools.includes(toolName)) {
    return {
      allowed: false,
      message: `Phase ${phase} (${state.getPhaseName()}): Cannot use ${toolName}. Current phase must be completed first.`,
      suggestion: "Use sdd-gate tool with action=approve to pass the current phase gate.",
    }
  }

  if (toolName === "write") {
    const targetPath = (toolArgs.filePath as string) ?? ""
    const allowedPaths = configLoader.getAllowedToolsPaths(phase)

    if (isPathAllowed(targetPath, allowedPaths, state.featureName)) {
      return { allowed: true }
    }

    if (allowedPaths.length > 0) {
      return {
        allowed: false,
        message: `Phase ${phase}: Cannot write to '${targetPath}'. Only paths matching ${allowedPaths.join(", ")} are allowed.`,
        suggestion: "Write to allowed paths only, or complete current phase first.",
      }
    }
  }

  return { allowed: true }
}

export { BLOCKED_TOOLS_BY_PHASE }
