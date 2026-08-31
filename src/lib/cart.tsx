import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/data/catalog";

export type CartLine = {
  key: string;
  productId: string;
  name: { ar: string; en: string };
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
  add: (p: Product, opts?: { color?: string; model?: string; qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sodfa-cart");
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sodfa-cart", JSON.stringify(lines));
  }, [lines]);

  const add = useCallback<Ctx["add"]>((p, opts = {}) => {
    const color = opts.color ?? p.colors[0]?.name;
    const model = opts.model ?? p.models?.[0];
    const key = [p.id, color, model].filter(Boolean).join("|");
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) {
        return prev.map((l) =>
          l.key === key ? { ...l, qty: l.qty + (opts.qty ?? 1) } : l,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: p.id,
          name: p.name,
          image: p.images[0],
          price: p.price,
          color,
          model,
          qty: opts.qty ?? 1,
        },
      ];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + l.qty * l.price, 0),
      add,
      setQty,
      remove,
    }),
    [lines, add, setQty, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
