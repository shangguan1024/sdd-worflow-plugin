import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { PHASE_NAMES } from "../state.js";
export class RollbackHandler {
    state;
    projectDir;
    constructor(state, projectDir) {
        this.state = state;
        this.projectDir = projectDir;
    }
    planRollback(targetPhase) {
        const featureDir = join(this.projectDir, "docs", "features", this.state.featureName);
        const currentSha = this.getHeadSha();
        const targetSha = this.findShaAtPhase(targetPhase);
        const allChangedFiles = targetSha
            ? this.getChangedFilesSince(targetSha)
            : this.getFeatureChangedFiles(featureDir);
        const sddDocs = [];
        const relatedCode = [];
        const otherCode = [];
        const featurePrefix = "docs/features/" + this.state.featureName;
        const taskPlanFiles = this.getTaskPlanFiles(featureDir);
        for (const file of allChangedFiles) {
            if (file.startsWith(featurePrefix) || file.startsWith(".sdd/")) {
                sddDocs.push(file);
            }
            else if (taskPlanFiles.includes(file)) {
                relatedCode.push(file);
            }
            else {
                otherCode.push(file);
            }
        }
        return { sddDocs, relatedCode, otherCode, gitShaAtTarget: targetSha, currentSha };
    }
    executeRollback(targetPhase, codeScope, confirmed) {
        if (!confirmed) {
            const plan = this.planRollback(targetPhase);
            const details = [
                `Rollback plan: Phase ${this.state.currentPhase} -> Phase ${targetPhase} (${PHASE_NAMES[targetPhase] ?? "Unknown"})`,
                "",
                "SDD state changes (auto):",
                `  - currentPhase: ${this.state.currentPhase} -> ${targetPhase}`,
                `  - Remove gateApprovals for Phase >= ${targetPhase}`,
                `  - Reset context monitor`,
                "",
                "SDD doc files to restore (auto):",
                ...plan.sddDocs.map(f => `  - ${f}`),
                ...(plan.sddDocs.length === 0 ? ["  - (none detected)"] : []),
                "",
                "Related code files to restore (auto, per task_plan.md):",
                ...plan.relatedCode.map(f => `  - ${f}`),
                ...(plan.relatedCode.length === 0 ? ["  - (none detected)"] : []),
            ];
            if (plan.otherCode.length > 0) {
                details.push("", "⚠️ Other code changes (NOT in task_plan.md) — requires YOUR decision:", ...plan.otherCode.map(f => `  - ${f}`), "", "code_scope options:", "  'none'      : Skip ALL code rollback (SDD state + docs only)", "  'related'   : Auto rollback related code, list other code for your choice", "  'all'       : Rollback everything (including other code)", "", "Set confirmed=true + choose code_scope to execute.");
            }
            else {
                details.push("", "No unrelated code changes detected.", "Set confirmed=true to execute rollback.");
            }
            if (plan.gitShaAtTarget)
                details.push("", `Git SHA at target phase: ${plan.gitShaAtTarget}`);
            if (plan.currentSha)
                details.push(`Current HEAD: ${plan.currentSha}`);
            return {
                success: false,
                message: `⚠️ HUMAN CONFIRMATION REQUIRED for rollback to Phase ${targetPhase}`,
                details,
                otherCodeChanges: plan.otherCode,
            };
        }
        const plan = this.planRollback(targetPhase);
        const results = [];
        results.push(`Rolling back from Phase ${this.state.currentPhase} to Phase ${targetPhase} (${PHASE_NAMES[targetPhase] ?? "Unknown"})`);
        this.state.rollbackTo(targetPhase);
        results.push("✅ SDD state rolled back");
        results.push(`  - currentPhase set to ${targetPhase}`);
        results.push(`  - gateApprovals cleared for Phase >= ${targetPhase}`);
        if (plan.sddDocs.length > 0) {
            this.gitRestore(plan.sddDocs, plan.gitShaAtTarget);
            results.push("✅ SDD doc files restored:");
            for (const f of plan.sddDocs)
                results.push(`  - ${f}`);
        }
        else {
            results.push("✅ No SDD doc changes to restore");
        }
        if (codeScope === "none") {
            results.push("ℹ️ Code rollback skipped (code_scope=none)");
        }
        else {
            if (plan.relatedCode.length > 0) {
                this.gitRestore(plan.relatedCode, plan.gitShaAtTarget);
                results.push("✅ Related code files restored (per task_plan.md):");
                for (const f of plan.relatedCode)
                    results.push(`  - ${f}`);
            }
            else {
                results.push("✅ No related code changes to restore");
            }
            if (plan.otherCode.length > 0) {
                if (codeScope === "all") {
                    this.gitRestore(plan.otherCode, plan.gitShaAtTarget);
                    results.push("✅ Other code files restored (code_scope=all):");
                    for (const f of plan.otherCode)
                        results.push(`  - ${f}`);
                }
                else {
                    results.push("⚠️ Other code NOT rolled back (user must decide per file):");
                    for (const f of plan.otherCode)
                        results.push(`  - ${f}`);
                    results.push("", "To rollback individually:");
                    for (const f of plan.otherCode)
                        results.push(`  git checkout ${plan.gitShaAtTarget ?? "HEAD~1"} -- "${f}"`);
                    results.push("", "Or re-run with code_scope='all' to rollback everything.");
                }
            }
        }
        this.writeCheckpoint(targetPhase);
        return {
            success: true,
            message: `Rollback to Phase ${targetPhase} (${PHASE_NAMES[targetPhase] ?? "Unknown"}) completed`,
            details: results,
            otherCodeChanges: codeScope !== "none" && codeScope !== "all" && plan.otherCode.length > 0 ? plan.otherCode : undefined,
        };
    }
    getHeadSha() {
        try {
            return execSync("git rev-parse HEAD", { cwd: this.projectDir, encoding: "utf-8" }).trim();
        }
        catch {
            return "";
        }
    }
    findShaAtPhase(targetPhase) {
        const checkpointDir = join(this.projectDir, "docs", "features", this.state.featureName, ".sdd");
        for (let phase = targetPhase; phase >= 0; phase--) {
            const phaseCheckpoint = join(checkpointDir, `checkpoint_phase${phase}.json`);
            if (existsSync(phaseCheckpoint)) {
                try {
                    const data = JSON.parse(readFileSync(phaseCheckpoint, "utf-8"));
                    if (data.gitSha)
                        return data.gitSha;
                }
                catch {
                    continue;
                }
            }
        }
        const mainCheckpoint = join(checkpointDir, "checkpoint.json");
        if (existsSync(mainCheckpoint)) {
            try {
                const data = JSON.parse(readFileSync(mainCheckpoint, "utf-8"));
                const cpPhase = parseInt(String(data.phase ?? "0"));
                if (cpPhase <= targetPhase && data.gitSha)
                    return data.gitSha;
            }
            catch { /* fall through */ }
        }
        try {
            const log = execSync(`git log --oneline -- "docs/features/${this.state.featureName}/"`, { cwd: this.projectDir, encoding: "utf-8" }).trim();
            if (!log)
                return undefined;
            const lines = log.split("\n");
            for (let i = lines.length - 1; i >= 0; i--) {
                const sha = lines[i].split(" ")[0];
                const files = this.getChangedFilesSince(sha);
                const hasDesignOrPlan = files.some(f => f.includes("design.md") || f.includes("task_plan.md") || f.includes("findings.md"));
                if (!hasDesignOrPlan)
                    return sha;
            }
        }
        catch { /* git not available */ }
        return undefined;
    }
    getChangedFilesSince(sha) {
        try {
            const output = execSync(`git diff --name-only ${sha} HEAD`, { cwd: this.projectDir, encoding: "utf-8" }).trim();
            return output ? output.split("\n").filter(f => f.length > 0) : [];
        }
        catch {
            return [];
        }
    }
    getFeatureChangedFiles(featureDir) {
        try {
            const output = execSync("git diff --name-only HEAD", { cwd: this.projectDir, encoding: "utf-8" }).trim();
            const featurePrefix = "docs/features/" + this.state.featureName;
            return output.split("\n").filter(f => f.startsWith(featurePrefix) || f.startsWith(".sdd/"));
        }
        catch {
            try {
                const output = execSync("git status --porcelain", { cwd: this.projectDir, encoding: "utf-8" }).trim();
                const featurePrefix = "docs/features/" + this.state.featureName;
                return output.split("\n").filter(l => l.length > 0).map(l => l.substring(3).trim()).filter(f => f.startsWith(featurePrefix) || f.startsWith(".sdd/"));
            }
            catch {
                return [];
            }
        }
    }
    getTaskPlanFiles(featureDir) {
        const planFile = join(featureDir, "task_plan.md");
        if (!existsSync(planFile))
            return [];
        try {
            const content = readFileSync(planFile, "utf-8");
            const files = [];
            const tagPattern = /(?:Modify|Create|Test|Change):\s+`([^`]+)`/g;
            let m;
            while ((m = tagPattern.exec(content)) !== null)
                files.push(m[1]);
            const pathPattern = /(?:src\/|tests\/|lib\/)[\w./-]+\.\w+/g;
            while ((m = pathPattern.exec(content)) !== null) {
                if (!files.includes(m[0]))
                    files.push(m[0]);
            }
            return files;
        }
        catch {
            return [];
        }
    }
    gitRestore(files, sha) {
        if (files.length === 0)
            return true;
        const target = sha ?? "HEAD~1";
        try {
            execSync(`git checkout ${target} -- ${files.map(f => `"${f}"`).join(" ")}`, { cwd: this.projectDir, encoding: "utf-8" });
            return true;
        }
        catch {
            for (const f of files) {
                try {
                    execSync(`git checkout ${target} -- "${f}"`, { cwd: this.projectDir, encoding: "utf-8" });
                }
                catch { /* skip files that don't exist at target */ }
            }
            return true;
        }
    }
    writeCheckpoint(targetPhase) {
        const checkpointDir = join(this.projectDir, "docs", "features", this.state.featureName, ".sdd");
        mkdirSync(checkpointDir, { recursive: true });
        const currentSha = this.getHeadSha();
        writeFileSync(join(checkpointDir, "checkpoint.json"), JSON.stringify({
            feature: this.state.featureName,
            phase: String(targetPhase),
            phaseName: PHASE_NAMES[targetPhase] ?? "Unknown",
            gateApprovals: this.state.gateApprovals,
            gitSha: currentSha,
            rollbackFrom: this.state.currentPhase,
            updatedAt: new Date().toISOString(),
        }, null, 2), "utf-8");
    }
}
//# sourceMappingURL=handler.js.map