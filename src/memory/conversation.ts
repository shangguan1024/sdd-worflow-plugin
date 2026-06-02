export class ConversationMemory {
  featureName: string
  projectRoot: string
  nodes: Record<string, MemoryNode> = {}
  decisionChains: Record<string, string[]> = {}

  constructor(featureName: string, projectRoot: string) {
    this.featureName = featureName
    this.projectRoot = projectRoot
  }

  addNode(node: MemoryNode): void {
    this.nodes[node.id] = node
  }

  getContextSummary(): string {
    if (Object.keys(this.nodes).length === 0) {
      return "No conversation memory recorded yet."
    }
    const parts = Object.values(this.nodes)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((n) => `[${n.type}] ${n.content.slice(0, 200)}`)
    return parts.join("\n")
  }
}

export interface MemoryNode {
  id: string
  type: "requirement" | "design_decision" | "constraint" | "finding" | "task"
  content: string
  timestamp: string
  alternatives?: string[]
  rationale?: string
}