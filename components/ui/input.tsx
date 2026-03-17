import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] dark:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}
