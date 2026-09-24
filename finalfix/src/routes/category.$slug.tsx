import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductGrid } from "@/components/ProductCard";
import { useLang } from "@/lib/i18n";
import { listCategories, listStoreProducts } from "@/lib/db";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const [categoryList, products] = await Promise.all([listCategories(), listStoreProducts()]);
    const category = categoryList.find((item) => item.slug === params.slug);
    if (!category) throw notFound();

    return {
      category,
      products: products.filter((product) => product.categoryId === category.id),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "غير متاح | SODFA" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.category.name_ar} | SODFA صدفة`;
    return {
      meta: [
        { title },
        { name: "description", content: `تسوّق ${loaderData.category.name_ar} من صدفة.` },
        { property: "og:title", content: title },
        { property: "og:description", content: `منتجات ${loaderData.category.name_ar} من صدفة.` },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const data = Route.useLoaderData();
  const { pick, t } = useLang();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <span className="bg-sodfa block h-1 w-12 rounded-full" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold sm:text-4xl">
        {pick(data.category.name_ar, data.category.name_en)}
      </h1>
      <p className="mt-1 text-sm text-subtle">
        {data.products.length} {t("shop.results")}
      </p>
      <div className="mt-8">
        {data.products.length ? (
          <ProductGrid products={data.products} />
        ) : (
          <p className="py-16 text-center text-sm text-subtle">{t("shop.empty")}</p>
        )}
      </div>
    </div>
  );
}
