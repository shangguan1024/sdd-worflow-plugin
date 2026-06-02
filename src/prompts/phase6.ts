export const PHASE6_PROMPT = `
## Phase 6: Memory Persistence

### Execution Steps

1. Update findings.md (final)
2. Finalize task_plan.md
3. Finalize design.md
4. Update PROJECT_STATE.md (aggregated)
5. Update AGENTS.md (session context)
6. Save conversation memory

### Output
- \`docs/features/{feature}/findings.md\` (updated)
- \`docs/features/{feature}/task_plan.md\` (finalized)
- \`docs/features/{feature}/design.md\` (finalized)
- \`PROJECT_STATE.md\` (aggregated)
- \`AGENTS.md\` (updated)

### Gate Requirements (use sdd-gate phase=7 action=check)
- All memory artifacts exist
- PROJECT_STATE.md updated
- AGENTS.md updated

### After Completion
Use sdd-complete to finalize the workflow.
The workflow is now ready for merge.
`