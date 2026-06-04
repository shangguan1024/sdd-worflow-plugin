import { SddState } from "../state.js";
import { ConfigLoader } from "../config/loader.js";
export interface GateResult {
    success: boolean;
    message: string;
    details?: string[];
    missing?: string[];
}
export declare class GateChecker {
    private state;
    private configLoader;
    private projectDir;
    constructor(state: SddState, configLoader: ConfigLoader, projectDir: string);
    checkGate(phase: number): GateResult;
    private checkPhase0Gate;
    private checkPhase1Gate;
    private checkPhase2Gate;
    private checkPhase3Gate;
    private checkPhase4Gate;
    private checkPhase5Gate;
    private checkPhase6Gate;
    private requireFile;
    private requireSection;
}
