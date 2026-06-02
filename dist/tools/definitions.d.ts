import { tool } from "@opencode-ai/plugin";
import { Director } from "../director.js";
import { SddState } from "../state.js";
export declare function toolDefinitions(director: Director, state: SddState): Record<string, ReturnType<typeof tool>>;
