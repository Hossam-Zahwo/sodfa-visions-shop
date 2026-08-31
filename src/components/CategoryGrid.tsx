import { Link } from "@tanstack/react-router";
import { SmartImage } from "./SmartImage";
import { useLang } from "@/lib/i18n";
import { categories } from "@/data/catalog";

export function CategoryGrid() {
  const { pick } = useLang();

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {categories.map((c) => (
        <Link
          key={c.slug}
          to="/category/$slug"
          params={{ slug: c.slug }}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
        >
          <SmartImage
            src={c.image}
            alt={pick(c.name.ar, c.name.en)}
            ratio="square"
            imgClassName="opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <span className="absolute bottom-3 start-4 text-sm font-medium sm:text-base">
            {pick(c.name.ar, c.name.en)}
          </span>
        </Link>
      ))}
    </div>
  );
}
