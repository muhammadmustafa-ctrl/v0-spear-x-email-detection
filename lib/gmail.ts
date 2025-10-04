import { getServerSupabase } from "./supabase/server"

const OAUTH_AUTHORIZE = "https://accounts.google.com/o/oauth2/v2/auth"
const OAUTH_TOKEN = "https://oauth2.googleapis.com/token"
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1"

export const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "openid", "email", "profile"].join(" ")

export function buildAuthUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: `${origin}/api/gmail/callback`,
    response_type: "code",
    scope: GMAIL_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  })
  return `${OAUTH_AUTHORIZE}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string, origin: string) {
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: `${origin}/api/gmail/callback`,
    grant_type: "authorization_code",
  })
  const res = await fetch(OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<{
    access_token: string
    expires_in: number
    refresh_token?: string
    scope: string
    token_type: string
    id_token?: string
  }>
}

export async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  })
  const res = await fetch(OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`)
  return res.json() as Promise<{
    access_token: string
    expires_in: number
    scope: string
    token_type: string
  }>
}

export async function ensureAccessToken(accountEmail: string) {
  const supabase = getServerSupabase()
  const { data: acct, error } = await supabase
    .from("gmail_accounts")
    .select("*")
    .eq("email", accountEmail)
    .maybeSingle()
  if (error || !acct) throw new Error("Gmail account not connected")

  const now = Date.now()
  const expiresAt = acct.access_token_expires_at ? new Date(acct.access_token_expires_at).getTime() : 0

  if (now < expiresAt - 60_000) {
    return acct.access_token as string
  }

  if (!acct.refresh_token) {
    // If no refresh token, cannot refresh. Require re-consent.
    throw new Error("Missing refresh token; reconnect Gmail with consent")
  }

  const refreshed = await refreshAccessToken(acct.refresh_token)
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
  const { data: updated, error: upErr } = await supabase
    .from("gmail_accounts")
    .update({
      access_token: refreshed.access_token,
      access_token_expires_at: newExpiry,
      scope: refreshed.scope,
      token_type: refreshed.token_type,
      updated_at: new Date().toISOString(),
    })
    .eq("email", accountEmail)
    .select()
    .single()
  if (upErr) throw upErr
  return updated.access_token as string
}

export async function getProfile(accessToken: string) {
  const res = await fetch(`${GMAIL_API}/users/me/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!res.ok) throw new Error("Failed to get Gmail profile")
  return res.json() as Promise<{ emailAddress: string }>
}

export async function listMessages(accessToken: string, maxResults = 10) {
  const url = new URL(`${GMAIL_API}/users/me/messages`)
  url.searchParams.set("maxResults", String(maxResults))
  // Optional example filter: url.searchParams.set("q", "newer_than:7d")
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!res.ok) throw new Error("Failed to list messages")
  return res.json() as Promise<{ messages?: { id: string }[] }>
}

export async function getMessage(accessToken: string, id: string) {
  const url = `${GMAIL_API}/users/me/messages/${id}?format=full`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Failed to get message ${id}`)
  return res.json() as Promise<any>
}

export function extractHeaders(payload: any): Record<string, string> {
  const hdrs = payload?.headers || []
  const map: Record<string, string> = {}
  for (const h of hdrs) {
    if (h?.name && typeof h?.value === "string") {
      map[h.name.toLowerCase()] = h.value
    }
  }
  return map
}

export function extractHtmlBody(parts: any): string | null {
  if (!parts) return null
  // Traverse parts to find text/html
  const stack = Array.isArray(parts) ? [...parts] : [parts]
  while (stack.length) {
    const p = stack.shift()
    if (!p) continue
    if (p.mimeType === "text/html" && p.body?.data) {
      try {
        // Gmail returns base64url encoded body
        const decoded = Buffer.from(p.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
        return decoded
      } catch {
        return null
      }
    }
    if (p.parts) stack.push(...p.parts)
  }
  return null
}
