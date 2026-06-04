import { SddState } from "../state.js";
export interface RollbackPlan {
    sddDocs: string[];
    relatedCode: string[];
    otherCode: string[];
    gitShaAtTarget?: string;
    currentSha?: string;
}
export interface RollbackResult {
    success: boolean;
    message: string;
    details: string[];
    otherCodeChanges?: string[];
}
export declare class RollbackHandler {
    private state;
    private projectDir;
    constructor(state: SddState, projectDir: string);
    planRollback(targetPhase: number): RollbackPlan;
    executeRollback(targetPhase: number, codeScope: string, confirmed: boolean): RollbackResult;
    private getHeadSha;
    private findShaAtPhase;
    private getChangedFilesSince;
    private getFeatureChangedFiles;
    private getTaskPlanFiles;
    private gitRestore;
    private writeCheckpoint;
}
