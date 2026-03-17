"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/formatters";

export function CashflowChart({
  data,
}: {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
    realCashflow: number;
  }>;
}) {
  const tooltipFormatter = (
    value: number | string | readonly (number | string)[] | undefined,
  ) => formatCurrency(Number(Array.isArray(value) ? value[0] : value ?? 0));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(value) => formatCurrency(value)} tickLine={false} axisLine={false} />
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
          <Bar dataKey="income" fill="#0f766e" radius={[8, 8, 0, 0]} />
          <Bar dataKey="expenses" fill="#be123c" radius={[8, 8, 0, 0]} />
          <Bar dataKey="realCashflow" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
