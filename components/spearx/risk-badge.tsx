import { Badge } from "@/components/ui/badge"

export function RiskBadge({ decision }: { decision: "deliver" | "banner" | "quarantine" }) {
  const color =
    decision === "deliver"
      ? "bg-green-600 text-white"
      : decision === "banner"
        ? "bg-amber-600 text-white"
        : "bg-red-600 text-white"
  return <Badge className={color}>{decision}</Badge>
}
