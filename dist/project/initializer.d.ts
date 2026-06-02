export declare class ProjectInitializer {
    private projectDir;
    constructor(projectDir: string);
    isInitialized(path: string): boolean;
    initializeAll(path: string, template: string): void;
    createDirectoryStructure(path: string): void;
    initializeConstitution(path: string): void;
    initializeMemoryArtifacts(path: string): void;
    initializeConfig(path: string, template: string): void;
    initializeFeatureArtifacts(featureDir: string, featureName: string): void;
}
