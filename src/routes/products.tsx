import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ProductGrid } from "@/components/ProductCard";
import { useLang } from "@/lib/i18n";
import { categories, products } from "@/data/catalog";
import { cn } from "@/lib/utils";

type Search = { q?: string; cat?: string };

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    cat: typeof search.cat === "string" && search.cat ? search.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "كل المنتجات | SODFA صدفة" },
      {
        name: "description",
        content: "تصفح كل إكسسوارات الهواتف من صدفة: جرابات، شواحن، كابلات، سماعات وأكثر.",
      },
      { property: "og:title", content: "كل المنتجات | SODFA صدفة" },
      { property: "og:description", content: "تصفح كل إكسسوارات الهواتف من صدفة." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { t, pick } = useLang();
  const { q, cat } = Route.useSearch();

  const list = useMemo(() => {
    const term = (q ?? "").trim().toLowerCase();
    return products.filter((p) => {
      const okCat = !cat || p.category === cat;
      const okTerm =
        !term ||
        p.name.ar.toLowerCase().includes(term) ||
        p.name.en.toLowerCase().includes(term);
      return okCat && okTerm;
    });
  }, [q, cat]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-bold sm:text-4xl">{t("shop.title")}</h1>
      <p className="mt-1 text-sm text-subtle">
        {list.length} {t("shop.results")}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to="/products"
          search={{ q, cat: undefined }}
          className={cn(
            "rounded-full border px-4 py-2 text-xs transition-colors sm:text-sm",
            !cat
              ? "bg-sodfa border-transparent text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/50",
          )}
        >
          {t("shop.all")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            to="/products"
            search={{ q, cat: c.slug }}
            className={cn(
              "rounded-full border px-4 py-2 text-xs transition-colors sm:text-sm",
              cat === c.slug
                ? "bg-sodfa border-transparent text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50",
            )}
          >
            {pick(c.name.ar, c.name.en)}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {list.length ? (
          <ProductGrid products={list} />
        ) : (
          <p className="py-16 text-center text-sm text-subtle">{t("shop.empty")}</p>
        )}
      </div>
    </div>
  );
}
