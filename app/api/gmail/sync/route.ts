import { NextResponse } from "next/server"
import { ensureAccessToken, listMessages, getMessage, extractHeaders, extractHtmlBody } from "@/lib/gmail"
import { extractArtifacts } from "@/lib/scanner/extract"
import { scoreArtifacts } from "@/lib/scanner/score"
import { getServerSupabase } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = getServerSupabase()
    const emailParam = (await request.json().catch(() => ({})))?.email as string | undefined

    // If caller passes a connected Gmail address, use it; else pick first connected
    let accountEmail = emailParam
    if (!accountEmail) {
      const { data: acct } = await supabase
        .from("gmail_accounts")
        .select("email")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!acct?.email) {
        return NextResponse.json({ error: "No connected Gmail account" }, { status: 400 })
      }
      accountEmail = acct.email
    }

    const accessToken = await ensureAccessToken(accountEmail)
    const list = await listMessages(accessToken, 10)
    const msgIds = list.messages?.map((m) => m.id) || []

    const upserts = []
    for (const id of msgIds) {
      const m = await getMessage(accessToken, id)
      const payload = m.payload
      const headers = extractHeaders(payload)
      const html = extractHtmlBody(payload?.parts) || null

      const from = headers["from"] || ""
      const subject = headers["subject"] || ""
      const dateStr = headers["date"] || ""
      const date = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString()

      const artifacts = extractArtifacts({ headers, html })
      const risk = scoreArtifacts(artifacts, { from, subject })

      upserts.push({
        gmail_id: id,
        from_addr: from,
        subject,
        date,
        snippet: m.snippet || "",
        html,
        raw_headers: payload?.headers ? payload.headers : null,
        score: risk.score,
        decision: risk.decision,
        quarantined: risk.decision === "quarantine",
        created_at: new Date().toISOString(),
      })
    }

    // Upsert emails and their artifacts
    for (const row of upserts) {
      const { data: saved, error } = await supabase
        .from("emails")
        .upsert(row, { onConflict: "gmail_id" })
        .select("id, gmail_id")
        .single()
      if (error) throw error

      // Delete existing artifacts for this email then insert new
      await supabase.from("artifacts").delete().eq("email_id", saved.id)
      const artifacts = extractArtifacts({
        headers: Object.fromEntries(Object.entries(row.raw_headers || {}).map(([k, v]) => [k, v as any])),
        html: row.html,
      })
      const mapped = artifacts.map((a) => ({
        email_id: saved.id,
        type: a.type,
        value: a.value,
        risk:
          a.type === "idn" ? 12 : a.type === "form" ? 10 : a.type === "script" ? 8 : a.type === "attachment" ? 6 : 5,
      }))
      if (mapped.length) {
        await supabase.from("artifacts").insert(mapped)
      }
    }

    return NextResponse.json({ ok: true, synced: upserts.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Sync failed" }, { status: 500 })
  }
}
