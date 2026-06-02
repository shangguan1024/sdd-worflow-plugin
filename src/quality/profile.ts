export interface QualityProfile {
  name: string
  lintRequired: boolean
  testCoverageThreshold: number
  typeCheckRequired: boolean
  integrationTestRequired: boolean
}

export function getProfile(name: string): QualityProfile {
  const profiles: Record<string, QualityProfile> = {
    standard: {
      name: "standard",
      lintRequired: true,
      testCoverageThreshold: 80,
      typeCheckRequired: true,
      integrationTestRequired: true,
    },
    strict: {
      name: "strict",
      lintRequired: true,
      testCoverageThreshold: 95,
      typeCheckRequired: true,
      integrationTestRequired: true,
    },
    relaxed: {
      name: "relaxed",
      lintRequired: false,
      testCoverageThreshold: 60,
      typeCheckRequired: false,
      integrationTestRequired: false,
    },
  }
  return profiles[name] ?? profiles.standard
}