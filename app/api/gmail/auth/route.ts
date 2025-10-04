import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"
import { buildAuthUrl } from "@/lib/gmail"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const state = crypto.randomBytes(16).toString("hex")
  cookies().set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  })
  const url = buildAuthUrl(origin, state)
  return NextResponse.redirect(url, { status: 302 })
}
