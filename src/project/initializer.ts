import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { CORE_PRINCIPLES } from "../templates/core-principles.js"
import { DESIGN_RULES, IMPL_RULES, REVIEW_RULES, WORKFLOW_RULES } from "../templates/core-principles.js"
import { FINDINGS_TEMPLATE } from "../templates/findings.js"
import { TASK_PLAN_TEMPLATE } from "../templates/task-plan.js"

export class ProjectInitializer {
  private projectDir: string

  constructor(projectDir: string) {
    this.projectDir = projectDir
  }

  isInitialized(path: string): boolean {
    return existsSync(join(path, "CONSTITUTION"))
      || existsSync(join(path, ".sdd"))
      || existsSync(join(path, "PROJECT_STATE.md"))
  }

  initializeAll(path: string, template: string): void {
    this.createDirectoryStructure(path)
    this.initializeConstitution(path)
    this.initializeMemoryArtifacts(path)
    this.initializeConfig(path, template)
  }

  createDirectoryStructure(path: string): void {
    const dirs = [
      ".sdd", "CONSTITUTION", ".nexus-map",
      "docs/knowledge", "docs/modules", "docs/features", "docs/collaboration",
    ]
    for (const d of dirs) {
      mkdirSync(join(path, d), { recursive: true })
    }
  }

  initializeConstitution(path: string): void {
    const constDir = join(path, "CONSTITUTION")
    mkdirSync(constDir, { recursive: true })
    writeFileSync(join(constDir, "core.md"), CORE_PRINCIPLES, "utf-8")
    writeFileSync(join(constDir, "design-rules.md"), DESIGN_RULES, "utf-8")
    writeFileSync(join(constDir, "implementation-rules.md"), IMPL_RULES, "utf-8")
    writeFileSync(join(constDir, "review-rules.md"), REVIEW_RULES, "utf-8")
    writeFileSync(join(constDir, "workflow-rules.md"), WORKFLOW_RULES, "utf-8")
  }

  initializeMemoryArtifacts(path: string): void {
    writeFileSync(
      join(path, "PROJECT_STATE.md"),
      "# Project State\n\n## Features\n\nNo active features.\n\n## Quality Metrics\n\n| Metric | Current | Target |\n|--------|---------|--------|\n",
      "utf-8"
    )
    writeFileSync(join(path, "AGENTS.md"), "# AI Agent Context\n\nNo active session.\n", "utf-8")
  }

  initializeConfig(path: string, template: string): void {
    mkdirSync(join(path, ".sdd"), { recursive: true })
    writeFileSync(
      join(path, ".sdd", "project.json"),
      JSON.stringify({
        project: { name: this.projectDir.split(/[/\\]/).pop() || "project", type: template, complexity: "medium" },
        harness: { enabled: true },
      }, null, 2),
      "utf-8"
    )
  }

  initializeFeatureArtifacts(featureDir: string, featureName: string): void {
    mkdirSync(featureDir, { recursive: true })
    mkdirSync(join(featureDir, ".sdd"), { recursive: true })
    writeFileSync(join(featureDir, "findings.md"), FINDINGS_TEMPLATE(featureName), "utf-8")
    writeFileSync(join(featureDir, "task_plan.md"), TASK_PLAN_TEMPLATE(featureName), "utf-8")
  }
}
