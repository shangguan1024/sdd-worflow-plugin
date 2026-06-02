import { ConversationMemory, MemoryNode } from "../memory/conversation.js";
export interface DisclosureLayer {
    name: string;
    tokenEstimate: number;
    content: string;
}
export declare class ProgressiveDisclosure {
    private memory;
    constructor(memory: ConversationMemory);
    getLayer1(): DisclosureLayer;
    getLayer2(): DisclosureLayer;
    getLayer3(ids: string[]): DisclosureLayer;
    getTimeline(before?: number, after?: number): MemoryNode[];
}
