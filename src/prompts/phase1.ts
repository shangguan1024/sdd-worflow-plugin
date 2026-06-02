export const PHASE1_PROMPT = `
## Phase 1: Requirements & Design

### Execution Steps

**For all features:**
1. Read findings.md (Phase 0 section)
2. Read design doc template
3. Constitution compliance check
4. Generate design document with Total-Part structure
5. Update findings.md (Phase 1 section)

**For large features (Complexity >= HIGH):**
6-10. Module Decomposition:
  - Define Bounded Contexts
  - Draw Module Boundary Matrix
  - Define Dependency Constraints

11-18. Module Internal Architecture:
  - Define Public Interfaces (8-dimension)
  - Define Module Internal Design

19-24. Implementation Deep Dive:
  - Interface detailed design
  - Implementation logic (Mermaid)
  - Module interaction design
  - Change impact analysis

### Output
\`docs/features/{feature}/design.md\` or \`docs/features/{feature}/design-doc.md\`

### Gate Requirements (use sdd-gate phase=2 action=check)
- Phase 0 passed (findings.md has Phase 0 section)
- Design document generated
- Constitution compliance check passed
- For large features: Module Decomposition complete
- For large features: Public Interfaces (8-dimension)
- For large features: Peripheral Module Dependencies (5-dimension)

### Total-Part Design Document Structure
Part 1: Overall Architecture (Overview, Requirements, Module List)
Part 2: Overall Data Flow (PlantUML Component + Sequence)
Part 3: Module Decomposition (Mermaid Flowchart + 8-dim Interfaces + 5-dim Dependencies)
Part 4: Integration & Verification
`