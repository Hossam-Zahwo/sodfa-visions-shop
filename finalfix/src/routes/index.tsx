import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeroSlider } from "@/components/HeroSlider";
import { FeatureStrip } from "@/components/FeatureStrip";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Stats } from "@/components/Stats";
import { Section } from "@/components/Section";
import { ProductGrid } from "@/components/ProductCard";
import { FindYourPhone } from "@/components/FindYourPhone";
import { useLang } from "@/lib/i18n";
import { listStoreProducts, type StoreProduct } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SODFA | صدفة — إكسسوارات هاتف بريميوم في مصر" },
      { name: "description", content: "متجر صدفة لإكسسوارات الهواتف والمنتجات المتاحة." },
    ],
  }),
  component: Index,
});

function ViewAll({ to, label }: { to: "/products" | "/offers" | "/categories"; label: string }) {
  return <Link to={to} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link>;
}

function Index() {
  const { t } = useLang();
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    listStoreProducts().then(setProducts).catch((error) => console.error("Home products failed:", error));
  }, []);

  const featured = products.filter((p) => p.tags.includes("featured"));
  const best = products.filter((p) => p.tags.includes("best"));
  const newest = products.filter((p) => p.tags.includes("new"));

  return (
    <>
      <HeroSlider />
      <FeatureStrip />
      <Section title={t("home.categories")} subtitle={t("home.categories.sub")} action={<ViewAll to="/categories" label={t("home.viewAll")} />}>
        <CategoryGrid />
      </Section>
      <Section title={t("home.featured")} action={<ViewAll to="/products" label={t("home.viewAll")} />}>
        {featured.length ? <ProductGrid products={featured} /> : <p className="py-10 text-center text-sm text-subtle">لا توجد منتجات مميزة حاليًا.</p>}
      </Section>
      <Stats />
      <Section title={t("home.best")} action={<ViewAll to="/products" label={t("home.viewAll")} />}>
        {best.length ? <ProductGrid products={best} /> : <p className="py-10 text-center text-sm text-subtle">لا توجد منتجات حاليًا.</p>}
      </Section>
      <FindYourPhone />
      <Section title={t("home.new")} action={<ViewAll to="/offers" label={t("home.viewAll")} />}>
        {newest.length ? <ProductGrid products={newest} /> : <p className="py-10 text-center text-sm text-subtle">لا توجد منتجات جديدة حاليًا.</p>}
      </Section>
    </>
  );
}
