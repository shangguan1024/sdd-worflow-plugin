import { Phase, SddState } from "../state.js"

interface GateResult {
  allowed: boolean
  message?: string
  suggestion?: string
}

const BLOCKED_TOOLS_BY_PHASE: Record<number, string[]> = {
  [Phase.UNDERSTANDING]: ["bash", "edit", "write"],
  [Phase.REQUIREMENTS]: ["bash"],
  [Phase.PLANNING]: [],
  [Phase.DEVELOPMENT]: [],
  [Phase.INTEGRATION]: [],
  [Phase.REVIEW]: [],
  [Phase.PERSISTENCE]: [],
}

export function phaseGateMiddleware(
  phase: number,
  toolName: string,
  state: SddState
): GateResult {
  if (phase === Phase.INIT || phase === Phase.COMPLETED) {
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

  return { allowed: true }
}
