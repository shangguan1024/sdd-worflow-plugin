export class ProgressiveDisclosure {
    memory;
    constructor(memory) {
        this.memory = memory;
    }
    getLayer1() {
        const nodes = Object.values(this.memory.nodes);
        const summary = nodes
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
            .map((n) => `[${n.type}] ${n.content.slice(0, 100)}`)
            .join("\n");
        return { name: "Layer 1 (Index)", tokenEstimate: summary.length / 4, content: summary };
    }
    getLayer2() {
        const nodes = Object.values(this.memory.nodes);
        const content = nodes
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
            .map((n) => `[${n.type}] ${n.content.slice(0, 300)}`)
            .join("\n\n");
        return { name: "Layer 2 (Timeline)", tokenEstimate: content.length / 4, content };
    }
    getLayer3(ids) {
        const nodes = ids
            .map((id) => this.memory.nodes[id])
            .filter(Boolean);
        const content = nodes
            .map((n) => {
            let parts = `[${n.type}] ${n.content}`;
            if (n.alternatives?.length) {
                parts += `\nAlternatives: ${n.alternatives.join(", ")}`;
            }
            if (n.rationale) {
                parts += `\nRationale: ${n.rationale}`;
            }
            return parts;
        })
            .join("\n\n---\n\n");
        return { name: "Layer 3 (Full Details)", tokenEstimate: content.length / 4, content };
    }
    getTimeline(before = 5, after = 5) {
        return Object.values(this.memory.nodes)
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }
}
//# sourceMappingURL=progressive-disclosure.js.map