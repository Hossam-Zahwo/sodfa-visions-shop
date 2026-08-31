import { LogoMark } from "./Logo";

export function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="relative grid place-items-center">
        <span
          className="bg-sodfa absolute h-24 w-24 rounded-full blur-2xl"
          style={{ animation: "sodfa-pulse-glow 2s ease-in-out infinite" }}
          aria-hidden
        />
        <LogoMark className="relative h-14 w-14 text-xl glow-strong" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="skeleton aspect-square w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/3 rounded" />
      </div>
    </div>
  );
}
