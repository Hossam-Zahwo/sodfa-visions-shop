import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { SmartImage } from "./SmartImage";
import { useLang } from "@/lib/i18n";
import type { StoreProduct } from "@/lib/db";
import { cn } from "@/lib/utils";

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function HomeProductShowcase({ products }: { products: StoreProduct[] }) {
  const { dir } = useLang();
  const [cards, setCards] = useState<StoreProduct[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setCards(shuffle(products).slice(0, Math.min(12, products.length)));
    setPage(0);
  }, [products]);

  const pageSize = 4;
  const pages = Math.max(1, Math.ceil(cards.length / pageSize));

  useEffect(() => {
    if (pages <= 1) return;
    const id = window.setInterval(() => setPage((p) => (p + 1) % pages), 5200);
    return () => window.clearInterval(id);
  }, [pages]);

  if (!products.length) return null;
  const visible = cards.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <section className="sodfa-product-showcase-card w-full px-0 pb-8 sm:pb-10">
      <div className="w-full overflow-hidden border-y border-border bg-card/70 px-4 py-5 shadow-card backdrop-blur sm:px-6 sm:py-7 lg:px-8">
        <div className="mb-5 flex items-center justify-end gap-2 sm:mb-6 sm:gap-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((p) => (p - 1 + pages) % pages)} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-input hover:border-primary/50" aria-label="السابق">
              {dir === "rtl" ? <ArrowRight size={15}/> : <ArrowLeft size={15}/>}
            </button>
            <button type="button" onClick={() => setPage((p) => (p + 1) % pages)} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-input hover:border-primary/50" aria-label="التالي">
              {dir === "rtl" ? <ArrowLeft size={15}/> : <ArrowRight size={15}/>}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5 lg:gap-6">
          {visible.map((p) => <ProductCard key={p.id} product={p} imageRatio="portrait" imageFit="contain" />)}
        </div>
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => <button key={i} type="button" onClick={() => setPage(i)} aria-label={`مجموعة ${i + 1}`} className={cn("h-1.5 rounded-full transition-all", i === page ? "w-8 bg-primary" : "w-2 bg-border hover:bg-primary/40")} />)}
        </div>
      </div>
    </section>
  );
}

export function HomeProductImageSlider({ products }: { products: StoreProduct[] }) {
  const images = useMemo(() => {
    const urls = products.flatMap((p) => p.images.map((src) => ({ src, name: p.name.ar || p.name.en })));
    return urls.filter((x, i, a) => a.findIndex((y) => y.src === x.src) === i).slice(0, 24);
  }, [products]);

  if (images.length < 2) return null;

  const marqueeItems = [...images, ...images];
  return (
    <section className="w-full overflow-hidden border-y border-border/60 bg-card/30 py-3 sm:py-5" aria-label="صور المنتجات">
      <div className="sodfa-image-marquee">
        <div className="sodfa-image-marquee-track">
          {marqueeItems.map((item, i) => (
            <div key={`${item.src}-${i}`} className="sodfa-image-marquee-item">
              <div className="group flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-background/70 ring-1 ring-border/60 sm:h-40 sm:w-40 lg:h-48 lg:w-48">
                <SmartImage
                  src={item.src}
                  alt={item.name}
                  ratio="square"
                  className="h-full w-full bg-transparent"
                  imgClassName="mx-auto h-full w-full object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-[1.04] sm:p-5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
