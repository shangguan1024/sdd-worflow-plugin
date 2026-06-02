export interface QualityProfile {
    name: string;
    lintRequired: boolean;
    testCoverageThreshold: number;
    typeCheckRequired: boolean;
    integrationTestRequired: boolean;
}
export declare function getProfile(name: string): QualityProfile;
