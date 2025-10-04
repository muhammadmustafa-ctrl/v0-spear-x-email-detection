import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("emails")
    .select("id, from_addr, subject, date, score, decision, quarantined")
    .order("date", { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ emails: data })
}
