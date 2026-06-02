export const CORE_PRINCIPLES = `# Core Principles

## 1. Safety First
- All user input must be validated
- No sensitive info in logs
- Secrets never in code or commits

## 2. Modularity
- Modules communicate via explicit interfaces
- Single responsibility per module
- Dependencies flow downward

## 3. Testability
- All public APIs must have tests
- Test coverage >= 80% for new code
- Integration tests for critical paths

## 4. Backward Compatibility
- No breaking changes to public APIs
- Deprecation warnings before removal

## 5. Code Quality
- No dead code or unused imports
- Consistent naming conventions
- Documentation for all public APIs
`;
export const DESIGN_RULES = `# Design Rules

## DESIGN-001: Single Responsibility
Each module/class has one clear purpose.

## DESIGN-002: Interface Segregation
Keep interfaces minimal and focused.

## DESIGN-003: Dependency Direction
Dependencies flow from high-level to low-level.

## DESIGN-004: No Circular Dependencies
Module A cannot depend on B if B depends on A.

## DESIGN-005: API Documentation
All public APIs must have docstrings with:
- Purpose
- Parameters
- Return values
- Exceptions
`;
export const IMPL_RULES = `# Implementation Rules

## IMPL-001: Error Handling
All error paths must be handled explicitly.
No silent failures.

## IMPL-002: Test Coverage
New code requires unit tests.
Modified code requires updated tests.

## IMPL-003: Logging Standards
Use structured logging with context.
Log levels: DEBUG, INFO, WARNING, ERROR.

## IMPL-004: Code Comments
Comments explain "why", not "what".
No redundant comments.
`;
export const REVIEW_RULES = `# Review Rules

## REVIEW-001: Incremental Review
Phase 5 reviews only files changed in current feature.

## REVIEW-002: Quality Gates
- Linting must pass
- Tests must pass
- Coverage >= threshold

## REVIEW-003: Constitution Compliance
All changes must comply with constitution rules.

## REVIEW-004: Change Summary
Phase 6 must document:
- What changed
- Why changed
- Impact radius
- Rollback plan
`;
export const WORKFLOW_RULES = `# Workflow Rules

## WORKFLOW-001: Understanding Phase
Mandatory before design. No skipping.

## WORKFLOW-002: Phase Gates
Each phase requires gate passage before next.

## WORKFLOW-003: Checkpoint Persistence
Checkpoint saved at phase boundaries.

## WORKFLOW-004: Error Recovery
Errors must be captured and recovered.

## WORKFLOW-005: Memory Persistence
Session context persisted in AGENTS.md.
`;
//# sourceMappingURL=core-principles.js.map