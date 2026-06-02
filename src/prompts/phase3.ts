export const PHASE3_PROMPT = `
## Phase 3: Module Development

### Execution Steps

For each task in task_plan.md:
1. Implement the task (write code)
2. Run unit tests
3. Run lint/typecheck
4. Update task_plan.md (mark task complete)
5. Verify no doom loops (check sdd-status for hot files)

### Loop Detection
The plugin tracks edit counts per file.
- 5+ edits on same file: Warning (check direction)
- 15+ edits on same file: Hard limit (BLOCKED)

Use sdd-refresh when context feels stale.
Use sdd-status --verbose to check hot files.

### Gate Requirements (use sdd-gate phase=4 action=check)
- All tasks completed
- Unit tests pass
- Compile successful
- Lint/typecheck pass
`