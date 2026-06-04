import { Phase } from "../state.js";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
export class PhaseOrchestrator {
    state;
    configLoader;
    projectDir;
    constructor(state, configLoader, projectDir) {
        this.state = state;
        this.configLoader = configLoader;
        this.projectDir = projectDir;
    }
    transitionTo(phase) {
        const from = this.state.currentPhase;
        const canTransition = this.configLoader.canTransition(from, phase);
        if (!canTransition) {
            return {
                success: false,
                message: `Cannot transition from Phase ${from} to Phase ${phase}. Invalid transition.`,
                from_phase: from,
                to_phase: phase,
                gate_approved: false,
            };
        }
        const success = this.state.transition(phase);
        if (!success) {
            return {
                success: false,
                message: `Transition failed. State unchanged.`,
                from_phase: from,
                to_phase: phase,
                gate_approved: false,
            };
        }
        this.state.approveGate(phase);
        if (this.state.featureName) {
            this.writeCheckpoint(this.state.featureName);
        }
        return {
            success: true,
            message: `Transitioned from Phase ${from} to Phase ${phase} (${this.state.getPhaseName()})`,
            from_phase: from,
            to_phase: phase,
            gate_approved: true,
        };
    }
    startFeature(featureName) {
        this.state.featureName = featureName;
        this.state.currentPhase = Phase.INIT;
        this.state.resetContextMonitor();
        this.state.gateApprovals = {};
        const featureDir = join(this.projectDir, "docs", "features", featureName);
        mkdirSync(featureDir, { recursive: true });
        mkdirSync(join(featureDir, ".sdd"), { recursive: true });
        this.writeCheckpoint(featureName);
        this.state.save();
        return {
            success: true,
            message: `Feature '${featureName}' started at Phase 0 (Research & Understanding)`,
            from_phase: -1,
            to_phase: Phase.INIT,
        };
    }
    completeFeature() {
        const from = this.state.currentPhase;
        const featureName = this.state.featureName;
        if (from !== Phase.PERSISTENCE) {
            return {
                success: false,
                message: `Cannot complete from Phase ${from}. Must be at Phase 6 (Persistence).`,
                from_phase: from,
                to_phase: Phase.COMPLETED,
            };
        }
        this.state.currentPhase = Phase.COMPLETED;
        this.state.save();
        const featureDir = join(this.projectDir, "docs", "features", featureName);
        mkdirSync(featureDir, { recursive: true });
        writeFileSync(join(featureDir, "COMPLETED"), new Date().toISOString(), "utf-8");
        return {
            success: true,
            message: `Feature '${featureName}' completed. Ready for merge.`,
            from_phase: from,
            to_phase: Phase.COMPLETED,
        };
    }
    getPhaseConfig(phase) {
        return this.configLoader.getPhaseConfig(phase);
    }
    getBlockedTools() {
        return this.configLoader.getBlockedTools(this.state.currentPhase);
    }
    writeCheckpoint(featureName) {
        const checkpointDir = join(this.projectDir, "docs", "features", featureName, ".sdd");
        mkdirSync(checkpointDir, { recursive: true });
        let gitSha;
        try {
            gitSha = execSync("git rev-parse HEAD", { cwd: this.projectDir, encoding: "utf-8" }).trim();
        }
        catch {
            gitSha = undefined;
        }
        writeFileSync(join(checkpointDir, "checkpoint.json"), JSON.stringify({
            feature: featureName,
            phase: String(this.state.currentPhase),
            phaseName: this.state.getPhaseName(),
            gateApprovals: this.state.gateApprovals,
            gitSha,
            updatedAt: new Date().toISOString(),
        }, null, 2), "utf-8");
        writeFileSync(join(checkpointDir, `checkpoint_phase${this.state.currentPhase}.json`), JSON.stringify({
            feature: featureName,
            phase: String(this.state.currentPhase),
            phaseName: this.state.getPhaseName(),
            gateApprovals: this.state.gateApprovals,
            gitSha,
            updatedAt: new Date().toISOString(),
        }, null, 2), "utf-8");
    }
}
//# sourceMappingURL=orchestrator.js.map