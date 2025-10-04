import type { Artifact } from "./extract"

export type RiskScore = {
  score: number
  reasons: string[]
  decision: "deliver" | "banner" | "quarantine"
}

export function scoreArtifacts(artifacts: Artifact[], meta: { from?: string; subject?: string }): RiskScore {
  let score = 0
  const reasons: string[] = []

  // Weights (tweak as needed)
  const weights = {
    link: 5,
    form: 10,
    script: 8,
    idn: 12,
    attachment: 6,
    keyword: 7,
    manyLinksThreshold: 5,
    manyLinksPenalty: 8,
  }

  const counts = {
    link: artifacts.filter((a) => a.type === "link").length,
    form: artifacts.filter((a) => a.type === "form").length,
    script: artifacts.filter((a) => a.type === "script").length,
    idn: artifacts.filter((a) => a.type === "idn").length,
    attachment: artifacts.filter((a) => a.type === "attachment").length,
  }

  for (const [k, v] of Object.entries(counts)) {
    if (v > 0) {
      score += (weights as any)[k] * v
      reasons.push(`${k}:${v}`)
    }
  }

  if (counts.link > weights.manyLinksThreshold) {
    score += weights.manyLinksPenalty
    reasons.push("many-links")
  }

  // Subject/From suspicious keywords
  const keywords = [/verify/i, /reset/i, /password/i, /urgent/i, /invoice/i, /gift/i, /crypto/i]
  const bag = `${meta.subject || ""} ${meta.from || ""}`
  if (keywords.some((rx) => rx.test(bag))) {
    score += weights.keyword
    reasons.push("keyword")
  }

  let decision: RiskScore["decision"] = "deliver"
  if (score >= 35) decision = "quarantine"
  else if (score >= 15) decision = "banner"

  return { score, reasons, decision }
}
