import { SddState } from "../state.js";
import { ConfigLoader } from "../config/loader.js";
interface GateResult {
    allowed: boolean;
    message?: string;
    suggestion?: string;
}
declare const BLOCKED_TOOLS_BY_PHASE: Record<number, string[]>;
export declare function phaseGateMiddleware(phase: number, toolName: string, toolArgs: Record<string, unknown>, state: SddState, configLoader: ConfigLoader): GateResult;
export { BLOCKED_TOOLS_BY_PHASE };
