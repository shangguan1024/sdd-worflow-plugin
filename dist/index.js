import { Director } from "./director.js";
import { SddState, Phase } from "./state.js";
import { phaseGateMiddleware } from "./middleware/phase-gate.js";
import { loopDetectionMiddleware } from "./middleware/loop-detection.js";
import { artifactCheckMiddleware } from "./middleware/artifact-check.js";
import { phaseCompressionMiddleware } from "./middleware/phase-compression.js";
import { contextMonitorMiddleware } from "./middleware/context-monitor.js";
import { toolDefinitions } from "./tools/definitions.js";
import { contextInjector } from "./context/injector.js";
import { SkillDispatcher } from "./skill/dispatcher.js";
import { ConfigLoader } from "./config/loader.js";
const SddWorkflowPlugin = async ({ project, client, $, directory, worktree }, options) => {
    const state = new SddState(directory);
    await state.load();
    const director = new Director(directory, state);
    const configLoader = new ConfigLoader(directory);
    const skillDispatcher = new SkillDispatcher(configLoader, state);
    return {
        tool: toolDefinitions(director, state),
        "tool.execute.before": async (input, output) => {
            const toolName = input.tool;
            const phase = state.currentPhase;
            if (phase === Phase.INIT)
                return;
            const gateResult = phaseGateMiddleware(phase, toolName, output.args ?? {}, state, configLoader);
            if (!gateResult.allowed) {
                output.args = {
                    ...output.args,
                    _sdd_blocked: true,
                    _sdd_gate_message: gateResult.message,
                    _sdd_gate_suggestion: gateResult.suggestion,
                };
                return;
            }
            if (phase >= Phase.REQUIREMENTS) {
                const compressionResult = phaseCompressionMiddleware.check(phase, state, directory);
                if (!compressionResult.allowed) {
                    output.args = {
                        ...output.args,
                        _sdd_blocked: true,
                        _sdd_compression_message: compressionResult.message,
                        _sdd_compression_suggestion: compressionResult.suggestion,
                    };
                    return;
                }
            }
            const artifactResult = artifactCheckMiddleware.check(phase, state, directory);
            if (!artifactResult.allowed) {
                output.args = {
                    ...output.args,
                    _sdd_blocked: true,
                    _sdd_artifact_message: artifactResult.message,
                };
                return;
            }
            const loopResult = loopDetectionMiddleware.afterEdit(toolName, output.args ?? {}, state);
            if (loopResult.blocked) {
                output.args = {
                    ...output.args,
                    _sdd_blocked: true,
                    _sdd_loop_message: loopResult.message,
                };
                return;
            }
            if (loopResult.message) {
                output.args = {
                    ...output.args,
                    _sdd_loop_warning: loopResult.message,
                };
            }
        },
        "tool.execute.after": async (input, output) => {
            const toolName = input.tool;
            contextMonitorMiddleware.recordEdit(toolName, input.args ?? {}, state);
            if (contextMonitorMiddleware.shouldRefresh(state)) {
                const refreshContent = contextMonitorMiddleware.generateRefresh(state, directory);
                output.metadata = {
                    ...output.metadata,
                    _sdd_context_refresh: refreshContent,
                };
                state.markRefreshed();
            }
        },
        "experimental.chat.system.transform": async (_input, output) => {
            const phase = state.currentPhase;
            if (phase === Phase.INIT || phase === Phase.COMPLETED) {
                return;
            }
            const skeleton = contextInjector.getPhaseSkeleton(phase, state);
            const skillResult = skillDispatcher.dispatchForCurrentPhase();
            const skillInstruction = skillResult.success ? skillResult.instruction : "";
            const fileHints = contextInjector.injectFileHints(phase, state, directory);
            output.system.push(`${skeleton}\n\n${skillInstruction}\n\n${fileHints}`);
        },
        "experimental.session.compacting": async (_input, output) => {
            const phase = state.currentPhase;
            const compressionResult = phaseCompressionMiddleware.check(phase, state, directory);
            if (!compressionResult.allowed && compressionResult.message) {
                output.context.push(compressionResult.message);
            }
        },
        "command.execute.before": async (input, output) => {
            const command = input.command ?? "";
            if (command.startsWith("sdd ")) {
                const cmd = command.slice(4).trim();
                const result = await director.executeCommand(cmd, {});
                const text = result.success
                    ? `[OK] ${result.message}${result.details ? "\n" + result.details.map((d) => `  ${d}`).join("\n") : ""}`
                    : `[FAIL] ${result.message}${result.details ? "\n" + result.details.map((d) => `  ${d}`).join("\n") : ""}`;
                output.parts = [
                    {
                        type: "text",
                        text,
                    },
                ];
            }
        },
        event: async (input) => {
            const eventType = input.event.type;
            if (eventType === "session.created" || eventType === "session.status") {
                state.resetContextMonitor();
            }
        },
        config: async (cfg) => {
            const instructions = cfg.instructions ?? [];
            if (!instructions.includes("AGENTS.md")) {
                instructions.push("AGENTS.md");
                cfg.instructions = instructions;
            }
        },
    };
};
export default SddWorkflowPlugin;
export { SddWorkflowPlugin };
//# sourceMappingURL=index.js.map