import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { listStoreProducts, type StoreProduct } from "@/lib/db";

export type CartLine = {
  key: string;
  productId: string;
  sku?: string | null;
  barcode?: string | null;
  variantId?: string;
  name: { ar: string; en: string };
  variantName?: string;
  image: string;
  price: number;
  color?: string;
  model?: string;
  qty: number;
};

type Ctx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (p: StoreProduct, opts?: {
    color?: string; model?: string; qty?: number; variantId?: string;
    variantName?: string; image?: string; price?: number;
  }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    let alive = true;
    const hydrate = async () => {
      try {
        const raw = localStorage.getItem("sodfa-cart");
        if (!raw) return;
        const saved = JSON.parse(raw) as CartLine[];
        if (!Array.isArray(saved)) return;
        if (alive) setLines(saved);

        // Refresh prices/codes from Supabase so an old cart line cannot keep
        // showing a stale 0 price after the product price was changed.
        try {
          const products = await listStoreProducts();
          if (!alive) return;
          const byProduct = new Map(products.map((p) => [p.id, p]));
          const refreshed = saved.map((line) => {
            const product = byProduct.get(line.productId);
            if (!product) return line;
            const variant = product.variants.find((v) => v.id === line.variantId);
            const currentPrice = variant?.price ?? product.price;
            return {
              ...line,
              price: Number(currentPrice) > 0 ? Number(currentPrice) : line.price,
              sku: variant?.sku ?? product.sku ?? line.sku,
              barcode: variant?.barcode ?? product.barcode ?? line.barcode,
              image: variant?.primaryImage ?? product.images[0] ?? line.image,
            };
          });
          setLines(refreshed);
        } catch {
          // Keep the locally saved cart if the database is temporarily unavailable.
        }
      } catch {
        /* ignore malformed local cart */
      }
    };
    void hydrate();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem("sodfa-cart", JSON.stringify(lines));
  }, [lines]);

  const add = useCallback<Ctx["add"]>((p, opts = {}) => {
    const color = opts.color ?? p.colors[0]?.name.ar;
    const model = opts.model ?? p.models?.[0];
    const variant = p.variants.find((v) => v.id === opts.variantId);
    const image = opts.image ?? variant?.primaryImage ?? p.images[0];
    const price = opts.price ?? variant?.price ?? p.price;
    const key = [p.id, opts.variantId, color, model].filter(Boolean).join("|");

    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) {
        return prev.map((l) => l.key === key ? {
          ...l,
          qty: l.qty + (opts.qty ?? 1),
          price,
          sku: variant?.sku ?? p.sku,
          barcode: variant?.barcode ?? p.barcode,
          image,
          variantName: opts.variantName ?? variant?.name ?? l.variantName,
        } : l);
      }
      return [...prev, {
        key,
        productId: p.id,
        variantId: opts.variantId,
        sku: variant?.sku ?? p.sku,
        barcode: variant?.barcode ?? p.barcode,
        name: p.name,
        variantName: opts.variantName ?? variant?.name,
        image,
        price,
        color,
        model,
        qty: opts.qty ?? 1,
      }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) => qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => l.key === key ? { ...l, qty } : l));
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);

  const value = useMemo<Ctx>(() => ({
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.qty * l.price, 0),
    add, setQty, remove,
  }), [lines, add, setQty, remove]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
