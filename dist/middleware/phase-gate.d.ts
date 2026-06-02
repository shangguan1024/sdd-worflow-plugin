import { SddState } from "../state.js";
interface GateResult {
    allowed: boolean;
    message?: string;
    suggestion?: string;
}
export declare function phaseGateMiddleware(phase: number, toolName: string, state: SddState): GateResult;
export {};
