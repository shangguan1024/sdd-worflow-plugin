export class ConversationMemory {
    featureName;
    projectRoot;
    nodes = {};
    decisionChains = {};
    constructor(featureName, projectRoot) {
        this.featureName = featureName;
        this.projectRoot = projectRoot;
    }
    addNode(node) {
        this.nodes[node.id] = node;
    }
    getContextSummary() {
        if (Object.keys(this.nodes).length === 0) {
            return "No conversation memory recorded yet.";
        }
        const parts = Object.values(this.nodes)
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
            .map((n) => `[${n.type}] ${n.content.slice(0, 200)}`);
        return parts.join("\n");
    }
}
//# sourceMappingURL=conversation.js.map