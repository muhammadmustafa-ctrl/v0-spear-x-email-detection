"use client"

import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RiskBadge } from "./risk-badge"
import { InspectDrawer } from "./inspect-drawer"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function EmailTable() {
  const { data, isLoading, mutate } = useSWR("/api/emails", fetcher)

  async function syncNow() {
    await fetch("/api/gmail/sync", { method: "POST", body: JSON.stringify({}) })
    mutate()
  }

  async function toggleQuarantine(id: string, next: boolean) {
    await fetch(`/api/emails/${id}/quarantine`, { method: "POST", body: JSON.stringify({ quarantined: next }) })
    mutate()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Latest synced emails</div>
        <Button onClick={syncNow} variant="secondary">
          Sync
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>From</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Decision</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-sm">
                Loading…
              </TableCell>
            </TableRow>
          ) : data?.emails?.length ? (
            data.emails.map((e: any) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{new Date(e.date).toLocaleString()}</TableCell>
                <TableCell className="text-xs">{e.from_addr}</TableCell>
                <TableCell className="text-sm">{e.subject}</TableCell>
                <TableCell className="text-sm">{e.score}</TableCell>
                <TableCell>
                  <RiskBadge decision={e.decision} />
                </TableCell>
                <TableCell className="text-right flex gap-2 justify-end">
                  <InspectDrawer id={e.id} />
                  <Button
                    size="sm"
                    variant={e.quarantined ? "destructive" : "outline"}
                    onClick={() => toggleQuarantine(e.id, !e.quarantined)}
                  >
                    {e.quarantined ? "Unquarantine" : "Quarantine"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-sm">
                No emails yet. Click Sync after connecting Gmail.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
