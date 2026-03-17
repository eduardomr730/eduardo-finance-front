"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeEuro,
  BriefcaseBusiness,
  CalendarRange,
  ChartColumnBig,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Settings2,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  "/dashboard": LayoutDashboard,
  "/transactions": CreditCard,
  "/budgets": Wallet,
  "/freelance": BriefcaseBusiness,
  "/taxes": ReceiptText,
  "/investments": ChartColumnBig,
  "/net-worth": PiggyBank,
  "/forecast": CalendarRange,
  "/settings": Settings2,
} as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass sticky top-6 h-[calc(100vh-3rem)] rounded-[2rem] border p-5">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent)]/15">
          <BadgeEuro className="size-6 text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
            Personal OS
          </p>
          <h2 className="text-lg font-semibold">Finance Control</h2>
        </div>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.href as keyof typeof iconMap] ?? CircleDollarSign;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition",
                active
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "hover:bg-black/5 dark:hover:bg-white/5",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4" />
                {item.label}
              </span>
              {item.href === "/taxes" ? <Badge tone="warning">ES</Badge> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
