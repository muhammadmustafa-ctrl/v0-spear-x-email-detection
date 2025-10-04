"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

export function GmailConnect() {
  const [busy, setBusy] = useState(false)
  const hasGoogleVars = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SET)

  const onConnect = () => {
    window.location.href = "/api/gmail/auth"
  }

  const onSync = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      // basic refresh
      window.location.reload()
    } catch (e) {
      console.error("[v0] sync failed", e)
      alert("Sync failed. Check server logs and env vars.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={onConnect} variant="default" disabled={!hasGoogleVars}>
        Connect Gmail
      </Button>
      <Button onClick={onSync} variant="secondary" disabled={busy || !hasGoogleVars}>
        {busy ? "Syncing…" : "Sync"}
      </Button>
      {!hasGoogleVars && <span className="text-sm text-muted-foreground">Set GOOGLE_CLIENT_ID/SECRET to enable</span>}
    </div>
  )
}
