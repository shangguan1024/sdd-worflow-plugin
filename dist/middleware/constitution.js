import { Phase } from "../state.js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
export const constitutionMiddleware = {
    check(phase, state, projectDir) {
        if (phase < Phase.REQUIREMENTS)
            return { allowed: true };
        const constDir = join(projectDir, "CONSTITUTION");
        if (!existsSync(constDir))
            return { allowed: true };
        const coreFile = join(constDir, "core.md");
        if (existsSync(coreFile)) {
            const principles = readFileSync(coreFile, "utf-8");
            return {
                allowed: true,
                message: `Constitution loaded. Core principles in effect:\n${principles.slice(0, 300)}`,
            };
        }
        return { allowed: true };
    },
};
//# sourceMappingURL=constitution.js.map