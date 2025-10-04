"use client"

import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { EmailInspect } from "./email-inspect"

type Row = {
  id: string
  date: string
  from_addr: string
  subject: string
  score: number
  decision: "deliver" | "banner" | "quarantine"
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function DecisionBadge({ decision }: { decision: Row["decision"] }) {
  const color =
    decision === "quarantine"
      ? "bg-destructive text-destructive-foreground"
      : decision === "banner"
        ? "bg-yellow-600 text-white"
        : "bg-emerald-600 text-white"
  return <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{decision}</span>
}

export function EmailTable() {
  const { data, isLoading } = useSWR<{ emails: Row[] }>("/api/emails", fetcher)
  const [openId, setOpenId] = useState<string | null>(null)

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>
  const rows = data?.emails || []
  if (!rows.length) return <div className="text-sm text-muted-foreground">No emails yet. Click Sync.</div>

  return (
    <>
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-foreground">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">From</th>
              <th className="text-left p-3">Subject</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Decision</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{new Date(r.date).toLocaleString()}</td>
                <td className="p-3">{r.from_addr}</td>
                <td className="p-3">{r.subject}</td>
                <td className="p-3">{r.score}</td>
                <td className="p-3">
                  <DecisionBadge decision={r.decision} />
                </td>
                <td className="p-3">
                  <Button size="sm" variant="outline" onClick={() => setOpenId(r.id)}>
                    Inspect
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openId && <EmailInspect id={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
