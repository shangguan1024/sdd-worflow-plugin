import { SddState } from "../state.js";
export declare const contextMonitorMiddleware: {
    recordEdit(toolName: string, args: Record<string, unknown>, state: SddState): void;
    shouldRefresh(state: SddState): boolean;
    generateRefresh(state: SddState, projectDir: string): string;
};
