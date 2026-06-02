import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { Phase } from "../state.js";
const DESIGN_RULES = [
    {
        id: "DESIGN-001",
        name: "Single Responsibility",
        category: "design",
        check: (content, filePath) => {
            if (filePath.includes("design.md") && !content.includes("Module") && !content.includes("Responsibility")) {
                return {
                    rule_id: "DESIGN-001",
                    rule_name: "Single Responsibility",
                    description: "Design document should define module responsibilities",
                    location: filePath,
                    suggestion: "Add module responsibility definition",
                };
            }
            return null;
        },
    },
    {
        id: "DESIGN-002",
        name: "Interface Segregation",
        category: "design",
        check: (content, filePath) => {
            if (filePath.includes("interface") && content.includes("interface")) {
                const methods = content.match(/fn\s+\w+\s*\(/g);
                if (methods && methods.length > 10) {
                    return {
                        rule_id: "DESIGN-002",
                        rule_name: "Interface Segregation",
                        description: `Interface has ${methods.length} methods, exceeds 10 method limit`,
                        location: filePath,
                        suggestion: "Split interface into smaller interfaces",
                    };
                }
            }
            return null;
        },
    },
    {
        id: "DESIGN-005",
        name: "API Documentation",
        category: "design",
        check: (content, filePath) => {
            if (filePath.includes("interface") && content.includes("fn ")) {
                const publicApis = content.match(/pub\s+fn\s+\w+/g);
                const docstrings = content.match(/\/\/\/|\/\*\*/g);
                if (publicApis && publicApis.length > 0 && (!docstrings || docstrings.length < publicApis.length)) {
                    return {
                        rule_id: "DESIGN-005",
                        rule_name: "API Documentation",
                        description: "Public APIs missing docstrings",
                        location: filePath,
                        suggestion: "Add docstrings to all public APIs",
                    };
                }
            }
            return null;
        },
    },
];
const IMPL_RULES = [
    {
        id: "IMPL-001",
        name: "Error Handling",
        category: "implementation",
        check: (content, filePath) => {
            if (filePath.endsWith(".ts") || filePath.endsWith(".rs") || filePath.endsWith(".py")) {
                const unwrapCount = (content.match(/\.unwrap\(\)/g) || []).length;
                const panicCount = (content.match(/panic!/g) || []).length;
                if (unwrapCount > 3 || panicCount > 0) {
                    return {
                        rule_id: "IMPL-001",
                        rule_name: "Error Handling",
                        description: `Found ${unwrapCount} unwrap() and ${panicCount} panic! calls`,
                        location: filePath,
                        suggestion: "Use Result/Option error handling instead",
                    };
                }
            }
            return null;
        },
    },
    {
        id: "IMPL-002",
        name: "Test Coverage",
        category: "implementation",
        check: (content, filePath) => {
            if (filePath.includes("src/") && !filePath.includes("test")) {
                if (!content.includes("test") && !content.includes("spec")) {
                    return {
                        rule_id: "IMPL-002",
                        rule_name: "Test Coverage",
                        description: "No tests found for this file",
                        location: filePath,
                        suggestion: "Add unit tests for this module",
                    };
                }
            }
            return null;
        },
    },
];
export class ConstitutionEnforcer {
    projectDir;
    rules;
    constructor(projectDir) {
        this.projectDir = projectDir;
        this.rules = [...DESIGN_RULES, ...IMPL_RULES];
    }
    check(phase, content, filePath) {
        const violations = [];
        const warnings = [];
        const constitutionDir = join(this.projectDir, "CONSTITUTION");
        if (existsSync(join(constitutionDir, "core.md"))) {
            const coreContent = readFileSync(join(constitutionDir, "core.md"), "utf-8");
            warnings.push("Constitution loaded. Core principles in effect.");
        }
        if (phase >= Phase.REQUIREMENTS) {
            const applicableRules = this.rules.filter((r) => r.category === "design" || (phase >= Phase.DEVELOPMENT && r.category === "implementation"));
            for (const rule of applicableRules) {
                const violation = rule.check(content, filePath);
                if (violation) {
                    violations.push(violation);
                }
            }
        }
        return {
            passed: violations.length === 0,
            violations,
            warnings,
        };
    }
    checkDesign(designContent) {
        const violations = [];
        for (const rule of DESIGN_RULES) {
            const violation = rule.check(designContent, "design.md");
            if (violation) {
                violations.push(violation);
            }
        }
        return {
            passed: violations.length === 0,
            violations,
            warnings: [],
        };
    }
    checkCode(codeContent, filePath) {
        const violations = [];
        for (const rule of IMPL_RULES) {
            const violation = rule.check(codeContent, filePath);
            if (violation) {
                violations.push(violation);
            }
        }
        return {
            passed: violations.length === 0,
            violations,
            warnings: [],
        };
    }
    getRules() {
        return this.rules;
    }
    addRule(rule) {
        this.rules.push(rule);
    }
}
//# sourceMappingURL=constitution.js.map