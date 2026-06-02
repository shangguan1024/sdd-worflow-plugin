import { SddState } from "../state.js";
interface CompressionResult {
    allowed: boolean;
    message?: string;
    suggestion?: string;
}
export declare const phaseCompressionMiddleware: {
    check(phase: number, state: SddState, projectDir: string): CompressionResult;
};
export {};
