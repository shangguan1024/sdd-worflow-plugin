export class PrivacyFilter {
    config;
    detectionCount = 0;
    detections = [];
    constructor(config) {
        this.config = config ?? {
            enabled: true,
            patterns: [
                "password",
                "secret",
                "api_key",
                "token",
                "credential",
                "private_key",
            ],
        };
    }
    filterContent(content) {
        if (!this.config.enabled)
            return content;
        this.detectionCount = 0;
        this.detections = [];
        let filtered = content;
        for (const pattern of this.config.patterns) {
            const regex = new RegExp(`(${pattern}\\s*[:=]\\s*)([^\\s,;\\n]+)`, "gi");
            const matches = filtered.match(regex);
            if (matches) {
                this.detectionCount += matches.length;
                this.detections.push(`Found ${matches.length} instances of ${pattern}`);
            }
            filtered = filtered.replace(regex, `$1[REDACTED]`);
        }
        return filtered;
    }
    getStats() {
        return {
            total_detections: this.detectionCount,
            patterns_checked: this.config.patterns.length,
        };
    }
}
//# sourceMappingURL=privacy-filter.js.map