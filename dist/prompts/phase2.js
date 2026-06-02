export const PHASE2_PROMPT = `
## Phase 2: Implementation Planning

### Execution Steps

1. Read design document
2. Task decomposition: split into independent tasks
   - Each task: input, output, estimate
3. Define file changes scope (new files, modified files)
4. Write task_plan.md
5. Constitution compliance check for plan

### Output
\`docs/features/{feature}/task_plan.md\`

### Gate Requirements (use sdd-gate phase=3 action=check)
- Implementation plan exists
- Constitution compliance check passed
- Plan includes: file changes, test strategy, verification commands
- User approved plan

### task_plan.md Structure
For each task:
- Task name and description
- Input: what this task depends on
- Output: what this task produces
- Estimate: complexity rating
- Files: new and modified files
- Test strategy
`;
//# sourceMappingURL=phase2.js.map