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
    constructor(projectDir: string, state: SddState);
    executeCommand(cmd: string, args: Record<string, unknown>): Promise<CommandResult>;
    private initialize;
    private startFeature;
    private resumeFeature;
    private showStatus;
    private complete;
    private gateOperation;
    private refreshContext;
    private listActiveFeatures;
}
