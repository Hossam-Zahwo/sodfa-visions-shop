import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, MapPin, Phone, User, MessageCircle, X, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { createStoreOrder, listShippingRates, type ShippingRate } from "@/lib/db";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "السلة | SODFA صدفة" }] }),
  component: CartPage,
});

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الدقهلية", "البحيرة", "الشرقية", "الغربية",
  "المنوفية", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "الفيوم", "بني سويف",
  "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "مطروح", "الوادي الجديد", "شمال سيناء", "جنوب سيناء",
];

function CartPage() {
  const { t, price } = useLang();
  const { lines, count, subtotal, setQty, remove } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);

  useEffect(() => {
    listShippingRates().then(setShippingRates).catch((error) => console.error("Shipping rates failed:", error));
  }, []);

  const shipping = shippingRates.find((rate) => rate.governorate === governorate)?.price ?? 0;
  const total = subtotal + shipping;

  const submitWhatsAppOrder = async () => {
    setError("");
    if (!lines.length) return setError("السلة فارغة.");
    if (!name.trim() || !phone.trim() || !governorate || !address.trim()) {
      setError("من فضلك اكتب الاسم ورقم الموبايل والمحافظة والعنوان بالتفصيل.");
      return;
    }

    const whatsappNumber = String(import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(/\D/g, "");
    if (!whatsappNumber) {
      setError("رقم واتساب المتجر غير مُضاف في إعدادات المشروع بعد. أضف VITE_WHATSAPP_NUMBER ثم جرّب مرة أخرى.");
      return;
    }

    try {
      const order = await createStoreOrder({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        governorate,
        address: address.trim(),
        notes: notes.trim() || null,
        items: lines.map((line) => ({ productId: line.productId, variantId: line.variantId ?? null, name: line.name.ar, variantName: line.variantName ?? null, qty: line.qty, price: line.price, image: line.image })),
        subtotal,
        shipping,
        total,
        status: "pending",
      });

      const items = lines.map((line, i) => {
        const variant = line.variantName ? ` — ${line.variantName}` : "";
        return `${i + 1}. ${line.name.ar}${variant} | الكمية: ${line.qty} | السعر: ${price(line.price)}`;
      }).join("\n");

      const message = [
        "طلب جديد من SODFA صدفة",
        `رقم الطلب: #${String(order.id).slice(0, 8)}`,
        "",
        `الاسم: ${name.trim()}`,
        `الموبايل: ${phone.trim()}`,
        `المحافظة: ${governorate}`,
        `العنوان: ${address.trim()}`,
        notes.trim() ? `ملاحظات: ${notes.trim()}` : "",
        "",
        "المنتجات:",
        items,
        "",
        `عدد القطع: ${count}`,
        `المجموع: ${price(subtotal)}`,
        `الشحن: ${price(shipping)}`,
        `الإجمالي النهائي: ${price(total)}`,
      ].filter(Boolean).join("\n");

      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || "تعذر حفظ الطلب. تأكد من تشغيل SQL الخاص بـ SODFA ثم حاول مرة أخرى.");
    }
  };

  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
    <h1 className="text-2xl font-bold sm:text-4xl">{t("cart.title")}</h1>
    {!lines.length ? <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center"><p className="text-sm text-subtle">{t("cart.empty")}</p><Link to="/products" className="bg-sodfa mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground">{t("cart.continue")}</Link></div> : <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">{lines.map((line) => <div key={line.key} className="flex gap-4 rounded-2xl border border-border bg-card p-4"><img src={line.image} alt="" className="h-24 w-24 rounded-xl object-contain bg-white"/><div className="min-w-0 flex-1"><h2 className="font-semibold">{line.name.ar}</h2>{line.variantName && <p className="mt-1 text-xs font-semibold text-primary-light">{line.variantName}</p>}<p className="mt-1 text-sm text-subtle">{price(line.price)} {line.color ? `· ${line.color}` : ""} {line.model ? `· ${line.model}` : ""}</p>
<p className="mt-1 text-[11px] text-subtle">{line.sku ? `SKU: ${line.sku}` : ""}{line.sku && line.barcode ? " · " : ""}{line.barcode ? `باركود: ${line.barcode}` : ""}</p><div className="mt-4 flex items-center gap-2"><button type="button" onClick={() => setQty(line.key, line.qty - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><Minus size={14}/></button><span className="w-8 text-center text-sm">{line.qty}</span><button type="button" onClick={() => setQty(line.key, line.qty + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><Plus size={14}/></button></div></div><button type="button" onClick={() => remove(line.key)} aria-label={t("cart.remove")} className="self-start text-subtle hover:text-red-500"><Trash2 size={18}/></button></div>)}</div>
      <aside className="h-fit rounded-2xl border border-border bg-card p-5"><div className="flex justify-between text-sm"><span>{t("cart.items")}</span><span>{count}</span></div><div className="mt-4 flex justify-between text-sm"><span>{t("cart.subtotal")}</span><strong>{price(subtotal)}</strong></div><div className="mt-4 flex flex-col gap-2 text-sm"><label className="font-semibold">المحافظة</label><select value={governorate} onChange={(e) => setGovernorate(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-input px-3 outline-none focus:border-primary"><option value="">اختار المحافظة</option>{GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}</select><div className="flex justify-between"><span>{t("cart.shipping")}</span><span className="font-semibold text-primary-light">{price(shipping)}</span></div><span className="text-[11px] text-subtle">اختار المحافظة عشان يتم حساب الشحن تلقائيًا وإضافته للإجمالي.</span></div><div className="mt-5 border-t border-border pt-5"><div className="flex justify-between font-bold"><span>{t("cart.total")}</span><span>{price(total)}</span></div><button type="button" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-light via-primary to-primary-dark py-3.5 text-sm font-bold text-white shadow-[0_12px_35px_-12px_rgba(192,107,207,.75)] transition hover:-translate-y-0.5 hover:brightness-110" onClick={() => { setError(""); setSubmitted(false); setCheckoutOpen(true); }}><MessageCircle size={18}/>{t("cart.whatsapp")}</button></div></aside>
    </div>}

    {checkoutOpen && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[94svh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-card p-5 shadow-2xl sm:max-h-[92vh] sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold sm:text-2xl">بيانات التوصيل</h2><p className="mt-1 text-sm leading-7 text-subtle">اكتب بياناتك، وإحنا نبعت تفاصيل الطلب على واتساب مباشرة.</p></div><button type="button" onClick={() => setCheckoutOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-subtle hover:text-foreground" aria-label="إغلاق"><X size={18}/></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm sm:col-span-2"><span className="flex items-center gap-2 font-semibold"><User size={15}/> الاسم بالكامل *</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أحمد محمد" className="h-12 w-full rounded-xl border border-border bg-input px-4 outline-none focus:border-primary"/></label>
          <label className="space-y-2 text-sm"><span className="flex items-center gap-2 font-semibold"><Phone size={15}/> رقم الموبايل *</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="01xxxxxxxxx" className="h-12 w-full rounded-xl border border-border bg-input px-4 outline-none focus:border-primary"/></label>
          <label className="space-y-2 text-sm"><span className="font-semibold">المحافظة *</span><select value={governorate} onChange={(e) => setGovernorate(e.target.value)} className="h-12 w-full rounded-xl border border-border bg-input px-4 outline-none focus:border-primary"><option value="">اختار المحافظة</option>{GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
          <label className="space-y-2 text-sm sm:col-span-2"><span className="flex items-center gap-2 font-semibold"><MapPin size={15}/> العنوان بالتفصيل *</span><textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="المنطقة، الشارع، رقم العمارة، الدور، الشقة وأي علامة مميزة" className="w-full resize-none rounded-xl border border-border bg-input p-4 outline-none focus:border-primary"/></label>
          <label className="space-y-2 text-sm sm:col-span-2"><span className="font-semibold">ملاحظات للطلب (اختياري)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="مثلاً: اتصل بيا قبل التوصيل" className="w-full resize-none rounded-xl border border-border bg-input p-4 outline-none focus:border-primary"/></label>
        </div>
        {error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-200">{error}</div>}
        <div className="mt-6 rounded-2xl border border-border bg-background/50 p-4 text-sm"><div className="flex justify-between"><span>المنتجات</span><strong>{price(subtotal)}</strong></div><div className="mt-2 flex justify-between"><span>الشحن</span><span className="font-semibold text-primary-light">{price(shipping)}</span></div><div className="mt-2 flex justify-between border-t border-border pt-2 font-bold"><span>الإجمالي</span><span>{price(total)}</span></div><p className="mt-3 text-xs leading-5 text-subtle">بعد الضغط، هيتفتح واتساب برسالة جاهزة فيها كل تفاصيل طلبك، والشحن محسوب تلقائيًا حسب المحافظة المختارة.</p></div>
        {!submitted ? <button type="button" onClick={() => void submitWhatsAppOrder()} className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-light via-primary to-primary-dark text-sm font-bold text-white shadow-[0_16px_40px_-16px_rgba(192,107,207,.8)] transition hover:-translate-y-0.5 hover:brightness-110"><MessageCircle size={19}/> تأكيد الطلب وإرساله على واتساب</button> : <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-emerald-400"/><h3 className="mt-3 text-lg font-bold">تم تجهيز الطلب</h3><p className="mt-1 text-sm leading-6 text-subtle">تم فتح واتساب بالرسالة الجاهزة. اضغط إرسال داخل واتساب لإتمام الإرسال.</p><button type="button" onClick={() => setCheckoutOpen(false)} className="mt-4 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-white/5">إغلاق</button></div>}
      </div>
    </div>}
  </div>;
}
