import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Check, ShoppingBag, Zap, Smartphone, SlidersHorizontal } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { StoreProduct } from "@/lib/db";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

type Need = "phone" | "charging" | "car" | "audio" | "gift" | null;

const intents: Array<{ id: Exclude<Need, null>; label: string; keywords: RegExp }> = [
  { id: "phone", label: "جراب / حماية", keywords: /case|جراب|كفر|protect|حما/i },
  { id: "charging", label: "شحن وكابلات", keywords: /charger|شاحن|cable|كابل|power|باور|شحن/i },
  { id: "car", label: "إكسسوارات السيارة", keywords: /car|سيارة|سياره|mount|حامل/i },
  { id: "audio", label: "سماعات وصوتيات", keywords: /audio|سماعة|سماعات|buds|ear|head/i },
  { id: "gift", label: "عايز هدية", keywords: /gift|هدية|هديه/i },
];

function scoreProduct(product: StoreProduct, need: Need, details: string, phone: string, budget: string) {
  const text = `${product.name.ar} ${product.name.en} ${product.description.ar} ${product.description.en} ${product.category} ${product.models?.join(" ")} ${product.tags.join(" ")}`;
  let score = 0;
  if (need && intents.find((x) => x.id === need)?.keywords.test(text)) score += 7;
  if (details) {
    for (const word of details.toLowerCase().split(/\s+/).filter((x) => x.length > 2)) {
      if (text.toLowerCase().includes(word)) score += 1.5;
    }
  }
  if (phone && text.toLowerCase().includes(phone.toLowerCase())) score += 6;
  if (budget === "under300" && product.price <= 300) score += 4;
  if (budget === "300to700" && product.price >= 300 && product.price <= 700) score += 4;
  if (budget === "over700" && product.price > 700) score += 4;
  if (product.ratingCount > 0) score += Math.min(product.ratingAverage, 5);
  if (product.tags.includes("best")) score += 2;
  if (product.tags.includes("featured")) score += 1;
  if (product.inStock) score += 2;
  return score;
}

export function CustomerShoppingAssistant({ products }: { products: StoreProduct[] }) {
  const [open, setOpen] = useState(false);
  const [need, setNeed] = useState<Need>(null);
  const [details, setDetails] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const { add } = useCart();

  const recommendations = useMemo(() => {
    if (!need && !details.trim() && !phone.trim() && !budget) return [];
    return [...products]
      .filter((p) => p.inStock)
      .sort((a, b) => scoreProduct(b, need, details, phone, budget) - scoreProduct(a, need, details, phone, budget))
      .slice(0, 3);
  }, [products, need, details, phone, budget]);

  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-card sm:p-8">
        <div className="pointer-events-none absolute -end-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-primary-light">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10"><Sparkles size={18} /></span>
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase">SODFA SMART ASSIST</span>
            </div>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">مش عارف تختار؟ احكي لنا إنت محتاج إيه وإحنا نضيّقها عليك.</h2>
            <p className="mt-2 text-sm leading-7 text-subtle">اكتب لنا الموبايل، استخدامك، الشكل اللي بتحبه، ميزانيتك، وأي تفصيلة تهمك. كل معلومة زيادة بتخلّي الترشيحات أقرب للي في دماغك — والمساعدة اختيارية بالكامل.</p>
          </div>

          <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-6 text-sm font-bold text-primary-light transition hover:bg-primary/15">
            <Zap size={16} /> {open ? "إخفاء المساعدة" : "ساعدني أختار"} {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {open && (
          <div className="relative mt-7 border-t border-border pt-7">
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold"><SlidersHorizontal size={15} /> إيه اللي بتدور عليه؟</label>
                <div className="flex flex-wrap gap-2">
                  {intents.map((item) => (
                    <button key={item.id} type="button" onClick={() => setNeed(item.id)} className={cn("rounded-full border px-4 py-2.5 text-xs font-semibold transition-all", need === item.id ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground")}>{item.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold"><Smartphone size={15} /> نوع تليفونك (اختياري)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="مثال: iPhone 15 Pro Max أو Samsung A55" className="h-11 w-full rounded-xl border border-border bg-background/70 px-4 text-sm outline-none transition focus:border-primary" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">ميزانيتك التقريبية</label>
                <select value={budget} onChange={(e) => setBudget(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background/70 px-4 text-sm outline-none transition focus:border-primary">
                  <option value="">مش مهم / خلّيك إنت اختار</option>
                  <option value="under300">لحد 300 ج.م</option>
                  <option value="300to700">من 300 لـ 700 ج.م</option>
                  <option value="over700">أكتر من 700 ج.م</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-bold">قول لنا تفاصيل أكتر <span className="font-normal text-subtle">(كل ما تكتب أكتر، الترشيح يبقى أدق)</span></label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {["عايز حاجة تحمي الموبايل من الوقوع", "عايز شكل شيك وخفيف", "عايز أفضل حاجة في حدود ميزانيتي"].map((hint) => (
                    <button key={hint} type="button" onClick={() => setDetails((current) => current ? `${current}، ${hint}` : hint)} className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-[11px] text-subtle transition hover:border-primary/40 hover:text-foreground">{hint}</button>
                  ))}
                </div>
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={5} placeholder="مثلاً: معايا iPhone 15 Pro Max، استخدامي يومي وفيه حركة كتير، عايز جراب شكله شيك ويفضل أسود، يحمي من الوقوع من غير ما يبقى تقيل، وميزانيتي حوالي 500 جنيه..." className="w-full resize-none rounded-xl border border-border bg-background/70 px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary" />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/35 p-4 text-xs leading-6 text-subtle">
              <Check size={15} className="me-1 inline text-primary-light" /> المساعد بيقرأ التفاصيل اللي كتبتها ويقارنها بالمنتجات والموديلات والتصنيفات الموجودة في كتالوج صدفة، ثم يعرض لك أقرب الاختيارات المتاحة.
            </div>

            {(need || details.trim() || phone.trim() || budget) && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {recommendations.map((product) => (
                  <div key={product.id} className="group rounded-2xl border border-border bg-background/70 p-3 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                    <Link to="/product/$slug" params={{ slug: product.slug }} className="flex gap-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white"><img src={product.images[0] || "/placeholder.svg"} alt="" className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105" /></div>
                      <div className="min-w-0"><div className="line-clamp-2 text-sm font-semibold">{product.name.ar || product.name.en}</div><div className="mt-1 text-xs text-subtle">{product.ratingCount ? `★ ${product.ratingAverage.toFixed(1)} · ${product.ratingCount} تقييم` : "اختيار متاح حاليًا"}</div><div className="mt-2 text-sm font-bold">{product.price.toLocaleString("ar-EG")} ج.م</div></div>
                    </Link>
                    <button type="button" onClick={() => add(product)} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-sodfa text-xs font-semibold text-primary-foreground"><ShoppingBag size={14} /> أضف للسلة</button>
                  </div>
                ))}
              </div>
            )}

            {!need && !details.trim() && !phone.trim() && !budget && <div className="mt-5 rounded-2xl border border-primary/10 bg-primary/5 p-4 text-xs text-subtle">ابدأ باختيار احتياجك، ولو عندك تفاصيل عن الموبايل أو الشكل أو الميزانية اكتبها — ده يساعدنا نضيّق الاختيارات عليك.</div>}
          </div>
        )}
      </div>
    </section>
  );
}
