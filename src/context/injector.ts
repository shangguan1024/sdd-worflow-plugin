import { Phase, SddState } from "../state.js"
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { PHASE0_PROMPT } from "../prompts/phase0.js"
import { PHASE1_PROMPT } from "../prompts/phase1.js"
import { PHASE2_PROMPT } from "../prompts/phase2.js"
import { PHASE3_PROMPT } from "../prompts/phase3.js"
import { PHASE4_PROMPT } from "../prompts/phase4.js"
import { PHASE5_PROMPT } from "../prompts/phase5.js"
import { PHASE6_PROMPT } from "../prompts/phase6.js"
import { CORE_PROMPT } from "../prompts/core.js"

const PHASE_PROMPTS: Record<number, string> = {
  [Phase.UNDERSTANDING]: PHASE0_PROMPT,
  [Phase.REQUIREMENTS]: PHASE1_PROMPT,
  [Phase.PLANNING]: PHASE2_PROMPT,
  [Phase.DEVELOPMENT]: PHASE3_PROMPT,
  [Phase.INTEGRATION]: PHASE4_PROMPT,
  [Phase.REVIEW]: PHASE5_PROMPT,
  [Phase.PERSISTENCE]: PHASE6_PROMPT,
}

export const contextInjector = {
  getPhasePrompt(phase: number, state: SddState): string {
    const phaseSpecific = PHASE_PROMPTS[phase] ?? ""
    return `${CORE_PROMPT}\n\n${phaseSpecific}\n\nCurrent Phase: ${phase} (${state.getPhaseName()})\nFeature: ${state.featureName}`
  },

  injectMemoryContext(phase: number, state: SddState, projectDir: string): string {
    const parts: string[] = []

    const constitutionFile = join(projectDir, "CONSTITUTION", "core.md")
    if (existsSync(constitutionFile)) {
      parts.push("## Core Principles (Mandatory)\n\n" + readFileSync(constitutionFile, "utf-8"))
    }

    const agentsFile = join(projectDir, "AGENTS.md")
    if (existsSync(agentsFile)) {
      const content = readFileSync(agentsFile, "utf-8")
      parts.push(content.slice(0, 2000))
    }

    if (state.featureName) {
      const featureDir = join(projectDir, "docs", "features", state.featureName)
      for (const filename of ["findings.md", "task_plan.md", "design-doc.md"]) {
        const filepath = join(featureDir, filename)
        if (existsSync(filepath)) {
          const content = readFileSync(filepath, "utf-8")
          const phaseSection = extractPhaseSection(content, phase)
          if (phaseSection) {
            parts.push(`## ${filename} (Phase ${phase} excerpt)\n\n${phaseSection}`)
          } else {
            parts.push(`## ${filename} (excerpt)\n\n${content.slice(0, 1500)}`)
          }
        }
      }
    }

    return parts.join("\n\n---\n\n")
  },
}

function extractPhaseSection(content: string, phase: number): string {
  const markers = [`## Phase ${phase}:`, `## Phase ${phase}`]
  for (const marker of markers) {
    const idx = content.indexOf(marker)
    if (idx >= 0) {
      const nextIdx = content.indexOf("\n## ", idx + marker.length)
      const end = nextIdx < 0 ? content.length : nextIdx
      return content.slice(idx, end).trim()
    }
  }
  return ""
}
