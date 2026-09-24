import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Image as ImageIcon, RefreshCw, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPage } from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/reviews")({ component: ReviewsAdmin });

function ReviewsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    const { data, error } = await supabase.from("customer_reviews").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message); else { setError(""); setItems(data || []); }
  };
  useEffect(() => { void load(); }, []);
  const toggle = async (id: string, value: boolean) => {
    setBusy(id); const { error } = await supabase.from("customer_reviews").update({ is_visible: value }).eq("id", id);
    if (error) setError(error.message); else await load(); setBusy(null);
  };
  return <AdminGuard><AdminPage>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-extrabold">تقييمات العملاء</h1><p className="text-slate-400">التقييمات الجديدة تدخل مخفية، وأنت تقرر ما يظهر على الموقع.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm"><RefreshCw size={16}/>تحديث</button></div>
    {error && <div className="mb-4 rounded-xl bg-red-950/40 p-3 text-red-300">{error}</div>}
    <div className="grid gap-4">{items.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">لا توجد تقييمات حتى الآن.</div> : items.map((r) => <article key={r.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-purple-500/15 font-bold text-purple-300">{String(r.customer_name || "؟").slice(0,1)}</div><div><h2 className="font-bold">{r.customer_name}</h2><div className="mt-1 flex">{[1,2,3,4,5].map((n) => <Star key={n} size={15} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}/>)}</div><p className="mt-2 text-sm leading-7 text-slate-300">{r.review_text || "بدون تعليق"}</p></div></div><button disabled={busy === r.id} onClick={() => void toggle(r.id, !r.is_visible)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${r.is_visible ? "border border-slate-700" : "bg-gradient-to-r from-[#a64cc1] to-[#6e2d8b] text-white"}`}>{r.is_visible ? <><EyeOff size={16}/>إخفاء</> : <><Eye size={16}/>إظهار على الموقع</>}</button></div>
      {r.image_url && <a href={r.image_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs"><ImageIcon size={15}/>عرض صورة التقييم</a>}
      <div className="mt-3 text-[11px] text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleString("ar-EG") : ""} · الطلب #{String(r.order_id || "").slice(0,8)}</div>
    </article>)}</div>
  </AdminPage></AdminGuard>;
}
