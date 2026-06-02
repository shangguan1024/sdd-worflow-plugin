export const PHASE0_PROMPT = `
## Phase 0: Research & Understanding (Mandatory)

Before any design or coding, you MUST complete deep research.

### Execution Steps

**Step 1: Codebase Analysis**
- Identify project type (language/framework/build system)
- List at least 5 specific related files (with file names)
- Identify key interfaces/trait definitions

**Step 2: Technical Principles**
- Identify core technology stack
- For each concept: name, why relevant, source citation
- Reference table with URLs or doc sections

**Step 3: Constraints Identification**
- At least 3 constraints: performance, security, compatibility

**Step 4: Alternative Comparison**
- At least 2 alternatives with 3+ pros/cons each
- Comparison table: complexity, performance, maintenance

### Output
Write to \`docs/features/{feature}/findings.md\` under "## Phase 0: Research" section.

### Gate Requirements (use sdd-gate phase=1 action=check)
- findings.md has Phase 0 section
- 5+ specific file names mentioned
- 2+ external citations
- 2+ constraints identified
- 2+ alternatives with 3+ pros/cons

### Red Flags (Research Failed)
- No specific file names (only module names)
- "Technical principles" section < 200 words
- Constraints < 2
- No external citations
- Only 1 alternative
- Placeholder text like "need to research X"

### IMPORTANT
The plugin BLOCKS edit/write/bash tools during Phase 0.
Use read/glob/grep tools for research only.
When research is complete, use sdd-gate phase=1 action=approve to proceed.
`;
//# sourceMappingURL=phase0.js.map