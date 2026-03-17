import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] dark:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}
