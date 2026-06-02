import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { ConversationMemory } from "./conversation.js"

export class MemoryManager {
  private projectRoot: string
  private memory: ConversationMemory | null = null

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  loadOrCreateMemory(featureName: string): ConversationMemory {
    this.memory = new ConversationMemory(featureName, this.projectRoot)
    const memFile = join(
      this.projectRoot,
      "docs",
      "features",
      featureName,
      ".sdd",
      "conversation_memory.json"
    )
    if (existsSync(memFile)) {
      try {
        const data = JSON.parse(readFileSync(memFile, "utf-8"))
        for (const node of data.nodes ?? []) {
          this.memory.addNode(node)
        }
      } catch {
        // ignore parse errors
      }
    }
    return this.memory
  }

  getMemory(): ConversationMemory | null {
    return this.memory
  }

  saveMemory(featureName: string): void {
    if (!this.memory) return
    const memFile = join(
      this.projectRoot,
      "docs",
      "features",
      featureName,
      ".sdd",
      "conversation_memory.json"
    )
    writeFileSync(memFile, JSON.stringify({ nodes: Object.values(this.memory.nodes) }, null, 2), "utf-8")
  }
}
