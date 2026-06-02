import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
export var Phase;
(function (Phase) {
    Phase[Phase["INIT"] = 0] = "INIT";
    Phase[Phase["UNDERSTANDING"] = -1] = "UNDERSTANDING";
    Phase[Phase["REQUIREMENTS"] = 1] = "REQUIREMENTS";
    Phase[Phase["PLANNING"] = 2] = "PLANNING";
    Phase[Phase["DEVELOPMENT"] = 3] = "DEVELOPMENT";
    Phase[Phase["INTEGRATION"] = 4] = "INTEGRATION";
    Phase[Phase["REVIEW"] = 5] = "REVIEW";
    Phase[Phase["PERSISTENCE"] = 6] = "PERSISTENCE";
    Phase[Phase["COMPLETED"] = 7] = "COMPLETED";
})(Phase || (Phase = {}));
export const PHASE_NAMES = {
    [Phase.INIT]: "Init",
    [Phase.UNDERSTANDING]: "Research & Understanding",
    [Phase.REQUIREMENTS]: "Requirements & Design",
    [Phase.PLANNING]: "Implementation Planning",
    [Phase.DEVELOPMENT]: "Module Development",
    [Phase.INTEGRATION]: "Integration & Testing",
    [Phase.REVIEW]: "Code Quality Review",
    [Phase.PERSISTENCE]: "Memory Persistence",
    [Phase.COMPLETED]: "Completed",
};
const VALID_TRANSITIONS = {
    [Phase.INIT]: [Phase.UNDERSTANDING, Phase.REQUIREMENTS],
    [Phase.UNDERSTANDING]: [Phase.REQUIREMENTS],
    [Phase.REQUIREMENTS]: [Phase.PLANNING],
    [Phase.PLANNING]: [Phase.DEVELOPMENT],
    [Phase.DEVELOPMENT]: [Phase.INTEGRATION],
    [Phase.INTEGRATION]: [Phase.REVIEW],
    [Phase.REVIEW]: [Phase.PERSISTENCE],
    [Phase.PERSISTENCE]: [Phase.COMPLETED],
};
export class SddState {
    currentPhase = Phase.INIT;
    featureName = "";
    sessionId = "";
    editCount = 0;
    taskCount = 0;
    perFileEdits = {};
    lastRefreshAtEdit = 0;
    lastRefreshAtTask = 0;
    refreshCount = 0;
    refreshHistory = [];
    gateApprovals = {};
    qualityProfile = "standard";
    stateDir;
    projectDir;
    constructor(projectDir) {
        this.projectDir = projectDir;
        this.stateDir = join(projectDir, ".sdd");
        this.sessionId = generateSessionId();
    }
    async load() {
        const stateFile = join(this.stateDir, "state.json");
        if (existsSync(stateFile)) {
            try {
                const data = JSON.parse(readFileSync(stateFile, "utf-8"));
                this.currentPhase = data.currentPhase ?? Phase.INIT;
                this.featureName = data.featureName ?? "";
                this.sessionId = data.sessionId ?? this.sessionId;
                this.editCount = data.editCount ?? 0;
                this.taskCount = data.taskCount ?? 0;
                this.perFileEdits = data.perFileEdits ?? {};
                this.lastRefreshAtEdit = data.lastRefreshAtEdit ?? 0;
                this.lastRefreshAtTask = data.lastRefreshAtTask ?? 0;
                this.refreshCount = data.refreshCount ?? 0;
                this.refreshHistory = data.refreshHistory ?? [];
                this.gateApprovals = data.gateApprovals ?? {};
                this.qualityProfile = data.qualityProfile ?? "standard";
            }
            catch {
                this.currentPhase = Phase.INIT;
            }
        }
    }
    save() {
        mkdirSync(this.stateDir, { recursive: true });
        writeFileSync(join(this.stateDir, "state.json"), JSON.stringify(this.getState(), null, 2), "utf-8");
    }
    getState() {
        return {
            currentPhase: this.currentPhase,
            featureName: this.featureName,
            sessionId: this.sessionId,
            editCount: this.editCount,
            taskCount: this.taskCount,
            perFileEdits: this.perFileEdits,
            lastRefreshAtEdit: this.lastRefreshAtEdit,
            lastRefreshAtTask: this.lastRefreshAtTask,
            refreshCount: this.refreshCount,
            refreshHistory: this.refreshHistory,
            gateApprovals: this.gateApprovals,
            qualityProfile: this.qualityProfile,
        };
    }
    canTransition(from, to) {
        return VALID_TRANSITIONS[from]?.includes(to) ?? false;
    }
    transition(to) {
        if (this.canTransition(this.currentPhase, to)) {
            this.currentPhase = to;
            this.save();
            return true;
        }
        return false;
    }
    approveGate(phase) {
        this.gateApprovals[phase] = true;
        this.save();
    }
    isGateApproved(phase) {
        return this.gateApprovals[phase] === true;
    }
    getPhaseName() {
        return PHASE_NAMES[this.currentPhase] ?? `Phase ${this.currentPhase}`;
    }
    resetContextMonitor() {
        this.editCount = 0;
        this.taskCount = 0;
        this.lastRefreshAtEdit = 0;
        this.lastRefreshAtTask = 0;
        this.refreshCount = 0;
        this.perFileEdits = {};
        this.refreshHistory = [];
        this.save();
    }
    recordEdit(filePath) {
        this.editCount++;
        this.perFileEdits[filePath] = (this.perFileEdits[filePath] ?? 0) + 1;
        this.save();
    }
    recordTask(taskName) {
        this.taskCount++;
        this.save();
    }
    markRefreshed() {
        this.lastRefreshAtEdit = this.editCount;
        this.lastRefreshAtTask = this.taskCount;
        this.refreshCount++;
        this.refreshHistory.push({
            atEdit: this.editCount,
            atTask: this.taskCount,
            time: new Date().toISOString(),
        });
        this.save();
    }
    getProjectDir() {
        return this.projectDir;
    }
    isInitialized() {
        return existsSync(join(this.projectDir, ".sdd", "state.json"))
            || existsSync(join(this.projectDir, "CONSTITUTION"));
    }
}
function generateSessionId() {
    return Math.random().toString(36).slice(2, 10);
}
//# sourceMappingURL=state.js.map