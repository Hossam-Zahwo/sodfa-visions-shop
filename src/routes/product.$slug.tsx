import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, ShieldCheck, Truck, Layers3 } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { ProductCard, ProductGrid } from "@/components/ProductCard";
import { Section } from "@/components/Section";
import { useLang } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { getStoreProduct, listStoreProducts, type StoreVariant } from "@/lib/db";
import { cn } from "@/lib/utils";

type Search = { variant?: string };

export const Route = createFileRoute("/product/$slug")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    variant: typeof search.variant === "string" && search.variant ? search.variant : undefined,
  }),
  loader: async ({ params }) => {
    const product = await getStoreProduct(params.slug);
    if (!product) throw notFound();
    const all = await listStoreProducts();
    return {
      product,
      related: all.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4),
    };
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
  const { variant: variantParam } = Route.useSearch();
  const { t, pick, price } = useLang();
  const { add } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(variantParam);
  const selectedVariant = useMemo(
    () => product.variants.find((v) => v.id === selectedVariantId),
    [product.variants, selectedVariantId],
  );
  const [img, setImg] = useState(0);
  const [paused, setPaused] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => setSelectedVariantId(variantParam), [variantParam]);

  const gallery = useMemo(() => {
    // Parent product and each variant have completely independent galleries.
    // Selecting a variant must never pull images from the parent or another variant.
    const sources = selectedVariant ? selectedVariant.images : product.images;
    return [...new Set(sources)].filter(Boolean);
  }, [product.images, selectedVariant]);

  useEffect(() => setImg(0), [selectedVariantId]);

  useEffect(() => {
    if (paused || gallery.length < 2) return;
    const id = window.setInterval(() => setImg((i) => (i + 1) % gallery.length), 4200);
    return () => window.clearInterval(id);
  }, [gallery.length, paused]);

  const activePrice = selectedVariant?.price ?? product.price;
  const activeOldPrice = selectedVariant?.oldPrice ?? product.oldPrice;
  const activeInStock = selectedVariant?.inStock ?? product.inStock;
  const off = activeOldPrice && activeOldPrice > activePrice ? Math.round((1 - activePrice / activeOldPrice) * 100) : 0;

  const onAdd = () => {
    add(product, {
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      color: selectedVariant?.color,
      image: selectedVariant?.primaryImage || gallery[0],
      price: activePrice,
      qty,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const chooseVariant = (variant: StoreVariant) => {
    setSelectedVariantId(variant.id);
    setImg(0);
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="min-w-0"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
              <SmartImage src={gallery[img] || "/placeholder.svg"} alt={pick(product.name.ar, product.name.en)} priority ratio="square" />
              {off > 0 && <span className="bg-sodfa absolute start-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-bold text-primary-foreground">{off}% {t("product.off")}</span>}
              {gallery.length > 1 && <>
                <button type="button" aria-label="previous" onClick={() => setImg((i) => (i - 1 + gallery.length) % gallery.length)} className="absolute start-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/70 backdrop-blur"><ChevronLeft size={18}/></button>
                <button type="button" aria-label="next" onClick={() => setImg((i) => (i + 1) % gallery.length)} className="absolute end-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/70 backdrop-blur"><ChevronRight size={18}/></button>
                <div className="absolute bottom-3 start-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-background/60 px-2 py-1 backdrop-blur">{gallery.map((_, i) => <button key={i} type="button" aria-label={`image ${i + 1}`} onClick={() => setImg(i)} className={cn("h-1.5 rounded-full transition-all", i === img ? "w-7 bg-white" : "w-2 bg-white/45")}/>)}</div>
              </>}
            </div>
            {gallery.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2">{gallery.slice(0, 10).map((src, i) => <button type="button" key={`${src}-${i}`} onClick={() => setImg(i)} className={cn("overflow-hidden rounded-xl border", i === img ? "border-primary ring-2 ring-primary/20" : "border-border")}><SmartImage src={src} alt="" ratio="square"/></button>)}</div>}
            <p className="mt-2 text-center text-[11px] text-subtle">السلايدر يتحرك تلقائيًا ويتوقف عند تثبيت المؤشر عليه.</p>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {selectedVariant && <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] text-primary-light"><Layers3 size={12}/> {selectedVariant.name}</span>}
              <span className="rounded-full border border-border px-3 py-1 text-[11px] text-subtle">{product.category || "SODFA"}</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold sm:text-4xl">{selectedVariant?.name || pick(product.name.ar, product.name.en)}</h1>
            {selectedVariant && <p className="mt-2 text-sm text-subtle">{pick(product.name.ar, product.name.en)} — نسخة/تفريعة من المنتج الرئيسي</p>}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-subtle">
              {(selectedVariant?.sku || product.sku) && <span>SKU: {selectedVariant?.sku || product.sku}</span>}
              {(selectedVariant?.barcode || product.barcode) && <span>باركود: {selectedVariant?.barcode || product.barcode}</span>}
            </div>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-bold">{price(activePrice)}</span>
              {activeOldPrice && <span className="text-sm text-subtle line-through">{price(activeOldPrice)}</span>}
              <span className="rounded-full border px-3 py-1 text-xs">{activeInStock ? t("product.inStock") : t("product.outStock")}</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{pick(product.description.ar, product.description.en)}</p>

            {product.variants.length > 0 && (
              <div className="mt-7">
                <div className="flex items-center justify-between"><span className="text-xs tracking-widest text-subtle uppercase">اختيارات المنتج</span><span className="text-[11px] text-subtle">{product.variants.length} اختيار</span></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => setSelectedVariantId(undefined)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-start", !selectedVariant ? "border-primary bg-primary/10" : "border-border")}>
                    <SmartImage src={product.images[0] || "/placeholder.svg"} alt="" className="h-12 w-12 shrink-0 rounded-lg" ratio="square"/><span><span className="block text-sm font-semibold">{pick(product.name.ar, product.name.en)}</span><span className="text-xs text-subtle">{price(product.price)}</span></span>
                  </button>
                  {product.variants.map((v) => <button type="button" key={v.id} onClick={() => chooseVariant(v)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-start", selectedVariant?.id === v.id ? "border-primary bg-primary/10" : "border-border")}>
                    <SmartImage src={v.primaryImage} alt="" className="h-12 w-12 shrink-0 rounded-lg" ratio="square"/><span className="min-w-0"><span className="block truncate text-sm font-semibold">{v.name}</span><span className="text-xs text-subtle">{price(v.price)}</span></span>
                  </button>)}
                </div>
              </div>
            )}

            {product.colors.length > 0 && !selectedVariant && <div className="mt-7"><span className="text-xs tracking-widest text-subtle uppercase">{t("product.colors")}</span><div className="mt-3 flex flex-wrap gap-2">{product.colors.map((c) => <span key={`${c.name.en}-${c.hex}`} className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs"><span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.hex }}/>{pick(c.name.ar, c.name.en)}</span>)}</div></div>}

            <div className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <div className="flex h-12 items-center gap-1 rounded-xl border border-border bg-input px-2"><button type="button" aria-label="-" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center"><Minus className="h-4 w-4"/></button><span className="w-8 text-center text-sm">{qty}</span><button type="button" aria-label="+" onClick={() => setQty((q) => q + 1)} className="grid h-8 w-8 place-items-center"><Plus className="h-4 w-4"/></button></div>
              <button type="button" onClick={onAdd} disabled={!activeInStock} className="bg-sodfa flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-primary-foreground disabled:opacity-40">{added ? <Check className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}{added ? t("product.added") : t("product.addToCart")}</button>
            </div>

            <div className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2"><div className="flex items-start gap-3"><span className="bg-sodfa grid h-9 w-9 place-items-center rounded-full text-primary-foreground"><Truck className="h-4 w-4"/></span><span><span className="block text-sm font-medium">{t("feat.1.t")}</span><span className="block text-xs text-subtle">{t("feat.1.s")}</span></span></div><div className="flex items-start gap-3"><span className="bg-sodfa grid h-9 w-9 place-items-center rounded-full text-primary-foreground"><ShieldCheck className="h-4 w-4"/></span><span><span className="block text-sm font-medium">{t("hero.b2.t")}</span><span className="block text-xs text-subtle">{t("hero.b2.s")}</span></span></div></div>
            <Link to="/products" search={{ q: undefined, cat: undefined }} className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">{t("common.back")}</Link>
          </div>
        </div>
      </div>
      {product.variants.length > 0 && <Section title="تفريعات المنتج"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{product.variants.map((v) => <ProductCard key={v.id} product={product} variant={v}/>)}</div></Section>}
      {related.length > 0 && <Section title={t("product.related")}><ProductGrid products={related}/></Section>}
    </>
  );
}
