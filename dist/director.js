import { Phase } from "./state.js";
import { ProjectInitializer } from "./project/initializer.js";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
export class Director {
    state;
    projectDir;
    initializer;
    constructor(projectDir, state) {
        this.projectDir = projectDir;
        this.state = state;
        this.initializer = new ProjectInitializer(projectDir);
    }
    async executeCommand(cmd, args) {
        const parts = cmd.split(/\s+/);
        const command = parts[0];
        switch (command) {
            case "init":
                return this.initialize(args);
            case "start":
                return this.startFeature(typeof parts[1] === "string" ? parts[1] : (args.feature || ""));
            case "resume":
                return this.resumeFeature(typeof parts[1] === "string" ? parts[1] : (args.feature || ""));
            case "status":
                return this.showStatus(typeof parts[1] === "string" ? parts[1] : (args.feature || ""), args.verbose);
            case "complete":
                return this.complete(typeof parts[1] === "string" ? parts[1] : (args.feature || ""));
            case "gate":
                return this.gateOperation(parts[1] ? parseInt(parts[1]) : args.phase, parts[2] || args.action || "check");
            case "refresh":
                return this.refreshContext(parts[1] || args.reason || "Manual refresh");
            default:
                return { success: false, message: `Unknown command: ${command}. Available: init, start, resume, status, complete, gate, refresh` };
        }
    }
    initialize(args) {
        const path = args.path || this.projectDir;
        const template = args.template || "standard";
        const force = args.force ?? false;
        if (!force && this.initializer.isInitialized(path)) {
            return { success: false, message: "Project already initialized. Use --force to reinitialize." };
        }
        this.initializer.initializeAll(path, template);
        this.state.currentPhase = Phase.INIT;
        this.state.save();
        return {
            success: true,
            message: "SDD project initialized successfully",
            details: [`Project: ${path}`, `Template: ${template}`],
        };
    }
    startFeature(featureName) {
        if (!featureName) {
            return { success: false, message: "Feature name required: sdd start <feature>" };
        }
        this.state.featureName = featureName;
        this.state.currentPhase = Phase.UNDERSTANDING;
        this.state.resetContextMonitor();
        const featureDir = join(this.projectDir, "docs", "features", featureName);
        this.initializer.initializeFeatureArtifacts(featureDir, featureName);
        this.state.save();
        return {
            success: true,
            message: `Feature '${featureName}' started. Current phase: Understanding (Phase 0)`,
            details: [
                "Research & Understanding phase is mandatory before design.",
                "Use the sdd-gate tool to check phase gate requirements.",
                "Use sdd-refresh to refresh context when needed.",
            ],
        };
    }
    resumeFeature(featureName) {
        const feature = featureName || this.state.featureName;
        if (!feature) {
            const activeFeatures = this.listActiveFeatures();
            if (activeFeatures.length === 0) {
                return { success: false, message: "No active features. Use: sdd start <feature>" };
            }
            return {
                success: true,
                message: "Select a feature to resume",
                details: activeFeatures.map(f => `sdd resume ${f}`),
            };
        }
        const featureDir = join(this.projectDir, "docs", "features", feature);
        if (!existsSync(featureDir)) {
            return { success: false, message: `Feature '${feature}' not found. Use: sdd start ${feature}` };
        }
        this.state.featureName = feature;
        this.state.resetContextMonitor();
        const checkpointFile = join(featureDir, ".sdd", "checkpoint.json");
        if (existsSync(checkpointFile)) {
            try {
                const checkpoint = JSON.parse(readFileSync(checkpointFile, "utf-8"));
                const phaseStr = checkpoint.phase ?? "1";
                this.state.currentPhase = phaseNameToEnum(phaseStr);
            }
            catch {
                this.state.currentPhase = Phase.REQUIREMENTS;
            }
        }
        this.state.save();
        return {
            success: true,
            message: `Resuming feature '${feature}' at Phase ${this.state.currentPhase} (${this.state.getPhaseName()})`,
        };
    }
    showStatus(feature, verbose) {
        const details = [
            `Phase: ${this.state.currentPhase} (${this.state.getPhaseName()})`,
            `Feature: ${this.state.featureName}`,
            `Edits: ${this.state.editCount}`,
            `Tasks: ${this.state.taskCount}`,
            `Gate approvals: ${Object.entries(this.state.gateApprovals).filter(([, v]) => v).map(([k]) => `Phase ${k}`).join(", ") || "None"}`,
        ];
        if (verbose) {
            const hotFiles = Object.entries(this.state.perFileEdits)
                .filter(([, c]) => c >= 5)
                .sort(([, a], [, b]) => b - a);
            if (hotFiles.length > 0) {
                details.push("\nHot files:");
                for (const [fp, count] of hotFiles) {
                    details.push(`  - ${fp} (${count} edits)`);
                }
            }
            details.push(`\nInitialized: ${this.state.isInitialized()}`);
            const activeFeatures = this.listActiveFeatures();
            details.push(`Active features: ${activeFeatures.length}`);
            for (const f of activeFeatures) {
                details.push(`  - ${f}`);
            }
        }
        return { success: true, message: "SDD Workflow Status", details };
    }
    complete(feature) {
        const featureName = feature || this.state.featureName;
        if (!featureName) {
            return { success: false, message: "No active feature to complete" };
        }
        this.state.currentPhase = Phase.COMPLETED;
        this.state.save();
        return {
            success: true,
            message: `Workflow for '${featureName}' completed. Ready for merge.`,
            details: [
                "Update PROJECT_STATE.md and AGENTS.md before merging.",
                "Use verification-before-completion skill for final check.",
            ],
        };
    }
    gateOperation(phase, action) {
        if (action === "approve") {
            const success = this.state.transition(phase);
            if (!success) {
                return {
                    success: false,
                    message: `Cannot transition to Phase ${phase}. Current: Phase ${this.state.currentPhase} (${this.state.getPhaseName()}). Gate not passed or invalid transition.`,
                };
            }
            return {
                success: true,
                message: `Gate approved. Transitioned to Phase ${phase} (${this.state.getPhaseName()}).`,
            };
        }
        if (action === "block") {
            return {
                success: false,
                message: `Gate blocked at Phase ${phase}. Complete current phase requirements first.`,
            };
        }
        const featureDir = join(this.projectDir, "docs", "features", this.state.featureName);
        const requirements = [];
        requirements.push(`Current phase: ${this.state.currentPhase} (${this.state.getPhaseName()})`);
        requirements.push(`Transition to: Phase ${phase}`);
        if (phase === Phase.REQUIREMENTS) {
            requirements.push("Requirements: findings.md must have Phase 0 section with research (5+ files, 2+ citations, 2+ constraints, 2+ alternatives)");
            const findingsFile = join(featureDir, "findings.md");
            if (existsSync(findingsFile)) {
                const content = readFileSync(findingsFile, "utf-8");
                const hasPhase0 = content.includes("## Phase 0: Research") || content.includes("## Research");
                requirements.push(`Phase 0 section: ${hasPhase0 ? "present" : "MISSING"}`);
            }
            else {
                requirements.push("findings.md: MISSING");
            }
        }
        if (phase === Phase.PLANNING) {
            requirements.push("Requirements: Design document must exist, constitution compliance passed");
        }
        if (phase === Phase.DEVELOPMENT) {
            requirements.push("Requirements: Implementation plan must exist, constitution compliance passed");
        }
        if (phase === Phase.INTEGRATION) {
            requirements.push("Requirements: All tasks completed, unit tests pass, lint/typecheck pass");
        }
        if (phase === Phase.REVIEW) {
            requirements.push("Requirements: Integration tests pass, E2E tests pass");
        }
        if (phase === Phase.PERSISTENCE) {
            requirements.push("Requirements: All 4 review artifacts verified (architecture, code quality, requirements traceability, test coverage)");
        }
        return {
            success: true,
            message: "Phase gate check results",
            details: requirements,
        };
    }
    refreshContext(reason) {
        this.state.markRefreshed();
        return {
            success: true,
            message: `Context refresh triggered: ${reason}`,
            details: [
                "Context reloaded from findings.md and design documents.",
                "Hot files and recent decisions injected.",
            ],
        };
    }
    listActiveFeatures() {
        const featuresDir = join(this.projectDir, "docs", "features");
        if (!existsSync(featuresDir))
            return [];
        const active = [];
        try {
            const entries = require("fs").readdirSync(featuresDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const checkpointFile = join(featuresDir, entry.name, ".sdd", "checkpoint.json");
                    const completedFile = join(featuresDir, entry.name, "COMPLETED");
                    if (existsSync(checkpointFile) || !existsSync(completedFile)) {
                        active.push(entry.name);
                    }
                }
            }
        }
        catch {
            return [];
        }
        return active;
    }
}
function phaseNameToEnum(name) {
    const mapping = {
        "1": Phase.REQUIREMENTS,
        "requirements": Phase.REQUIREMENTS,
        "2": Phase.PLANNING,
        "planning": Phase.PLANNING,
        "3": Phase.DEVELOPMENT,
        "development": Phase.DEVELOPMENT,
        "4": Phase.INTEGRATION,
        "integration": Phase.INTEGRATION,
        "5": Phase.REVIEW,
        "review": Phase.REVIEW,
        "6": Phase.PERSISTENCE,
        "persistence": Phase.PERSISTENCE,
        "0": Phase.INIT,
        "init": Phase.INIT,
        "-1": Phase.UNDERSTANDING,
        "understanding": Phase.UNDERSTANDING,
    };
    return mapping[name.toLowerCase()] ?? Phase.REQUIREMENTS;
}
//# sourceMappingURL=director.js.map