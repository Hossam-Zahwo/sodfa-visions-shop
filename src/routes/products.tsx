import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProductGrid } from "@/components/ProductCard";
import { useLang } from "@/lib/i18n";
import { listCategories, listStoreProducts, type DbCategory, type StoreProduct } from "@/lib/db";
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
      { name: "description", content: "تصفح كل منتجات صدفة." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { t, pick } = useLang();
  const { q, cat } = Route.useSearch();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([listStoreProducts(), listCategories()])
      .then(([nextProducts, nextCategories]) => {
        if (!alive) return;
        setProducts(nextProducts);
        setCategories(nextCategories);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "تعذر تحميل المنتجات"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const list = useMemo(() => {
    const term = (q ?? "").trim().toLowerCase();
    return products.filter((product) => {
      const okCat = !cat || product.category === cat;
      const okTerm = !term || product.name.ar.toLowerCase().includes(term) || product.name.en.toLowerCase().includes(term);
      return okCat && okTerm;
    });
  }, [products, q, cat]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-bold sm:text-4xl">{t("shop.title")}</h1>
      <p className="mt-1 text-sm text-subtle">{list.length} {t("shop.results")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/products" search={{ q, cat: undefined }} className={cn("rounded-full border px-4 py-2 text-xs", !cat ? "bg-sodfa border-transparent text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
          {t("shop.all")}
        </Link>
        {categories.map((c) => (
          <Link key={c.id} to="/products" search={{ q, cat: c.slug }} className={cn("rounded-full border px-4 py-2 text-xs", cat === c.slug ? "bg-sodfa border-transparent text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
            {pick(c.name_ar, c.name_en)}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {loading ? <p className="py-16 text-center text-sm text-subtle">جاري تحميل المنتجات...</p> : error ? <p className="py-16 text-center text-sm text-red-600">{error}</p> : list.length ? <ProductGrid products={list} includeVariants /> : <p className="py-16 text-center text-sm text-subtle">{t("shop.empty")}</p>}
      </div>
    </div>
  );
}
