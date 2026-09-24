import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, MessageCircle, RefreshCw, Send, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPage } from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/orders")({ component: OrdersAdmin });

const statuses = [
  ["pending", "تم الطلب"], ["processing", "جاري التجهيز"], ["shipped", "تم الشحن"], ["delivered", "تم التسليم"], ["cancelled", "ملغي"],
] as const;

function OrdersAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message); else { setError(""); setItems(data || []); }
  };
  useEffect(() => { void load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setBusy(id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) setError(error.message); else await load();
    setBusy(null);
  };

  const requestReview = async (order: any) => {
    setBusy(order.id);
    setError("");
    try {
      let token = "";
      const existing = await supabase.from("review_requests").select("token,expires_at,submitted_at").eq("order_id", order.id).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data?.token && !existing.data.submitted_at && new Date(existing.data.expires_at) > new Date()) token = existing.data.token;
      if (!token) {
        token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
        const { error } = await supabase.from("review_requests").upsert({ order_id: order.id, token, expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), submitted_at: null, customer_name: order.customer_name || "", customer_phone: order.customer_phone || "" }, { onConflict: "order_id" });
        if (error) throw error;
      }
      await supabase.from("orders").update({ review_requested_at: new Date().toISOString() }).eq("id", order.id);
      const base = window.location.origin;
      const url = `${base}/review/${token}`;
      const number = String(order.customer_phone || "").replace(/\D/g, "");
      if (!number) throw new Error("رقم العميل غير موجود في الطلب.");
      const message = `أهلاً ${order.customer_name || "بيك"} ❤️\n\nسعداء إن طلبك وصل بنجاح. نحب نعرف رأيك في تجربتك مع SODFA ⭐\n\nقيّم طلبك من هنا:\n${url}\n\nشكرًا لثقتك في صدفة ❤️`;
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      await load();
    } catch (e: any) { setError(e?.message || "تعذر تجهيز رابط التقييم."); }
    finally { setBusy(null); }
  };

  return <AdminGuard><AdminPage>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-extrabold">الطلبات</h1><p className="text-slate-400">إدارة حالة الطلبات وطلب تقييم العميل بعد التسليم.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm"><RefreshCw size={16}/>تحديث</button></div>
    {error && <div className="mb-4 rounded-xl bg-red-950/40 p-3 text-red-300">{error}</div>}
    <div className="grid gap-4">{items.length === 0 && !error ? <Card className="border-slate-800 bg-slate-900"><CardContent className="p-8 text-center text-slate-400">لا توجد طلبات حتى الآن.</CardContent></Card> : items.map((o) => {
      const delivered = o.status === "delivered";
      return <Card key={o.id} className="border-slate-800 bg-slate-900"><CardContent className="p-5">
        <div className="flex flex-wrap justify-between gap-3"><div><div className="font-bold">طلب #{String(o.id).slice(0, 8)}</div><div className="text-sm text-slate-400">{o.customer_name || "بدون اسم"} · {o.customer_phone || "بدون هاتف"}</div><div className="mt-1 text-xs text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleString("ar-EG") : ""}</div></div><div className="text-xl font-black">{o.total ?? 0} جنيه</div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-sm text-slate-300">حالة الطلب<select value={o.status || "pending"} disabled={busy === o.id} onChange={(e) => void updateStatus(o.id, e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"><option value="pending">تم الطلب</option><option value="processing">جاري التجهيز</option><option value="shipped">تم الشحن</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option></select></label>
          <div className="flex flex-wrap gap-2">{delivered && <button disabled={busy === o.id} onClick={() => void requestReview(o)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a64cc1] to-[#6e2d8b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><MessageCircle size={17}/>{busy === o.id ? "جاري التجهيز..." : o.review_requested_at ? "إعادة طلب التقييم" : "طلب تقييم على واتساب"}</button>}</div>
        </div>
        {o.address && <div className="mt-4 rounded-xl bg-slate-950/70 p-3 text-sm text-slate-300"><Truck size={15} className="mb-1 inline-block ml-2"/> {o.governorate || ""} — {o.address}</div>}
        {o.review_requested_at && <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300"><Check size={14}/> تم تجهيز طلب تقييم لهذا الطلب.</div>}
      </CardContent></Card>;
    })}</div>
  </AdminPage></AdminGuard>;
}
