import { SddState } from "../state.js";
interface ArtifactResult {
    allowed: boolean;
    message?: string;
    missing?: string[];
}
export declare const artifactCheckMiddleware: {
    check(phase: number, state: SddState, projectDir: string): ArtifactResult;
};
export {};
