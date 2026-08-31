import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Single image entry point for the whole app.
 * Later this can resolve Supabase Storage URLs / WebP variants without
 * touching any consumer component.
 */
export function resolveImage(src: string) {
  return src;
}

type Props = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  ratio?: "square" | "wide" | "portrait";
};

const ratios = {
  square: "aspect-square",
  wide: "aspect-[16/9]",
  portrait: "aspect-[4/5]",
};

export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
  ratio = "square",
}: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-card", ratios[ratio], className)}>
      {!loaded && <div className="skeleton absolute inset-0" aria-hidden />}
      <img
        src={resolveImage(src)}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-700",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
    </div>
  );
}
