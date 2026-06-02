import { SddState } from "../state.js";
interface ConstitutionResult {
    allowed: boolean;
    message?: string;
}
export declare const constitutionMiddleware: {
    check(phase: number, state: SddState, projectDir: string): ConstitutionResult;
};
export {};
