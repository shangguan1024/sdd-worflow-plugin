import { Phase, SddState } from "../state.js";
import { ConfigLoader } from "../config/loader.js";
export interface TransitionResult {
    success: boolean;
    message: string;
    from_phase: number;
    to_phase: number;
    gate_approved?: boolean;
}
export declare class PhaseOrchestrator {
    private state;
    private configLoader;
    private projectDir;
    constructor(state: SddState, configLoader: ConfigLoader, projectDir: string);
    transitionTo(phase: Phase): TransitionResult;
    startFeature(featureName: string): TransitionResult;
    completeFeature(): TransitionResult;
    getPhaseConfig(phase: number): import("../config/loader.js").PhaseConfig;
    getBlockedTools(): string[];
    private writeCheckpoint;
}
