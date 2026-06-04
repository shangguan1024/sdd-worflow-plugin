import { ConfigLoader } from "../config/loader.js";
import { SddState } from "../state.js";
export interface SkillDispatchResult {
    success: boolean;
    message: string;
    skills: SkillInvocation[];
    instruction: string;
}
export interface SkillInvocation {
    name: string;
    mode: "primary" | "additional";
    description: string;
}
export declare class SkillDispatcher {
    private configLoader;
    private state;
    constructor(configLoader: ConfigLoader, state: SddState);
    dispatchForCurrentPhase(): SkillDispatchResult;
    dispatchForPhase(phase: number): SkillDispatchResult;
    dispatchSkill(skillName: string): SkillDispatchResult;
    getRecommendedSkill(): string | undefined;
    getAdditionalSkills(): string[];
    private generateInstruction;
    getSkillDescription(skillName: string): string;
}
