"use client"

import { Button } from "@/components/ui/button"

export function ConnectGmail() {
  return (
    <a href="/api/gmail/auth">
      <Button variant="default">Connect Gmail</Button>
    </a>
  )
}
