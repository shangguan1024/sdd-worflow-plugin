export declare enum Phase {
    INIT = 0,
    UNDERSTANDING = -1,
    REQUIREMENTS = 1,
    PLANNING = 2,
    DEVELOPMENT = 3,
    INTEGRATION = 4,
    REVIEW = 5,
    PERSISTENCE = 6,
    COMPLETED = 7
}
export declare const PHASE_NAMES: Record<number, string>;
export interface SddStateData {
    currentPhase: number;
    featureName: string;
    sessionId: string;
    editCount: number;
    taskCount: number;
    perFileEdits: Record<string, number>;
    lastRefreshAtEdit: number;
    lastRefreshAtTask: number;
    refreshCount: number;
    refreshHistory: Array<Record<string, unknown>>;
    gateApprovals: Record<number, boolean>;
    qualityProfile: string;
}
export declare class SddState {
    currentPhase: Phase;
    featureName: string;
    sessionId: string;
    editCount: number;
    taskCount: number;
    perFileEdits: Record<string, number>;
    lastRefreshAtEdit: number;
    lastRefreshAtTask: number;
    refreshCount: number;
    refreshHistory: Array<Record<string, unknown>>;
    gateApprovals: Record<number, boolean>;
    qualityProfile: string;
    private stateDir;
    private projectDir;
    constructor(projectDir: string);
    load(): Promise<void>;
    save(): void;
    getState(): SddStateData;
    canTransition(from: Phase, to: Phase): boolean;
    transition(to: Phase): boolean;
    approveGate(phase: Phase): void;
    isGateApproved(phase: Phase): boolean;
    getPhaseName(): string;
    resetContextMonitor(): void;
    recordEdit(filePath: string): void;
    recordTask(taskName: string): void;
    markRefreshed(): void;
    getProjectDir(): string;
    isInitialized(): boolean;
}
