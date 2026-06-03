import { SddState } from "../state.js";
export declare const contextInjector: {
    getPhaseSkeleton(phase: number, state: SddState): string;
    injectFileHints(phase: number, state: SddState, projectDir: string): string;
};
