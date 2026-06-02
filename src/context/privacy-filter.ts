export interface PrivacyFilterConfig {
  enabled: boolean
  patterns: string[]
}

export class PrivacyFilter {
  private config: PrivacyFilterConfig
  private detectionCount: number = 0
  private detections: string[] = []

  constructor(config?: PrivacyFilterConfig) {
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
    }
  }

  filterContent(content: string): string {
    if (!this.config.enabled) return content
    this.detectionCount = 0
    this.detections = []

    let filtered = content
    for (const pattern of this.config.patterns) {
      const regex = new RegExp(
        `(${pattern}\\s*[:=]\\s*)([^\\s,;\\n]+)`,
        "gi"
      )
      const matches = filtered.match(regex)
      if (matches) {
        this.detectionCount += matches.length
        this.detections.push(
          `Found ${matches.length} instances of ${pattern}`
        )
      }
      filtered = filtered.replace(regex, `$1[REDACTED]`)
    }
    return filtered
  }

  getStats(): { total_detections: number; patterns_checked: number } {
    return {
      total_detections: this.detectionCount,
      patterns_checked: this.config.patterns.length,
    }
  }
}