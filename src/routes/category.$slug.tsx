import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductGrid } from "@/components/ProductCard";
import { useLang } from "@/lib/i18n";
import { byCategory, categories } from "@/data/catalog";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const cat = categories.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    return { slug: cat.slug, ar: cat.name.ar, en: cat.name.en };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "غير متاح | SODFA" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.ar} | SODFA صدفة`;
    const description = `تسوّق ${loaderData.ar} من صدفة بجودة بريميوم وتوصيل سريع داخل مصر.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const data = Route.useLoaderData();
  const { pick, t } = useLang();
  const list = byCategory(data.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <span className="bg-sodfa block h-1 w-12 rounded-full" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold sm:text-4xl">{pick(data.ar, data.en)}</h1>
      <p className="mt-1 text-sm text-subtle">
        {list.length} {t("shop.results")}
      </p>
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
