import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "السلة | SODFA صدفة" }] }),
  component: CartPage,
});

function CartPage() {
  const { t, price } = useLang();
  const { lines, count, subtotal, setQty, remove } = useCart();

  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
    <h1 className="text-2xl font-bold sm:text-4xl">{t("cart.title")}</h1>
    {!lines.length ? <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center"><p className="text-sm text-subtle">{t("cart.empty")}</p><Link to="/products" className="bg-sodfa mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground">{t("cart.continue")}</Link></div> : <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">{lines.map((line) => <div key={line.key} className="flex gap-4 rounded-2xl border border-border bg-card p-4"><img src={line.image} alt="" className="h-24 w-24 rounded-xl object-cover"/><div className="min-w-0 flex-1"><h2 className="font-semibold">{line.name.ar}</h2><p className="mt-1 text-sm text-subtle">{price(line.price)} {line.color ? `· ${line.color}` : ""} {line.model ? `· ${line.model}` : ""}</p><div className="mt-4 flex items-center gap-2"><button type="button" onClick={() => setQty(line.key, line.qty - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><Minus size={14}/></button><span className="w-8 text-center text-sm">{line.qty}</span><button type="button" onClick={() => setQty(line.key, line.qty + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><Plus size={14}/></button></div></div><button type="button" onClick={() => remove(line.key)} aria-label={t("cart.remove")} className="self-start text-subtle hover:text-red-500"><Trash2 size={18}/></button></div>)}</div>
      <aside className="h-fit rounded-2xl border border-border bg-card p-5"><div className="flex justify-between text-sm"><span>{t("cart.items")}</span><span>{count}</span></div><div className="mt-4 flex justify-between text-sm"><span>{t("cart.subtotal")}</span><strong>{price(subtotal)}</strong></div><div className="mt-4 flex justify-between text-sm"><span>{t("cart.shipping")}</span><span>{t("cart.free")}</span></div><div className="mt-5 border-t border-border pt-5"><div className="flex justify-between font-bold"><span>{t("cart.total")}</span><span>{price(subtotal)}</span></div><button type="button" className="bg-sodfa mt-5 w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground" onClick={() => alert(t("cart.soon"))}>{t("cart.checkout")}</button></div></aside>
    </div>}
  </div>;
}
