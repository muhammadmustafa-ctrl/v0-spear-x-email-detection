import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { exchangeCodeForTokens, getProfile } from "@/lib/gmail"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const stateCookie = cookies().get("gmail_oauth_state")?.value
  if (!code || !state || state !== stateCookie) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 })
  }
  const origin = new URL(request.url).origin
  try {
    const tokens = await exchangeCodeForTokens(code, origin)
    const profile = await getProfile(tokens.access_token)

    const supabase = getServerSupabase()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    const { error } = await supabase.from("gmail_accounts").upsert(
      {
        email: profile.emailAddress,
        access_token: tokens.access_token,
        access_token_expires_at: expiresAt,
        refresh_token: tokens.refresh_token || null,
        scope: tokens.scope,
        token_type: tokens.token_type,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    )
    if (error) throw error

    // Clear state cookie
    cookies().set("gmail_oauth_state", "", { path: "/", maxAge: 0 })
    // Redirect back to home
    return NextResponse.redirect(`${origin}/?connected=1`, { status: 302 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "OAuth failed" }, { status: 500 })
  }
}
