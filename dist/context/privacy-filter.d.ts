export interface PrivacyFilterConfig {
    enabled: boolean;
    patterns: string[];
}
export declare class PrivacyFilter {
    private config;
    private detectionCount;
    private detections;
    constructor(config?: PrivacyFilterConfig);
    filterContent(content: string): string;
    getStats(): {
        total_detections: number;
        patterns_checked: number;
    };
}
