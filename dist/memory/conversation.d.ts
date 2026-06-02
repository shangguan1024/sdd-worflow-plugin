export declare class ConversationMemory {
    featureName: string;
    projectRoot: string;
    nodes: Record<string, MemoryNode>;
    decisionChains: Record<string, string[]>;
    constructor(featureName: string, projectRoot: string);
    addNode(node: MemoryNode): void;
    getContextSummary(): string;
}
export interface MemoryNode {
    id: string;
    type: "requirement" | "design_decision" | "constraint" | "finding" | "task";
    content: string;
    timestamp: string;
    alternatives?: string[];
    rationale?: string;
}
