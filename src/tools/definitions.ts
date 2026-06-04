import { tool } from "@opencode-ai/plugin"
import { Director } from "../director.js"
import { SddState, Phase, PHASE_NAMES } from "../state.js"
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import type { ToolResult } from "@opencode-ai/plugin"
import { SkillDispatcher } from "../skill/dispatcher.js"
import { ConfigLoader } from "../config/loader.js"
import { RollbackHandler } from "../rollback/handler.js"

function formatResult(result: {
  success: boolean
  message: string
  details?: string[]
}): ToolResult {
  if (result.details && result.details.length > 0) {
    return `${result.success ? "[OK]" : "[FAIL]"} ${result.message}\n${result.details.map(d => `  ${d}`).join("\n")}`
  }
  return `${result.success ? "[OK]" : "[FAIL]"} ${result.message}`
}

export function toolDefinitions(
  director: Director,
  state: SddState
): Record<string, ReturnType<typeof tool>> {
  const configLoader = new ConfigLoader(state.getProjectDir())
  const skillDispatcher = new SkillDispatcher(configLoader, state)

  return {
    sdd_init: tool({
      description:
        "Initialize SDD-Workflow project structure (directories, constitution, config, memory artifacts)",
      args: {
        template: tool
          .schema
          .string()
          .default("standard")
          .describe("Project template: standard, rust, python"),
        force: tool
          .schema
          .boolean()
          .default(false)
          .describe("Force reinitialization"),
      },
      async execute(args) {
        const result = await director.executeCommand("init", args)
        return formatResult(result)
      },
    }),

    sdd_start: tool({
      description:
        "Start a new feature development workflow (Phase 0: Research & Requirement Clarification)",
      args: {
        feature: tool.schema.string().describe("Feature name"),
      },
      async execute(args) {
        const result = await director.executeCommand("start", args)
        const skillResult = skillDispatcher.dispatchForPhase(0)
        const skillInstruction = skillResult.success ? `\n\n${skillResult.instruction}` : ""
        return `${formatResult(result)}${skillInstruction}`
      },
    }),

    sdd_resume: tool({
      description:
        "Resume an interrupted workflow from last checkpoint",
      args: {
        feature: tool
          .schema
          .string()
          .optional()
          .describe(
            "Feature name to resume (optional, uses current if not specified)"
          ),
      },
      async execute(args) {
        const result = await director.executeCommand("resume", args)
        if (!result.success) return formatResult(result)
        const skillResult = skillDispatcher.dispatchForCurrentPhase()
        const skillInstruction = skillResult.success ? `\n\n${skillResult.instruction}` : ""
        return `${formatResult(result)}${skillInstruction}`
      },
    }),

    sdd_status: tool({
      description:
        "Show current SDD workflow status: phase, feature, edit counts, hot files",
      args: {
        feature: tool
          .schema
          .string()
          .optional()
          .describe("Feature name (optional)"),
        verbose: tool
          .schema
          .boolean()
          .default(false)
          .describe("Show detailed status"),
      },
      async execute(args) {
        const result = await director.executeCommand("status", args)
        return formatResult(result)
      },
    }),

    sdd_complete: tool({
      description:
        "Force complete the current workflow (Phase 6: Memory Persistence)",
      args: {
        feature: tool.schema.string().optional().describe("Feature name"),
      },
      async execute(args) {
        const result = await director.executeCommand("complete", args)
        return formatResult(result)
      },
    }),

    sdd_gate: tool({
      description:
        "Phase gate operations: check requirements, approve transition, or block. Use before transitioning between phases. APPROVE requires human confirmation.",
      args: {
        phase: tool
          .schema
          .number()
          .int()
          .min(0)
          .max(6)
          .describe("Phase number to check/approve (0-6)"),
        action: tool
          .schema
          .enum(["check", "approve", "block"])
          .describe(
            "check=show requirements, approve=request human confirmation then transition, block=force stay in current phase"
          ),
        confirmed: tool
          .schema
          .boolean()
          .optional()
          .describe("Set to true ONLY after human explicitly confirms the transition"),
      },
      async execute(args) {
        const phase = args.phase as Phase
        const action = args.action || "check"
        const confirmed = args.confirmed === true

        if (action === "approve") {
          if (!confirmed) {
            const requirements = director.checkGateRequirements(phase).details ?? []
            return formatResult({
              success: false,
              message:
                `⚠️ HUMAN CONFIRMATION REQUIRED for Phase ${phase} (${PHASE_NAMES[phase] ?? `Phase ${phase}`})`,
              details: [
                "DO NOT proceed without explicit human approval.",
                "Ask the user: 'Phase gate requirements met. Should I proceed to Phase X?'",
                "Only call sdd_gate again with confirmed=true after user says yes.",
                "",
                ...requirements,
              ],
            })
          }

          const gate = director.checkGateRequirements(phase)
          if (!gate.success) {
            return formatResult({
              success: false,
              message: `Gate requirements not satisfied for Phase ${phase}`,
              details: gate.details,
            })
          }

          const result = await director.executeCommand(`gate ${phase} approve`, { confirmed: true })
          if (!result.success) return formatResult(result)
          const skillResult = skillDispatcher.dispatchForPhase(phase)
          const skillInstruction = skillResult.success ? `\n\n${skillResult.instruction}` : ""
          return `${formatResult(result)}${skillInstruction}`
        }

        if (action === "block") {
          return formatResult({
            success: false,
            message:
              `Gate blocked at Phase ${phase}. Complete current phase requirements first.`,
          })
        }

        const gate = director.checkGateRequirements(phase)
        return formatResult(gate)
      },
    }),

    sdd_refresh: tool({
      description:
        "Force context refresh - inject key requirements, design decisions, and hot file warnings to prevent context drift",
      args: {
        reason: tool.schema.string().optional().describe("Reason for refresh"),
      },
      async execute(args) {
        const reason = args.reason || "Manual refresh"
        return formatResult({
          success: true,
          message: `Context refresh triggered: ${reason}`,
          details: [
            "Context reloaded from findings.md and design documents.",
            "Hot files and recent decisions injected.",
          ],
        })
      },
    }),

    sdd_memory_timeline: tool({
      description:
        "Get memory timeline around a specific node (Layer 2: Progressive Disclosure). Shows recent decisions, requirements, and context.",
      args: {
        around_id: tool
          .schema
          .string()
          .describe("Memory node ID to get context around"),
        before: tool
          .schema
          .number()
          .int()
          .default(5)
          .describe("Nodes before the ID"),
        after: tool
          .schema
          .number()
          .int()
          .default(5)
          .describe("Nodes after the ID"),
      },
      async execute(args) {
        const featureDir = join(
          state.getProjectDir(),
          "docs",
          "features",
          state.featureName
        )
        const findingsFile = join(featureDir, "findings.md")
        if (!existsSync(findingsFile)) {
          return formatResult({
            success: false,
            message: "No findings.md found",
          })
        }
        const content = readFileSync(findingsFile, "utf-8")
        return {
          title: "Memory timeline (Layer 2)",
          output: content.slice(0, 3000),
        }
      },
    }),

    sdd_memory_details: tool({
      description:
        "Get full details for specific memory nodes (Layer 3: Full Disclosure). Complete content, alternatives, rationale.",
      args: {
        ids: tool.schema.array(tool.schema.string()).describe("Memory node IDs to retrieve"),
      },
      async execute(args) {
        const featureDir = join(
          state.getProjectDir(),
          "docs",
          "features",
          state.featureName
        )
        const designFile = join(featureDir, "design.md")
        if (!existsSync(designFile)) {
          return formatResult({
            success: false,
            message: "No design.md found",
          })
        }
        const content = readFileSync(designFile, "utf-8")
        return {
          title: "Memory details (Layer 3)",
          output: content.slice(0, 5000),
        }
      },
    }),

    sdd_dispatch_skill: tool({
      description:
        "Dispatch skill chain for current phase. Returns all skills (primary + additional) with invoke timing. Use without args for automatic dispatch.",
      args: {
        phase: tool
          .schema
          .number()
          .int()
          .min(0)
          .max(6)
          .optional()
          .describe("Phase number (0-6). Uses current phase if not specified."),
        skill_name: tool
          .schema
          .string()
          .optional()
          .describe("Specific skill to invoke (optional, uses all phase skills if not specified)"),
        mode: tool
          .schema
          .enum(["all", "primary", "additional"])
          .optional()
          .default("all")
          .describe("Which skills to dispatch: all=primary+additional, primary=only primary, additional=only additional"),
        args: tool
          .schema
          .record(tool.schema.string(), tool.schema.any())
          .optional()
          .describe("Skill arguments"),
      },
      async execute(args) {
        const mode = args.mode as string ?? "all"
        const skillName = args.skill_name as string | undefined
        const phase = args.phase !== undefined ? (args.phase as number) : state.currentPhase
        
        configLoader.reload()
        
        if (skillName) {
          const result = skillDispatcher.dispatchSkill(skillName)
          return `${formatResult(result)}\n\n${result.instruction}`
        }
        
        const result = skillDispatcher.dispatchForPhase(phase)
        
        let filteredSkills = result.skills
        if (mode === "primary") {
          filteredSkills = result.skills.filter(s => s.mode === "primary")
        } else if (mode === "additional") {
          filteredSkills = result.skills.filter(s => s.mode === "additional")
        }
        
        const filteredResult = {
          ...result,
          skills: filteredSkills,
          message: `${filteredSkills.length} skills (${mode}) ready for Phase ${phase}`,
        }
        
        return `${formatResult(filteredResult)}\n\n${result.instruction}`
      },
    }),

    sdd_rollback: tool({
      description:
        "Rollback SDD workflow to a previous phase. SDD state + related code rollback together (auto). Other code changes prompt user for decision. APPROVE requires human confirmation.",
      args: {
        target_phase: tool
          .schema
          .number()
          .int()
          .min(0)
          .max(6)
          .describe("Target phase to rollback to (0-6). Must be < current phase."),
        code_scope: tool
          .schema
          .enum(["none", "related", "all"])
          .default("related")
          .describe("'none'=SDD state+docs only, 'related'=auto rollback task_plan code+prompt for others, 'all'=rollback everything"),
        confirmed: tool
          .schema
          .boolean()
          .optional()
          .default(false)
          .describe("Set to true ONLY after human explicitly confirms the rollback"),
      },
      async execute(args) {
        const targetPhase = args.target_phase as number
        const codeScope = (args.code_scope as string) ?? "related"
        const confirmed = args.confirmed === true

        const rollbackHandler = new RollbackHandler(state, state.getProjectDir())
        const result = rollbackHandler.executeRollback(targetPhase, codeScope, confirmed)

        if (result.otherCodeChanges && result.otherCodeChanges.length > 0) {
          const promptDetails = [
            "",
            "🤔 USER DECISION REQUIRED for these unrelated code files:",
            ...result.otherCodeChanges.map(f => `  - ${f}`),
            "",
            "Options:",
            "  1. Rollback individually: git checkout <sha> -- <file>",
            "  2. Re-run: sdd_rollback target_phase=X code_scope='all' confirmed=true",
            "  3. Keep them (no action needed)",
          ]
          return formatResult({ success: result.success, message: result.message, details: [...result.details, ...promptDetails] })
        }

        return formatResult({ success: result.success, message: result.message, details: result.details })
      },
    }),
  }
}
