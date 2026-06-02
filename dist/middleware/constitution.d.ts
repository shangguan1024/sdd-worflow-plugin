import { Phase } from "../state.js";
export interface ConstitutionResult {
    passed: boolean;
    violations: ConstitutionViolation[];
    warnings: string[];
}
export interface ConstitutionViolation {
    rule_id: string;
    rule_name: string;
    description: string;
    location?: string;
    suggestion?: string;
}
export interface ConstitutionRule {
    id: string;
    name: string;
    category: "design" | "implementation" | "review" | "workflow";
    pattern?: RegExp;
    check: (content: string, filePath: string) => ConstitutionViolation | null;
}
export declare class ConstitutionEnforcer {
    private projectDir;
    private rules;
    constructor(projectDir: string);
    check(phase: Phase, content: string, filePath: string): ConstitutionResult;
    checkDesign(designContent: string): ConstitutionResult;
    checkCode(codeContent: string, filePath: string): ConstitutionResult;
    getRules(): ConstitutionRule[];
    addRule(rule: ConstitutionRule): void;
}
