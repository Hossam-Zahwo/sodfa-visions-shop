import { createFileRoute } from "@tanstack/react-router";
import { ProductGrid } from "@/components/ProductCard";
import { useLang } from "@/lib/i18n";
import { onSale } from "@/data/catalog";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "العروض | SODFA صدفة" },
      { name: "description", content: "خصومات على منتجات مختارة من إكسسوارات صدفة لفترة محدودة." },
      { property: "og:title", content: "العروض | SODFA صدفة" },
      { property: "og:description", content: "خصومات على منتجات مختارة لفترة محدودة." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <span className="bg-sodfa block h-1 w-12 rounded-full" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold sm:text-4xl">{t("offers.title")}</h1>
      <p className="mt-1 text-sm text-subtle">{t("offers.sub")}</p>
      <div className="mt-8">
        <ProductGrid products={onSale()} />
      </div>
    </div>
  );
}
