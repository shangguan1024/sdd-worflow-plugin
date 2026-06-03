import { SddState } from "./state.js";
export interface CommandResult {
    success: boolean;
    message: string;
    details?: string[];
}
export declare class Director {
    private state;
    private projectDir;
    private initializer;
    private gateChecker;
    private phaseOrchestrator;
    private configLoader;
    private rollbackHandler;
    constructor(projectDir: string, state: SddState);
    executeCommand(cmd: string, args: Record<string, unknown>): Promise<CommandResult>;
    private initialize;
    private startFeature;
    private resumeFeature;
    private showStatus;
    private complete;
    private gateOperation;
    checkGateRequirements(phase: number): CommandResult;
    private refreshContext;
    private dispatchSkill;
    private rollbackOperation;
    private listActiveFeatures;
}
