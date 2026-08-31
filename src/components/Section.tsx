import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16", className)}>
      {(title || action) && (
        <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:mb-8">
          <div className="min-w-0">
            {title && <h2 className="text-xl font-bold sm:text-3xl">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-subtle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
