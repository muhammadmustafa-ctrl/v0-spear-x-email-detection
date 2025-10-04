export type Artifact =
  | { type: "link"; value: string }
  | { type: "form"; value: string }
  | { type: "script"; value: string }
  | { type: "idn"; value: string }
  | { type: "attachment"; value: string }

export function extractArtifacts({
  headers,
  html,
}: {
  headers: Record<string, string>
  html: string | null
}): Artifact[] {
  const artifacts: Artifact[] = []

  // Links from HTML (basic)
  if (html) {
    const linkRegex = /href\s*=\s*["']([^"']+)["']/gi
    let m: RegExpExecArray | null
    while ((m = linkRegex.exec(html)) !== null) {
      artifacts.push({ type: "link", value: m[1] })
    }

    // Forms
    const formRegex = /<form[^>]*action\s*=\s*["']?([^"'\s>]+)["']?[^>]*>/gi
    while ((m = formRegex.exec(html)) !== null) {
      artifacts.push({ type: "form", value: m[1] })
    }

    // Scripts (src only; inline script flagged as 'script: inline')
    const scriptSrcRegex = /<script[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi
    while ((m = scriptSrcRegex.exec(html)) !== null) {
      artifacts.push({ type: "script", value: m[1] })
    }
    const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi
    if (inlineScriptRegex.test(html)) {
      artifacts.push({ type: "script", value: "inline" })
    }
  }

  // IDN domains in links
  for (const a of artifacts) {
    if (a.type === "link" || a.type === "form") {
      try {
        const u = new URL(a.value, "https://placeholder.local")
        if (/[^\x00-\x7F]/.test(u.hostname)) {
          artifacts.push({ type: "idn", value: u.hostname })
        }
      } catch {
        // ignore invalid URL
      }
    }
  }

  // Attachments placeholder: headers may include content-disposition or parts listing
  const cd = headers["content-disposition"]
  if (cd && /attachment/i.test(cd)) {
    artifacts.push({ type: "attachment", value: cd })
  }

  return dedupeArtifacts(artifacts)
}

function dedupeArtifacts(list: Artifact[]): Artifact[] {
  const seen = new Set<string>()
  const out: Artifact[] = []
  for (const it of list) {
    const key = `${it.type}:${it.value}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(it)
    }
  }
  return out
}
