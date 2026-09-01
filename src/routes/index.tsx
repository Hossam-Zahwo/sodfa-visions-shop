import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroSlider } from "@/components/HeroSlider";
import { FeatureStrip } from "@/components/FeatureStrip";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Stats } from "@/components/Stats";
import { Section } from "@/components/Section";
import { ProductGrid } from "@/components/ProductCard";
import { FindYourPhone } from "@/components/FindYourPhone";
import { useLang } from "@/lib/i18n";
import { byTag } from "@/data/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SODFA | صدفة — إكسسوارات هاتف بريميوم في مصر" },
      {
        name: "description",
        content:
          "جرابات، شواحن سريعة، كابلات، باور بانك وسماعات بجودة عالية وتوصيل سريع لكل محافظات مصر.",
      },
      { property: "og:title", content: "SODFA | صدفة — إكسسوارات هاتف بريميوم" },
      {
        property: "og:description",
        content: "تشكيلة مختارة من إكسسوارات الهواتف بجودة بريميوم وتوصيل سريع.",
      },
    ],
  }),
  component: Index,
});

function ViewAll({ to, label }: { to: "/products" | "/offers" | "/categories"; label: string }) {
  return (
    <Link to={to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
      {label}
    </Link>
  );
}

function Index() {
  const { t } = useLang();

  return (
    <>
      <HeroSlider />
      <FeatureStrip />

      <Section
        title={t("home.categories")}
        subtitle={t("home.categories.sub")}
        action={<ViewAll to="/categories" label={t("home.viewAll")} />}
      >
        <CategoryGrid />
      </Section>

      <Section
        title={t("home.featured")}
        action={<ViewAll to="/products" label={t("home.viewAll")} />}
      >
        <ProductGrid products={byTag("featured")} />
      </Section>

      <Stats />

      <Section title={t("home.best")} action={<ViewAll to="/products" label={t("home.viewAll")} />}>
        <ProductGrid products={byTag("best")} />
      </Section>

      <FindYourPhone />

      <Section title={t("home.new")} action={<ViewAll to="/offers" label={t("home.viewAll")} />}>
        <ProductGrid products={byTag("new")} />
      </Section>
    </>
  );
}
