export const PHASE5_PROMPT = `
## Phase 5: Code Quality Review

### Execution Steps

1. Architecture review
   - Verify module boundaries
   - Check dependency direction
   - Constitution compliance
2. Code quality review
   - Lint/typecheck
   - Test coverage check
   - Error handling audit
3. Requirements traceability check
4. Write review artifacts

### Output
- \`docs/features/{feature}/reviews/architecture_review.md\`
- \`docs/features/{feature}/reviews/code_quality_review.md\`

### Gate Requirements (use sdd-gate phase=6 action=check)
- Architecture review complete
- Code quality review complete
- All 4 artifacts verified:
  - Architecture compliance
  - Requirements traceability
  - Code quality metrics
  - Test coverage

The plugin will BLOCK transition to Phase 6 if review artifacts are missing.
`;
//# sourceMappingURL=phase5.js.map