import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/ProductCard";
import { useLang } from "@/lib/i18n";
import { listStoreProducts, type StoreProduct } from "@/lib/db";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "العروض | SODFA صدفة" },
      { name: "description", content: "خصومات على منتجات مختارة من صدفة." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { t } = useLang();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  useEffect(() => { listStoreProducts().then(setProducts).catch(console.error); }, []);
  const offers = products.filter((p) => p.oldPrice && p.oldPrice > p.price);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <span className="bg-sodfa block h-1 w-12 rounded-full" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold sm:text-4xl">{t("offers.title")}</h1>
      <p className="mt-1 text-sm text-subtle">{t("offers.sub")}</p>
      <div className="mt-8">
        {offers.length ? <ProductGrid products={offers} /> : <p className="py-16 text-center text-sm text-subtle">لا توجد عروض حاليًا.</p>}
      </div>
    </div>
  );
}
