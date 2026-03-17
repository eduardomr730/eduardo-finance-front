"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/formatters";

export function NetWorthChart({
  data,
}: {
  data: Array<{ month: string; netWorth: number }>;
}) {
  const tooltipFormatter = (
    value: number | string | readonly (number | string)[] | undefined,
  ) => formatCurrency(Number(Array.isArray(value) ? value[0] : value ?? 0));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="netWorth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(value) => formatCurrency(value)} tickLine={false} axisLine={false} />
          <Tooltip formatter={tooltipFormatter} />
          <Area type="monotone" dataKey="netWorth" stroke="#0f766e" fill="url(#netWorth)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
