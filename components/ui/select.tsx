import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] dark:bg-white/5",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
