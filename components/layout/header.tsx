"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
          Finance OS
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">{subtitle}</p>
      </div>
      <Button
        variant="secondary"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {resolvedTheme === "dark" ? (
          <SunMedium className="mr-2 size-4" />
        ) : (
          <Moon className="mr-2 size-4" />
        )}
        {resolvedTheme === "dark" ? "Modo claro" : "Modo oscuro"}
      </Button>
    </header>
  );
}
