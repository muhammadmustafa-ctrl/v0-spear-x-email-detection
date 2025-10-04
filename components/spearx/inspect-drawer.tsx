"use client"

import * as React from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ArtifactBadge } from "./artifact-badge"
import { RiskBadge } from "./risk-badge"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function InspectDrawer({ id }: { id: string }) {
  const [open, setOpen] = React.useState(false)
  const { data, isLoading } = useSWR(open ? `/api/emails/${id}` : null, fetcher)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Inspect
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Email Inspection</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : data?.error ? (
          <div className="text-sm text-red-600">Error: {data.error}</div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-pretty">{data.email.subject}</div>
                <div className="text-sm text-muted-foreground">{data.email.from_addr}</div>
              </div>
              <RiskBadge decision={data.email.decision} />
            </div>
            <Separator />
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="headers">Raw Headers</TabsTrigger>
                <TabsTrigger value="rendered">Rendered Safe</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="space-y-2">
                <div className="text-sm">
                  Score: <span className="font-semibold">{data.email.score}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.artifacts.map((a: any) => (
                    <ArtifactBadge key={`${a.type}:${a.value}`} type={a.type} />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">{data.email.snippet}</div>
              </TabsContent>
              <TabsContent value="headers">
                <pre className="text-xs overflow-auto max-h-80 p-3 rounded bg-muted">
                  {JSON.stringify(data.email.raw_headers, null, 2)}
                </pre>
              </TabsContent>
              <TabsContent value="rendered">
                {data.safeHtml ? (
                  <iframe
                    title="Safe Render"
                    className="w-full h-80 border rounded"
                    sandbox="allow-same-origin"
                    srcDoc={data.safeHtml}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">No HTML body</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
