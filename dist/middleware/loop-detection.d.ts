import { SddState } from "../state.js";
interface LoopResult {
    message?: string;
    blocked?: boolean;
}
export declare const loopDetectionMiddleware: {
    afterEdit(toolName: string, args: Record<string, unknown>, state: SddState): LoopResult;
};
export {};
