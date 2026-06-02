import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Director } from "../dist/director.js"
import { SddState, Phase } from "../dist/state.js"

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function withProject(fn) {
  const projectDir = mkdtempSync(join(tmpdir(), "sdd-integrity-"))
  try {
    const state = new SddState(projectDir)
    await state.load()
    const director = new Director(projectDir, state)
    await fn(projectDir, state, director)
  } finally {
    rmSync(projectDir, { recursive: true, force: true })
  }
}

await withProject(async (projectDir, state, director) => {
  let result = await director.executeCommand("init", {})
  assert(result.success, "init should succeed")

  result = await director.executeCommand("start checkout-timeout", {})
  assert(result.success, "start should succeed")
  assert(state.currentPhase === Phase.UNDERSTANDING, "start should enter Phase 0 understanding")

  const featureDir = join(projectDir, "docs", "features", "checkout-timeout")
  const findingsFile = join(featureDir, "findings.md")
  const taskPlanFile = join(featureDir, "task_plan.md")

  assert(existsSync(findingsFile), "start should create findings.md")
  assert(existsSync(taskPlanFile), "start should create task_plan.md")

  writeFileSync(
    findingsFile,
    `# Findings: checkout-timeout

## Phase 0: Research

### Codebase Analysis
- src/checkout.ts
- src/payment.ts
- src/order.ts
- src/config.ts
- test/checkout.test.ts

### Technical Principles
- Timeout behavior: https://example.com/timeout
- Retry behavior: https://example.com/retry

### Constraints
- Performance: checkout response under 500ms
- Compatibility: preserve existing payment API

### Alternatives
- Keep current timeout: simple, no migration, low risk
- Add configurable timeout: flexible, testable, maintainable
`,
    "utf-8"
  )

  result = await director.executeCommand("gate 1 approve", {})
  assert(result.success, "Phase 0 -> Phase 1 should pass after findings")

  result = await director.executeCommand("gate 2 approve", {})
  assert(!result.success, "Phase 1 -> Phase 2 must fail when design.md is missing")

  writeFileSync(
    join(featureDir, "design.md"),
    `# checkout-timeout Design

## Part 1: Overall Architecture

### 1.2 Requirements
- REQ-001: Checkout timeout is configurable.

## Part 2: Overall Data Flow and Module Interaction

## Part 3: Module Decomposition and Detailed Design

## Part 4: Integration and Verification
| REQ-ID | Verification Item | Test Method | Verification Criteria |
|--------|-------------------|-------------|----------------------|
| REQ-001 | timeout config | unit test | timeout is applied |
`,
    "utf-8"
  )
  writeFileSync(
    findingsFile,
    readFileSync(findingsFile, "utf-8") + "\n## Phase 1: Design Summary\nDesign approved.\n",
    "utf-8"
  )

  result = await director.executeCommand("gate 2 approve", {})
  assert(result.success, "Phase 1 -> Phase 2 should pass after design.md")

  writeFileSync(
    taskPlanFile,
    `# Task Plan: checkout-timeout

## Phase 2: Implementation Planning

## Tasks
- [x] T1: Add configurable timeout.

## Test Strategy
- Unit test timeout config.

## Verification Commands
- npm test
`,
    "utf-8"
  )
  writeFileSync(
    findingsFile,
    readFileSync(findingsFile, "utf-8") + "\n## Phase 2: Plan Summary\nPlan approved.\n",
    "utf-8"
  )

  result = await director.executeCommand("gate 3 approve", {})
  assert(result.success, "Phase 2 -> Phase 3 should use canonical task_plan.md, not implementation-plan.md")

  result = await director.executeCommand("complete", {})
  assert(!result.success, "complete must fail before Phase 6 persistence")
})

await withProject(async (projectDir, state, director) => {
  await director.executeCommand("init", {})
  await director.executeCommand("start checkout-timeout", {})
  state.currentPhase = Phase.PERSISTENCE
  state.featureName = "checkout-timeout"
  state.save()

  const featureDir = join(projectDir, "docs", "features", "checkout-timeout")
  mkdirSync(join(featureDir, "reviews"), { recursive: true })
  writeFileSync(join(featureDir, "findings.md"), "## Phase 5: Review Summary\nReviewed.\n", "utf-8")
  writeFileSync(join(featureDir, "design.md"), "# Design\n", "utf-8")
  writeFileSync(join(featureDir, "task_plan.md"), "# Plan\n", "utf-8")
  writeFileSync(join(featureDir, "reviews", "architecture_review.md"), "# Architecture Review\n", "utf-8")
  writeFileSync(join(featureDir, "reviews", "code_quality_review.md"), "# Code Quality Review\n", "utf-8")
  writeFileSync(join(projectDir, "PROJECT_STATE.md"), "# Project State\nUpdated.\n", "utf-8")
  writeFileSync(join(projectDir, "AGENTS.md"), "# Agents\nUpdated.\n", "utf-8")

  const result = await director.executeCommand("complete", {})
  assert(result.success, "complete should pass in Phase 6 after required memory artifacts")
  assert(state.currentPhase === Phase.COMPLETED, "complete should transition to completed state")
  assert(existsSync(join(featureDir, "COMPLETED")), "complete should write feature completion marker")
})

console.log("workflow-integrity-test: PASS")
