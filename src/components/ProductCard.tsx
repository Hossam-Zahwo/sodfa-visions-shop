import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { SmartImage } from "./SmartImage";
import { useLang } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { discountPct, type Product } from "@/data/catalog";

export function ProductCard({ product }: { product: Product }) {
  const { t, pick, price } = useLang();
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const off = discountPct(product);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:bg-card-hover hover:shadow-card"
    >
      <div className="relative">
        <SmartImage
          src={product.images[0]}
          alt={pick(product.name.ar, product.name.en)}
          imgClassName="transition-transform duration-700 group-hover:scale-105"
        />
        {off > 0 && (
          <span className="bg-sodfa absolute start-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
            {off}% {t("product.off")}
          </span>
        )}
        {!product.inStock && (
          <span className="absolute end-3 top-3 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground">
            {t("product.outStock")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-sm font-medium sm:text-base">
          {pick(product.name.ar, product.name.en)}
        </h3>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-base font-semibold sm:text-lg">{price(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-subtle line-through">{price(product.oldPrice)}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {product.colors.slice(0, 5).map((c) => (
            <span
              key={c.hex}
              title={pick(c.name.ar, c.name.en)}
              className="h-3.5 w-3.5 rounded-full border border-border"
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        <button
          onClick={onAdd}
          disabled={!product.inStock}
          className="mt-auto flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-input text-sm font-medium transition-all hover:border-primary/50 hover:bg-card-hover disabled:opacity-40"
        >
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {added ? t("product.added") : t("product.addToCart")}
        </button>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
