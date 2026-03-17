"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/formatters";

const COLORS = ["#0f766e", "#1d4ed8", "#b45309", "#7c3aed", "#be123c", "#6b7280"];

export function CategoryBreakdownChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  const tooltipFormatter = (
    value: number | string | readonly (number | string)[] | undefined,
  ) => formatCurrency(Number(Array.isArray(value) ? value[0] : value ?? 0));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={76} outerRadius={110}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={tooltipFormatter} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
