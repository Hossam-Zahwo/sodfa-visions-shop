import { createFileRoute } from "@tanstack/react-router";
import { CategoryGrid } from "@/components/CategoryGrid";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "الأقسام | SODFA صدفة" },
      {
        name: "description",
        content: "تصفح أقسام صدفة: جرابات، شواحن، كابلات، باور بانك، شحن لاسلكي وإكسسوارات السيارة.",
      },
      { property: "og:title", content: "الأقسام | SODFA صدفة" },
      { property: "og:description", content: "كل أقسام إكسسوارات الهواتف في مكان واحد." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <span className="bg-sodfa block h-1 w-12 rounded-full" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold sm:text-4xl">{t("categories.title")}</h1>
      <p className="mt-1 text-sm text-subtle">{t("home.categories.sub")}</p>
      <div className="mt-8">
        <CategoryGrid />
      </div>
    </div>
  );
}
