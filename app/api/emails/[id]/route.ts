import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"
import { sanitizeHtml } from "@/lib/sanitize"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase()
  const { data: email, error } = await supabase
    .from("emails")
    .select("id, from_addr, subject, date, score, decision, quarantined, html, raw_headers, snippet")
    .eq("id", params.id)
    .maybeSingle()
  if (error || !email) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: artifacts } = await supabase
    .from("artifacts")
    .select("id, type, value, risk")
    .eq("email_id", params.id)
    .order("risk", { ascending: false })

  const safeHtml = email.html ? sanitizeHtml(email.html) : null
  return NextResponse.json({ email, artifacts: artifacts || [], safeHtml })
}
