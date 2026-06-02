import { ConversationMemory } from "./conversation.js";
export declare class MemoryManager {
    private projectRoot;
    private memory;
    constructor(projectRoot: string);
    loadOrCreateMemory(featureName: string): ConversationMemory;
    getMemory(): ConversationMemory | null;
    saveMemory(featureName: string): void;
}
