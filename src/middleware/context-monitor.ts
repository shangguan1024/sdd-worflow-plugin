import { SddState } from "../state.js"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

const EDITS_BETWEEN_REFRESH = 20
const TASKS_BETWEEN_REFRESH = 3
const SAME_FILE_WARNING = 5

export const contextMonitorMiddleware = {
  recordEdit(
    toolName: string,
    args: Record<string, unknown>,
    state: SddState
  ): void {
    const editTools = new Set(["edit", "write", "bash"])
    if (!editTools.has(toolName)) return

    const filePath =
      (args.filePath as string) || (args.file_path as string) || ""
    if (filePath) {
      state.recordEdit(filePath)
    }
  },

  shouldRefresh(state: SddState): boolean {
    const editsSince = state.editCount - state.lastRefreshAtEdit
    const tasksSince = state.taskCount - state.lastRefreshAtTask

    if (editsSince >= EDITS_BETWEEN_REFRESH) return true
    if (tasksSince >= TASKS_BETWEEN_REFRESH) return true

    for (const count of Object.values(state.perFileEdits)) {
      if (count >= SAME_FILE_WARNING) return true
    }

    return false
  },

  generateRefresh(state: SddState, projectDir: string): string {
    const featureDir = join(
      projectDir,
      "docs",
      "features",
      state.featureName
    )
    const lines: string[] = []
    const sep = "=".repeat(60)

    lines.push(`\n${sep}`)
    lines.push(`  CONTEXT REFRESH #${state.refreshCount + 1}`)
    lines.push(`  Edits: ${state.editCount} | Tasks: ${state.taskCount}`)
    lines.push(sep)
    lines.push("")

    lines.push("## Feature Goal")
    lines.push(`Feature: ${state.featureName}`)

    const findingsFile = join(featureDir, "findings.md")
    if (existsSync(findingsFile)) {
      lines.push("\n## Key Requirements & Constraints")
      const content = readFileSync(findingsFile, "utf-8")
      const phase0Section = extractSection(
        content,
        ["## Phase 0: Requirement Clarification", "## Requirement Clarification"],
        500
      )
      if (phase0Section) {
        lines.push(phase0Section)
      }
    }

    const hotFiles = Object.entries(state.perFileEdits)
      .filter(([, c]) => c >= SAME_FILE_WARNING)
      .sort(([, a], [, b]) => b - a)

    if (hotFiles.length > 0) {
      lines.push("\n## Hot Files")
      for (const [fp, count] of hotFiles) {
        lines.push(`  - ${fp} (${count} edits)`)
      }
    }

    lines.push("\n## Verify")
    lines.push(
      "Are requirements and design decisions still consistent? Is implementation direction correct?"
    )
    lines.push(sep)

    return lines.join("\n")
  },
}

function extractSection(
  content: string,
  markers: string[],
  maxChars: number
): string {
  for (const marker of markers) {
    const idx = content.indexOf(marker)
    if (idx >= 0) {
      const nextIdx = content.indexOf("\n## ", idx + marker.length)
      const end =
        nextIdx < 0
          ? Math.min(idx + maxChars, content.length)
          : Math.min(nextIdx, idx + maxChars)
      return content.slice(idx, end).trim()
    }
  }
  return ""
}
