import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";

export function KpiCard({
  label,
  value,
  hint,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: number;
  hint: string;
  delta?: number;
  tone?: "neutral" | "positive" | "negative";
}) {
  const DeltaIcon = delta == null ? Minus : delta >= 0 ? ArrowUpRight : ArrowDownRight;
  const deltaColor =
    tone === "positive"
      ? "text-emerald-500"
      : tone === "negative"
        ? "text-rose-500"
        : "text-[var(--muted)]";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div>
          <p className="text-sm text-[var(--muted)]">{label}</p>
          <CardTitle className="mt-2 text-3xl">{formatCurrency(value)}</CardTitle>
        </div>
        <div className={`rounded-2xl border px-3 py-2 text-sm ${deltaColor}`}>
          <DeltaIcon className="mr-2 inline size-4" />
          {delta == null ? "Sin delta" : formatPercent(Math.abs(delta))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--muted)]">{hint}</p>
      </CardContent>
    </Card>
  );
}
