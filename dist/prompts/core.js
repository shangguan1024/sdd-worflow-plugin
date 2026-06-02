export const CORE_PROMPT = `
# SDD-Workflow v2.2 (Plugin Mode)

Complete 7-phase workflow (Phase 0-6) for software development with mandatory phase gates and Total-Part design documentation.

## Phase Gate System (Mandatory - Enforced by Plugin)

Every phase transition is enforced by the opencode plugin. You CANNOT skip phase gates.

Use sdd-gate tool with action=approve to transition between phases.

## Phase Overview

| Phase | Name | Gate |
|-------|------|------|
| 0 | Research & Understanding | Anti-Superficiality Check |
| 1 | Requirements & Design | Design + Decomposition Approved |
| 2 | Implementation Planning | Plan Approved |
| 3 | Module Development | Compile + Unit Tests |
| 4 | Integration & Testing | Integration Tests Pass |
| 5 | Code Quality Review | All 4 Artifacts Verified |
| 6 | Memory Persistence | Documentation Complete |

## Red Flags - STOP

- Code before Understanding phase (plugin will block edit/write/bash)
- "I already manually tested it"
- "Phase gate is just ritual"
- Missing peripheral module analysis

## Available Tools

- sdd-init: Initialize project
- sdd-start: Start feature development
- sdd-resume: Resume interrupted workflow
- sdd-status: View current status
- sdd-complete: Complete workflow
- sdd-gate: Phase gate operations (check/approve/block)
- sdd-refresh: Force context refresh
- sdd-memory-timeline: Memory timeline (Layer 2)
- sdd-memory-details: Memory full details (Layer 3)
`;
//# sourceMappingURL=core.js.map