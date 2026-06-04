export interface PhaseConfig {
    id: number;
    name: string;
    blocked_tools: string[];
    allowed_tools: string[];
    skill?: string;
    skills?: string[];
    additional_skills?: string[];
    allowed_tools_paths?: string[];
    required_files: string[];
    required_sections: string[];
    gate_requirements: string[];
}
export interface WorkflowConfig {
    version: string;
    phases: PhaseConfig[];
    transitions: Record<string, number[]>;
    thresholds: {
        edit_warning: number;
        edit_hard_limit: number;
        refresh_interval: number;
    };
}
export declare class ConfigLoader {
    private config;
    private projectDir;
    constructor(projectDir: string);
    private loadConfig;
    private mergeConfig;
    private mergeSkills;
    getConfig(): WorkflowConfig;
    getPhaseConfig(phaseId: number): PhaseConfig | undefined;
    getBlockedTools(phaseId: number): string[];
    getSkill(phaseId: number): string | undefined;
    getSkills(phaseId: number): string[];
    getAdditionalSkills(phaseId: number): string[];
    getSkillInvokeMode(phaseId: number): string;
    getAllowedToolsPaths(phaseId: number): string[];
    getAllSkills(phaseId: number): string[];
    canTransition(from: number, to: number): boolean;
    getThresholds(): {
        edit_warning: number;
        edit_hard_limit: number;
        refresh_interval: number;
    };
    reload(): void;
}
