import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { ProductGrid } from "@/components/ProductCard";
import { Section } from "@/components/Section";
import { useLang } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { getStoreProduct, listStoreProducts } from "@/lib/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getStoreProduct(params.slug);
    if (!product) throw notFound();
    const all = await listStoreProducts();
    return { product, related: all.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "غير متاح | SODFA" }] };
    const title = `${loaderData.product.name.ar} | SODFA صدفة`;
    return { meta: [{ title }, { name: "description", content: loaderData.product.description.ar.slice(0, 155) }] };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product, related } = Route.useLoaderData();
  const { t, pick, price } = useLang();
  const { add } = useCart();
  const [img, setImg] = useState(0);
  const [color, setColor] = useState(product.colors[0]);
  const [model, setModel] = useState(product.models?.[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const off = product.oldPrice && product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  const onAdd = () => {
    add(product, { color: color ? pick(color.name.ar, color.name.en) : undefined, model, qty });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
              <SmartImage src={product.images[img]} alt={pick(product.name.ar, product.name.en)} priority />
              {off > 0 && <span className="bg-sodfa absolute start-4 top-4 rounded-full px-3 py-1 text-xs font-bold text-primary-foreground">{off}% {t("product.off")}</span>}
            </div>
            {product.images.length > 1 && <div className="mt-3 flex gap-3">{product.images.slice(0, 5).map((src, i) => <button type="button" key={`${src}-${i}`} onClick={() => setImg(i)} className={cn("w-20 overflow-hidden rounded-xl border", i === img ? "border-primary" : "border-border")}><SmartImage src={src} alt="" /></button>)}</div>}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-4xl">{pick(product.name.ar, product.name.en)}</h1>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-bold">{price(product.price)}</span>
              {product.oldPrice && <span className="text-sm text-subtle line-through">{price(product.oldPrice)}</span>}
              <span className="rounded-full border px-3 py-1 text-xs">{product.inStock ? t("product.inStock") : t("product.outStock")}</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{pick(product.description.ar, product.description.en)}</p>

            {product.colors.length > 0 && <div className="mt-7"><span className="text-xs tracking-widest text-subtle uppercase">{t("product.colors")}</span><div className="mt-3 flex flex-wrap gap-2">{product.colors.map((c) => <button type="button" key={`${c.name.en}-${c.hex}`} onClick={() => setColor(c)} className={cn("flex items-center gap-2 rounded-full border px-3 py-2 text-xs", color?.hex === c.hex ? "border-primary" : "border-border")}><span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.hex }} />{pick(c.name.ar, c.name.en)}</button>)}</div></div>}

            {product.models && product.models.length > 0 && <div className="mt-6"><span className="text-xs tracking-widest text-subtle uppercase">{t("product.model")}</span><div className="mt-3 flex flex-wrap gap-2">{product.models.map((m) => <button type="button" key={m} onClick={() => setModel(m)} className={cn("rounded-full border px-3 py-2 text-xs", model === m ? "border-primary" : "border-border")}>{m}</button>)}</div></div>}

            <div className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <div className="flex h-12 items-center gap-1 rounded-xl border border-border bg-input px-2"><button type="button" aria-label="-" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center"><Minus className="h-4 w-4" /></button><span className="w-8 text-center text-sm">{qty}</span><button type="button" aria-label="+" onClick={() => setQty((q) => q + 1)} className="grid h-8 w-8 place-items-center"><Plus className="h-4 w-4" /></button></div>
              <button type="button" onClick={onAdd} disabled={!product.inStock} className="bg-sodfa flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-primary-foreground disabled:opacity-40">{added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{added ? t("product.added") : t("product.addToCart")}</button>
            </div>

            <div className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2"><div className="flex items-start gap-3"><span className="bg-sodfa grid h-9 w-9 place-items-center rounded-full text-primary-foreground"><Truck className="h-4 w-4" /></span><span><span className="block text-sm font-medium">{t("feat.1.t")}</span><span className="block text-xs text-subtle">{t("feat.1.s")}</span></span></div><div className="flex items-start gap-3"><span className="bg-sodfa grid h-9 w-9 place-items-center rounded-full text-primary-foreground"><ShieldCheck className="h-4 w-4" /></span><span><span className="block text-sm font-medium">{t("hero.b2.t")}</span><span className="block text-xs text-subtle">{t("hero.b2.s")}</span></span></div></div>
            <Link to="/products" search={{ q: undefined, cat: product.category || undefined }} className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">{t("common.back")}</Link>
          </div>
        </div>
      </div>
      {related.length > 0 && <Section title={t("product.related")}><ProductGrid products={related} /></Section>}
    </>
  );
}
