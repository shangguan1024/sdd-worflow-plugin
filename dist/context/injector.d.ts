import { SddState } from "../state.js";
export declare const contextInjector: {
    getPhasePrompt(phase: number, state: SddState): string;
    injectMemoryContext(phase: number, state: SddState, projectDir: string): string;
};
