import { Phase } from "./state.js";
import { ProjectInitializer } from "./project/initializer.js";
import { GateChecker } from "./gate/checker.js";
import { PhaseOrchestrator } from "./phase/orchestrator.js";
import { ConfigLoader } from "./config/loader.js";
import { RollbackHandler } from "./rollback/handler.js";
import { SkillDispatcher } from "./skill/dispatcher.js";
import { join } from "path";
import { existsSync, readFileSync, readdirSync } from "fs";
export class Director {
    state;
    projectDir;
    initializer;
    gateChecker;
    phaseOrchestrator;
    configLoader;
    rollbackHandler;
    skillDispatcher;
    constructor(projectDir, state) {
        this.projectDir = projectDir;
        this.state = state;
        this.initializer = new ProjectInitializer(projectDir);
        this.configLoader = new ConfigLoader(projectDir);
        this.gateChecker = new GateChecker(state, this.configLoader, projectDir);
        this.phaseOrchestrator = new PhaseOrchestrator(state, this.configLoader, projectDir);
        this.rollbackHandler = new RollbackHandler(state, projectDir);
        this.skillDispatcher = new SkillDispatcher(this.configLoader, state);
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
                return this.gateOperation(parts[1] ? parseInt(parts[1]) : args.phase, parts[2] || args.action || "check", args.confirmed);
            case "refresh":
                return this.refreshContext(parts[1] || args.reason || "Manual refresh");
            case "dispatch-skill":
                return this.dispatchSkill(args.skill_name, args.args);
            case "rollback":
                return this.rollbackOperation(parseInt(parts[1] ?? String(args.target_phase ?? this.state.currentPhase)), (parts[2] ?? args.code_scope) ?? "related", args.confirmed ?? false);
            default:
                return { success: false, message: `Unknown command: ${command}. Available: init, start, resume, status, complete, gate, refresh, dispatch-skill, rollback` };
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
            details: [
                `Project: ${path}`,
                `Template: ${template}`,
                "",
                "Configuration files created:",
                "  - .sdd/project.json: Project metadata",
                "  - .sdd/workflow_config.json: Customize skills and additional_skills per phase",
                "",
                "Default primary skills (replace by setting skills field in workflow_config.json):",
                "  Phase 0: comprehensive-research-agent (Research & Requirement Clarification)",
                "  Phase 1: brainstorming",
                "  Phase 2: writing-plans",
                "  Phase 3: subagent-driven-development",
                "  Phase 4: verification-before-completion",
                "  Phase 5: requesting-code-review",
                "  Phase 6: memory-systems",
                "",
                "To customize skills, edit .sdd/workflow_config.json:",
                "  Replace primary skills: { \"phases\": [{ \"id\": 1, \"skills\": [\"tdd\"] }] } — completely replaces defaults, NOT appended!",
                "  Append additional skills: { \"phases\": [{ \"id\": 3, \"additional_skills\": [\"test-driven-development\"] }] }",
                "",
                "Use sdd_dispatch_skill to see all skills for current phase.",
            ],
        };
    }
    startFeature(featureName) {
        if (!featureName) {
            return { success: false, message: "Feature name required: sdd start <feature>" };
        }
        const result = this.phaseOrchestrator.startFeature(featureName);
        if (!result.success) {
            return {
                success: false,
                message: result.message,
            };
        }
        return {
            success: true,
            message: result.message,
            details: [
                "Phase 0 (Research & Requirement Clarification) is mandatory before design.",
                "Phase 0 asks the user for detailed requirement descriptions: feature overview, requirement specs, performance requirements, core modules.",
                "If the primary skill covers requirement clarification, it will handle the interaction with the user.",
                "Use sdd_gate phase=1 action=check to check gate requirements.",
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
        const checkpointFile = join(featureDir, ".sdd", "checkpoint.json");
        let loadedPhase = Phase.INIT;
        let loadedGateApprovals = {};
        if (existsSync(checkpointFile)) {
            try {
                const checkpoint = JSON.parse(readFileSync(checkpointFile, "utf-8"));
                const phaseStr = checkpoint.phase ?? "0";
                loadedPhase = phaseNameToEnum(phaseStr);
                if (checkpoint.gateApprovals) {
                    loadedGateApprovals = checkpoint.gateApprovals;
                }
            }
            catch {
                loadedPhase = Phase.INIT;
            }
        }
        else {
            const findingsFile = join(featureDir, "findings.md");
            const designFile = join(featureDir, "design.md");
            const planFile = join(featureDir, "task_plan.md");
            if (existsSync(planFile)) {
                loadedPhase = Phase.DEVELOPMENT;
                loadedGateApprovals = { 0: true, 1: true, 2: true };
            }
            else if (existsSync(designFile)) {
                loadedPhase = Phase.PLANNING;
                loadedGateApprovals = { 0: true, 1: true };
            }
            else if (existsSync(findingsFile)) {
                loadedPhase = Phase.REQUIREMENTS;
                loadedGateApprovals = { 0: true };
            }
            else {
                loadedPhase = Phase.INIT;
            }
        }
        this.state.featureName = feature;
        this.state.currentPhase = loadedPhase;
        this.state.gateApprovals = loadedGateApprovals;
        this.state.resetContextMonitor();
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
            `Recommended skill: ${this.configLoader.getSkill(this.state.currentPhase) ?? "none"}`,
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
        const result = this.phaseOrchestrator.completeFeature();
        return {
            success: result.success,
            message: result.message,
            details: result.success ? [
                "Update PROJECT_STATE.md and AGENTS.md before merging.",
                "Use verification-before-completion skill for final check.",
            ] : undefined,
        };
    }
    gateOperation(phase, action, confirmed) {
        if (!Number.isInteger(phase)) {
            return { success: false, message: "Phase number required: sdd gate <phase> <check|approve|block>" };
        }
        if (action === "approve") {
            if (!confirmed) {
                const gate = this.gateChecker.checkGate(phase);
                return {
                    success: false,
                    message: `⚠️ HUMAN CONFIRMATION REQUIRED for Phase ${phase}`,
                    details: [
                        "DO NOT proceed without explicit human approval.",
                        "Ask the user: 'Phase gate requirements met. Should I proceed to Phase X?'",
                        "Only call sdd_gate again with confirmed=true after user says yes.",
                        "",
                        ...gate.details ?? [],
                    ],
                };
            }
            const gate = this.gateChecker.checkGate(phase);
            if (!gate.success) {
                return {
                    success: false,
                    message: `Gate requirements not satisfied for Phase ${phase}`,
                    details: gate.details,
                };
            }
            const result = this.phaseOrchestrator.transitionTo(phase);
            return {
                success: result.success,
                message: result.success ? `Gate approved. Transitioned to Phase ${phase} (${this.state.getPhaseName()}).` : result.message,
                details: gate.details,
            };
        }
        if (action === "block") {
            return {
                success: false,
                message: `Gate blocked at Phase ${phase}. Complete current phase requirements first.`,
            };
        }
        return this.gateChecker.checkGate(phase);
    }
    checkGateRequirements(phase) {
        const result = this.gateChecker.checkGate(phase);
        return {
            success: result.success,
            message: result.message,
            details: result.details,
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
    dispatchSkill(skillName, args) {
        if (skillName) {
            const result = this.skillDispatcher.dispatchSkill(skillName);
            if (!result.success) {
                return { success: false, message: result.message };
            }
            return {
                success: true,
                message: result.message,
                details: [
                    result.instruction,
                ],
            };
        }
        const result = this.skillDispatcher.dispatchForCurrentPhase();
        if (!result.success) {
            return { success: false, message: result.message };
        }
        return {
            success: true,
            message: result.message,
            details: [
                result.instruction,
            ],
        };
    }
    rollbackOperation(targetPhase, codeScope, confirmed) {
        if (!this.state.featureName) {
            return { success: false, message: "No active feature. Use sdd start <feature> first." };
        }
        if (targetPhase > this.state.currentPhase) {
            return { success: false, message: `Cannot rollback forward. Target Phase ${targetPhase} >= current Phase ${this.state.currentPhase}.` };
        }
        if (targetPhase < 0 || targetPhase > 6) {
            return { success: false, message: `Invalid target phase: ${targetPhase}. Must be 0-6.` };
        }
        const validScopes = ["none", "related", "all"];
        if (!validScopes.includes(codeScope)) {
            return { success: false, message: `Invalid code_scope: '${codeScope}'. Must be: ${validScopes.join(", ")}` };
        }
        const result = this.rollbackHandler.executeRollback(targetPhase, codeScope, confirmed);
        return { success: result.success, message: result.message, details: result.details };
    }
    listActiveFeatures() {
        const featuresDir = join(this.projectDir, "docs", "features");
        if (!existsSync(featuresDir))
            return [];
        const active = [];
        try {
            const entries = readdirSync(featuresDir, { withFileTypes: true });
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
        "0": Phase.INIT,
        "research": Phase.INIT,
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
    };
    return mapping[name.toLowerCase()] ?? Phase.INIT;
}
//# sourceMappingURL=director.js.map