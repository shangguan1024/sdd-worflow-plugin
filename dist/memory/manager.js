import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ConversationMemory } from "./conversation.js";
export class MemoryManager {
    projectRoot;
    memory = null;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    loadOrCreateMemory(featureName) {
        this.memory = new ConversationMemory(featureName, this.projectRoot);
        const memFile = join(this.projectRoot, "docs", "features", featureName, ".sdd", "conversation_memory.json");
        if (existsSync(memFile)) {
            try {
                const data = JSON.parse(readFileSync(memFile, "utf-8"));
                for (const node of data.nodes ?? []) {
                    this.memory.addNode(node);
                }
            }
            catch {
                // ignore parse errors
            }
        }
        return this.memory;
    }
    getMemory() {
        return this.memory;
    }
    saveMemory(featureName) {
        if (!this.memory)
            return;
        const memFile = join(this.projectRoot, "docs", "features", featureName, ".sdd", "conversation_memory.json");
        writeFileSync(memFile, JSON.stringify({ nodes: Object.values(this.memory.nodes) }, null, 2), "utf-8");
    }
}
//# sourceMappingURL=manager.js.map