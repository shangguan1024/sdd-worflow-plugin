export const PHASE4_PROMPT = `
## Phase 4: Integration & Testing

### Execution Steps

1. Run integration tests
2. Run end-to-end tests
3. Verify REQ-ID coverage (>= 80%)
4. Performance benchmark (if needed)
5. Update findings.md (Phase 4 section)

### Gate Requirements (use sdd-gate phase=5 action=check)
- Integration tests pass
- E2E tests pass
- REQ-ID coverage >= 80%
- Performance meets requirements
`;
//# sourceMappingURL=phase4.js.map