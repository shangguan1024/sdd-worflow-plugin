import { Phase } from "../state.js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
export class GateChecker {
    state;
    configLoader;
    projectDir;
    constructor(state, configLoader, projectDir) {
        this.state = state;
        this.configLoader = configLoader;
        this.projectDir = projectDir;
    }
    checkGate(phase) {
        const phaseConfig = this.configLoader.getPhaseConfig(phase - 1);
        const details = [];
        const missing = [];
        details.push(`Current phase: ${this.state.currentPhase} (${this.state.getPhaseName()})`);
        details.push(`Transition to: Phase ${phase}`);
        if (!this.state.featureName && phase !== Phase.INIT) {
            missing.push("No active feature. Use sdd start <feature> first.");
        }
        const featureDir = join(this.projectDir, "docs", "features", this.state.featureName);
        if (phase === Phase.REQUIREMENTS) {
            this.checkPhase0Gate(featureDir, details, missing);
        }
        else if (phase === Phase.PLANNING) {
            this.checkPhase1Gate(featureDir, details, missing);
        }
        else if (phase === Phase.DEVELOPMENT) {
            this.checkPhase2Gate(featureDir, details, missing);
        }
        else if (phase === Phase.INTEGRATION) {
            this.checkPhase3Gate(featureDir, details, missing);
        }
        else if (phase === Phase.REVIEW) {
            this.checkPhase4Gate(featureDir, details, missing);
        }
        else if (phase === Phase.PERSISTENCE) {
            this.checkPhase5Gate(featureDir, details, missing);
        }
        else if (phase === Phase.COMPLETED) {
            this.checkPhase6Gate(featureDir, details, missing);
        }
        return {
            success: missing.length === 0,
            message: missing.length === 0 ? "Phase gate requirements satisfied" : "Phase gate requirements incomplete",
            details: missing.length === 0 ? details : [...details, "", "Missing:", ...missing.map(m => `- ${m}`)],
            missing,
        };
    }
    checkPhase0Gate(featureDir, details, missing) {
        const findings = this.requireFile("findings.md", join(featureDir, "findings.md"), details, missing);
        if (findings) {
            this.requireSection("Phase 0 requirement clarification section", findings, ["## Phase 0: Requirement Clarification", "## Requirement Clarification"], details, missing);
            this.requireSection("Feature overview", findings, ["### Feature Overview", "Feature Overview", "功能简介"], details, missing);
            this.requireSection("Requirement specifications", findings, ["### Requirement Specifications", "Requirement Specifications", "需求规格"], details, missing);
            this.requireSection("Performance requirements", findings, ["### Performance Requirements", "Performance Requirements", "性能要求"], details, missing);
            this.requireSection("Core modules", findings, ["### Core Modules", "Core Modules", "核心模块"], details, missing);
        }
    }
    checkPhase1Gate(featureDir, details, missing) {
        const findings = this.requireFile("findings.md", join(featureDir, "findings.md"), details, missing);
        if (findings) {
            this.requireSection("Phase 1 design summary", findings, ["## Phase 1: Design Summary", "## Phase 1", "## Design"], details, missing);
        }
        const design = this.requireFile("design.md", join(featureDir, "design.md"), details, missing);
        if (design) {
            this.requireSection("Requirements with REQ-ID", design, ["REQ-"], details, missing);
            this.requireSection("Verification mapping", design, ["Verification", "Test Strategy"], details, missing);
        }
    }
    checkPhase2Gate(featureDir, details, missing) {
        const findings = this.requireFile("findings.md", join(featureDir, "findings.md"), details, missing);
        if (findings) {
            this.requireSection("Phase 2 plan summary", findings, ["## Phase 2: Plan Summary", "## Phase 2", "## Plan"], details, missing);
        }
        const plan = this.requireFile("task_plan.md", join(featureDir, "task_plan.md"), details, missing);
        if (plan) {
            this.requireSection("Task definitions", plan, ["Task", "Tasks"], details, missing);
            this.requireSection("Verification commands or strategy", plan, ["Verification", "Test Strategy", "Commands"], details, missing);
        }
    }
    checkPhase3Gate(featureDir, details, missing) {
        const findings = this.requireFile("findings.md", join(featureDir, "findings.md"), details, missing);
        if (findings) {
            this.requireSection("Phase 3 implementation summary", findings, ["## Phase 3: Implementation Summary", "## Phase 3", "## Implementation"], details, missing);
        }
        const plan = this.requireFile("task_plan.md", join(featureDir, "task_plan.md"), details, missing);
        if (plan) {
            this.requireSection("Task completion evidence", plan, ["complete", "completed", "done", "[x]"], details, missing);
        }
    }
    checkPhase4Gate(featureDir, details, missing) {
        const findings = this.requireFile("findings.md", join(featureDir, "findings.md"), details, missing);
        if (findings) {
            this.requireSection("Phase 4 test summary", findings, ["## Phase 4: Test Summary", "## Phase 4", "## Test"], details, missing);
        }
    }
    checkPhase5Gate(featureDir, details, missing) {
        const findings = this.requireFile("findings.md", join(featureDir, "findings.md"), details, missing);
        if (findings) {
            this.requireSection("Phase 5 review summary", findings, ["## Phase 5: Review Summary", "## Phase 5", "## Review"], details, missing);
        }
        this.requireFile("architecture_review.md", join(featureDir, "reviews", "architecture_review.md"), details, missing);
        this.requireFile("code_quality_review.md", join(featureDir, "reviews", "code_quality_review.md"), details, missing);
    }
    checkPhase6Gate(featureDir, details, missing) {
        this.requireFile("findings.md", join(featureDir, "findings.md"), details, missing);
        this.requireFile("design.md", join(featureDir, "design.md"), details, missing);
        this.requireFile("task_plan.md", join(featureDir, "task_plan.md"), details, missing);
        this.requireFile("architecture_review.md", join(featureDir, "reviews", "architecture_review.md"), details, missing);
        this.requireFile("code_quality_review.md", join(featureDir, "reviews", "code_quality_review.md"), details, missing);
        this.requireFile("PROJECT_STATE.md", join(this.projectDir, "PROJECT_STATE.md"), details, missing);
        this.requireFile("AGENTS.md", join(this.projectDir, "AGENTS.md"), details, missing);
    }
    requireFile(label, path, details, missing) {
        const present = existsSync(path);
        details.push(`${label}: ${present ? "present" : "MISSING"}`);
        if (!present)
            missing.push(`${label} missing`);
        return present ? readFileSync(path, "utf-8") : null;
    }
    requireSection(label, content, markers, details, missing) {
        const present = markers.some(marker => content.toLowerCase().includes(marker.toLowerCase()));
        details.push(`${label}: ${present ? "present" : "MISSING"}`);
        if (!present)
            missing.push(`${label} missing`);
    }
}
//# sourceMappingURL=checker.js.map