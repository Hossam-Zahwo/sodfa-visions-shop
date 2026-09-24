import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Tags, ShoppingCart, RefreshCw, Plus, Trash2, Pencil, Upload, Star } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPage } from "@/components/AdminShell";
import { dashboardStats, type CustomerReview, type ShippingRate } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الدقهلية", "البحيرة", "الشرقية", "الغربية",
  "المنوفية", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "الفيوم", "بني سويف",
  "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "مطروح", "الوادي الجديد", "شمال سيناء", "جنوب سيناء",
];

function Dashboard() {
  const [stats, setStats] = useState({ products: 0, categories: 0, orders: 0 });
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRate, setSavingRate] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ id: "", customer_name: "", customer_image_url: "", rating: "5", review_text: "", is_visible: "true", display_order: "0" });
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [{ data: shippingData, error: shippingError }, { data: reviewData, error: reviewError }, dashboard] = await Promise.all([
        supabase.from("shipping_rates").select("id,governorate,price,is_active").order("governorate"),
        supabase.from("customer_reviews").select("id,customer_name,customer_image_url,rating,review_text,is_visible,display_order,created_at,updated_at").order("display_order").order("created_at", { ascending: false }),
        dashboardStats(),
      ]);
      if (shippingError) throw shippingError;
      if (reviewError) throw reviewError;
      setRates((shippingData ?? []).map((r: any) => ({ ...r, price: Number(r.price ?? 0), is_active: Boolean(r.is_active) })));
      setReviews((reviewData ?? []) as CustomerReview[]);
      setStats(dashboard);
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر تحميل بيانات لوحة التحكم"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const saveShipping = async (rate: ShippingRate) => {
    setSavingRate(rate.id); setError("");
    const { error } = await supabase.from("shipping_rates").update({ price: Number(rate.price), is_active: rate.is_active }).eq("id", rate.id);
    if (error) setError(error.message);
    setSavingRate(null);
  };

  const saveReview = async (event: React.FormEvent) => {
    event.preventDefault(); setReviewSaving(true); setError("");
    try {
      if (!reviewForm.customer_name.trim()) throw new Error("اسم العميل مطلوب.");
      let imageUrl = reviewForm.customer_image_url.trim() || null;
      if (reviewImage) {
        const safe = reviewImage.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
        const path = `${crypto.randomUUID()}-${safe}`;
        const upload = await supabase.storage.from("customer-reviews").upload(path, reviewImage, { upsert: false, contentType: reviewImage.type });
        if (upload.error) throw upload.error;
        imageUrl = supabase.storage.from("customer-reviews").getPublicUrl(path).data.publicUrl;
      }
      const payload = {
        customer_name: reviewForm.customer_name.trim(), customer_image_url: imageUrl,
        rating: Number(reviewForm.rating), review_text: reviewForm.review_text.trim() || null,
        is_visible: reviewForm.is_visible === "true", display_order: Number(reviewForm.display_order || 0),
      };
      const result = reviewForm.id
        ? await supabase.from("customer_reviews").update(payload).eq("id", reviewForm.id)
        : await supabase.from("customer_reviews").insert(payload);
      if (result.error) throw result.error;
      resetReview(); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر حفظ التقييم"); }
    finally { setReviewSaving(false); }
  };

  const resetReview = () => { setReviewForm({ id: "", customer_name: "", customer_image_url: "", rating: "5", review_text: "", is_visible: "true", display_order: "0" }); setReviewImage(null); };
  const editReview = (r: CustomerReview) => setReviewForm({ id: r.id, customer_name: r.customer_name, customer_image_url: r.customer_image_url ?? "", rating: String(r.rating), review_text: r.review_text ?? "", is_visible: String(r.is_visible), display_order: String(r.display_order) });
  const deleteReview = async (id: string) => { if (!confirm("حذف التقييم؟")) return; const { error } = await supabase.from("customer_reviews").delete().eq("id", id); if (error) setError(error.message); else await load(); };

  return <AdminGuard><AdminPage>
    <div className="mb-8 flex items-center justify-between gap-4"><div><h1 className="text-3xl font-extrabold">لوحة التحكم</h1><p className="mt-1 text-slate-400">إدارة المتجر، أسعار الشحن وتقييمات العملاء من مكان واحد.</p></div><Button variant="outline" className="border-slate-700 bg-transparent" onClick={load}><RefreshCw size={17}/>تحديث</Button></div>
    {error && <div className="mb-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{error}</div>}
    <div className="grid gap-5 md:grid-cols-3"><Stat icon={<Package/>} title="المنتجات" value={stats.products}/><Stat icon={<Tags/>} title="التصنيفات" value={stats.categories}/><Stat icon={<ShoppingCart/>} title="الطلبات" value={stats.orders}/></div>

    <section className="mt-8">
      <div className="mb-4"><h2 className="text-2xl font-extrabold">أسعار الشحن حسب المحافظة</h2><p className="mt-1 text-sm text-slate-400">القيمة التي تضعها هنا تُحفظ في قاعدة البيانات وتظهر تلقائيًا في السلة والإجمالي.</p></div>
      <Card className="border-slate-800 bg-slate-900"><CardContent className="p-4 sm:p-6"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rates.map((rate) => <div key={rate.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center justify-between gap-3"><span className="font-bold">{rate.governorate}</span><select value={rate.is_active ? "true" : "false"} onChange={(e) => setRates((prev) => prev.map((x) => x.id === rate.id ? { ...x, is_active: e.target.value === "true" } : x))} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs"><option value="true">نشط</option><option value="false">مخفي</option></select></div><div className="mt-3 flex gap-2"><Input type="number" min="0" value={rate.price} onChange={(e) => setRates((prev) => prev.map((x) => x.id === rate.id ? { ...x, price: Number(e.target.value) } : x))} className="border-slate-700 bg-slate-900"/><Button disabled={savingRate === rate.id} onClick={() => saveShipping(rate)}>{savingRate === rate.id ? "..." : "حفظ"}</Button></div></div>)}</div>{loading && <p className="mt-4 text-sm text-slate-400">جاري التحميل...</p>}</CardContent></Card>
    </section>

    <section className="mt-10">
      <div className="mb-4"><h2 className="text-2xl font-extrabold">تقييمات العملاء</h2><p className="mt-1 text-sm text-slate-400">أضف اسم العميل، صورته إن وجدت، عدد النجوم، ونص التقييم. استخدم «يظهر في الموقع» للتحكم في ظهوره.</p></div>
      <Card className="border-slate-800 bg-slate-900"><CardContent className="p-5 sm:p-6"><form onSubmit={saveReview} className="grid gap-4 md:grid-cols-2">
        <Field label="اسم العميل"><Input required value={reviewForm.customer_name} onChange={(e) => setReviewForm({ ...reviewForm, customer_name: e.target.value })} className="border-slate-700 bg-slate-950"/></Field>
        <Field label="التقييم"><select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })} className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3">{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} نجوم</option>)}</select></Field>
        <Field label="صورة العميل (اختياري)"><label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-700 bg-slate-950 px-3 text-sm text-slate-400"><Upload size={16}/>{reviewImage ? reviewImage.name : "اختيار صورة"}<input type="file" accept="image/*" className="hidden" onChange={(e) => setReviewImage(e.target.files?.[0] ?? null)}/></label></Field>
        <Field label="رابط صورة موجود (اختياري)"><Input value={reviewForm.customer_image_url} onChange={(e) => setReviewForm({ ...reviewForm, customer_image_url: e.target.value })} placeholder="اختياري" className="border-slate-700 bg-slate-950"/></Field>
        <Field label="يظهر في الموقع؟"><select value={reviewForm.is_visible} onChange={(e) => setReviewForm({ ...reviewForm, is_visible: e.target.value })} className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3"><option value="true">نعم — يظهر</option><option value="false">لا — مخفي</option></select></Field>
        <Field label="ترتيب الظهور"><Input type="number" value={reviewForm.display_order} onChange={(e) => setReviewForm({ ...reviewForm, display_order: e.target.value })} className="border-slate-700 bg-slate-950"/></Field>
        <label className="space-y-2 text-sm md:col-span-2"><span className="block">نص التقييم (اختياري)</span><textarea rows={3} value={reviewForm.review_text} onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })} className="w-full rounded-md border border-slate-700 bg-slate-950 p-3 outline-none" placeholder="مثال: الخامة ممتازة والتوصيل كان سريعًا."/></label>
        <div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={reviewSaving}>{reviewSaving ? "جاري الحفظ..." : reviewForm.id ? "حفظ التعديل" : "إضافة التقييم"}</Button>{reviewForm.id && <Button type="button" variant="outline" className="border-slate-700 bg-transparent" onClick={resetReview}>إلغاء التعديل</Button>}</div>
      </form></CardContent></Card>

      <div className="mt-5 grid gap-4 md:grid-cols-2">{reviews.map((review) => <Card key={review.id} className="border-slate-800 bg-slate-900"><CardContent className="flex gap-4 p-4"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-800">{review.customer_image_url ? <img src={review.customer_image_url} alt="" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-slate-500">{review.customer_name.slice(0,1)}</div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{review.customer_name}</h3><select value={review.is_visible ? "true" : "false"} onChange={async (e) => { const next = e.target.value === "true"; setReviews((prev) => prev.map((x) => x.id === review.id ? { ...x, is_visible: next } : x)); const { error } = await supabase.from("customer_reviews").update({ is_visible: next }).eq("id", review.id); if (error) { setError(error.message); await load(); } }} className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-xs"><option value="true">يظهر في الموقع</option><option value="false">لا يظهر</option></select></div><div className="mt-1 flex items-center gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} size={14} className={i < review.rating ? "fill-current text-amber-400" : "text-slate-600"}/>)}</div>{review.review_text && <p className="mt-2 text-sm leading-6 text-slate-400">{review.review_text}</p>}<div className="mt-3 flex gap-2"><Button size="sm" variant="outline" className="border-slate-700 bg-transparent" onClick={() => editReview(review)}><Pencil size={14}/>تعديل</Button><Button size="sm" variant="destructive" onClick={() => deleteReview(review.id)}><Trash2 size={14}/>حذف</Button></div></div></CardContent></Card>)}</div>
    </section>
  </AdminPage></AdminGuard>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2 text-sm"><span className="block text-slate-300">{label}</span>{children}</label>; }
function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: number }) { return <Card className="border-slate-800 bg-slate-900"><CardContent className="flex items-center gap-4 p-6"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-800">{icon}</div><div><div className="text-sm text-slate-400">{title}</div><div className="mt-1 text-3xl font-extrabold">{value}</div></div></CardContent></Card>; }
