import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-sodfa grid place-items-center rounded-xl font-bold text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      S
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark className="h-8 w-8 text-sm" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-[0.22em]">SODFA</span>
        <span className="text-[10px] tracking-[0.3em] text-subtle">صدفة</span>
      </span>
    </span>
  );
}
