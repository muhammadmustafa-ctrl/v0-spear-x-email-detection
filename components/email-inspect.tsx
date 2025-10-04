"use client"

import useSWR from "swr"
import { sanitizeHtml } from "@/lib/sanitize"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function EmailInspect({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useSWR<{ email: any; artifacts: any[] }>(`/api/emails/${id}`, fetcher)
  const email = data?.email
  const artifacts = data?.artifacts || []

  const safeHtml = useMemo(() => (email?.html ? sanitizeHtml(email.html) : ""), [email?.html])

  if (!email) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="absolute right-0 top-0 h-full w-full sm:w-[600px] bg-background shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-medium text-pretty">{email.subject}</h3>
            <p className="text-sm text-muted-foreground">{email.from_addr}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="p-4 grid gap-4 overflow-y-auto">
          <section className="grid gap-1">
            <h4 className="font-medium">Summary</h4>
            <p className="text-sm text-muted-foreground">
              Score: {email.score} — Decision: <strong>{email.decision}</strong>
            </p>
          </section>

          <section className="grid gap-2">
            <h4 className="font-medium">Rendered (Safe)</h4>
            <div
              className="prose prose-sm max-w-none border rounded p-3 bg-card"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          </section>

          <section className="grid gap-2">
            <h4 className="font-medium">Raw Headers</h4>
            <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-3 rounded border">{email.raw_headers}</pre>
          </section>

          <section className="grid gap-2">
            <h4 className="font-medium">Artifacts</h4>
            <div className="grid gap-2">
              {artifacts.length === 0 && <p className="text-sm text-muted-foreground">No artifacts detected.</p>}
              {artifacts.map((a) => (
                <div key={a.id} className="text-sm border rounded p-2">
                  <div className="font-mono text-xs uppercase">{a.type}</div>
                  <div className="break-all">{a.value}</div>
                  {a.url && (
                    <div className="text-xs text-muted-foreground break-all">
                      URL: {a.url} {a.domain ? `(${a.domain})` : ""}
                    </div>
                  )}
                  {(a.is_idn || a.is_ip) && (
                    <div className="text-xs text-amber-600">
                      {a.is_idn ? "IDN" : ""} {a.is_ip ? "IP" : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
