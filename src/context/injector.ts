import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { Phase, SddState, PHASE_SKILLS } from "../state.js"

function getSkillDocsForPhase(phase: number): string[] {
  const docs: string[] = ["phases-reference.md"]
  
  if (phase === Phase.REQUIREMENTS) {
    docs.push("design-doc-template.md")
    docs.push("interface-example.md")
    docs.push("dependency-example.md")
  }
  
  docs.push("visualization-guide.md")
  
  return docs
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

export const contextInjector = {
  getPhasePrompt(phase: number, state: SddState): string {
    const skillName = PHASE_SKILLS[phase]
    const skillDocs = getSkillDocsForPhase(phase)
    
    let prompt = `
## Phase ${phase}: ${state.getPhaseName()}

**Current Feature**: ${state.featureName || "Not set"}

### Step 0: Read Skill Documentation (MANDATORY)
Before executing this phase, READ these Skill documents:
${skillDocs.map(doc => `- ${doc}`).join("\n")}

Skill documents are located in ~/.config/opencode/skills/sdd-workflow/

### Step 1: Invoke Recommended Skill
${skillName ? `Recommended: skill("${skillName}")` : "No specific skill recommended."}

${skillName ? `
Invoke skill by:
- Calling skill("${skillName}") tool
- Or saying: "Use ${skillName} skill"
` : ""}

### Step 2: Execute Phase Tasks
See phases-reference.md for detailed execution steps.

### Step 3: Gate Approval
When phase tasks complete:
- sdd_gate phase=${phase + 1} action=check
- sdd_gate phase=${phase + 1} action=approve (requires user confirmation)
`

    return prompt
  },

  injectMemoryContext(phase: number, state: SddState, projectDir: string): string {
    const parts: string[] = []

    const constitutionFile = join(projectDir, "CONSTITUTION", "core.md")
    if (existsSync(constitutionFile)) {
      parts.push("## Core Principles (Mandatory)\n\n" + readFileSync(constitutionFile, "utf-8").slice(0, 1000))
    }

    const agentsFile = join(projectDir, "AGENTS.md")
    if (existsSync(agentsFile)) {
      const content = readFileSync(agentsFile, "utf-8")
      parts.push(content.slice(0, 2000))
    }

    if (state.featureName) {
      const featureDir = join(projectDir, "docs", "features", state.featureName)
      for (const filename of ["findings.md", "task_plan.md", "design.md"]) {
        const filepath = join(featureDir, filename)
        if (existsSync(filepath)) {
          const content = readFileSync(filepath, "utf-8")
          const phaseSection = extractPhaseSection(content, phase)
          if (phaseSection) {
            parts.push(`## ${filename} (Phase ${phase} excerpt)\n\n${phaseSection.slice(0, 500)}`)
          } else {
            parts.push(`## ${filename} (excerpt)\n\n${content.slice(0, 1000)}`)
          }
        }
      }
    }

    parts.push(`
## Skill Documentation Reminder
Read Skill documents before executing phase:
- phases-reference.md (detailed steps)
- design-doc-template.md (for Phase 1)
- interface-example.md (for Phase 1)
- dependency-example.md (for Phase 1)
`)

    return parts.join("\n\n---\n\n")
  },

  injectSkillDocPaths(): string {
    return `
## Skill Documentation Paths

| Phase | Document | Purpose |
|-------|----------|---------|
| All | phases-reference.md | Phase 0-6 detailed steps |
| 1 | design-doc-template.md | Total-Part design structure |
| 1 | interface-example.md | 8-dimension interface |
| 1 | dependency-example.md | 5-dimension dependency |
| All | visualization-guide.md | PlantUML/Mermaid |
`
  }
}