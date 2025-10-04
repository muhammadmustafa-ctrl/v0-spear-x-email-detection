import { Badge } from "@/components/ui/badge"

export function ArtifactBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    link: "bg-blue-600 text-white",
    form: "bg-amber-700 text-white",
    script: "bg-slate-700 text-white",
    idn: "bg-fuchsia-700 text-white",
    attachment: "bg-teal-700 text-white",
  }
  const cls = map[type] || "bg-gray-600 text-white"
  return <Badge className={cls}>{type}</Badge>
}
