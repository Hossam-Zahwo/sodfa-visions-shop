import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ImagePlus, Loader2, ShieldCheck, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getReviewRequest, submitCustomerReview, uploadCustomerReviewImage } from "@/lib/db";

export const Route = createFileRoute("/review/$token")({
  head: () => ({ meta: [
    { title: "قيّم تجربتك | SODFA صدفة" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: ReviewPage,
});

function ReviewPage() {
  const { token } = Route.useParams();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    getReviewRequest(token).then((data) => {
      if (!alive) return;
      setRequest(data);
      if (data?.customer_name) setName(data.customer_name);
      setLoading(false);
    }).catch((e) => { if (alive) { setError(e?.message || "رابط التقييم غير صالح أو انتهت صلاحيته."); setLoading(false); } });
    return () => { alive = false; };
  }, [token]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const chooseImage = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("من فضلك اختر صورة فقط.");
    if (file.size > 4 * 1024 * 1024) return setError("حجم الصورة يجب ألا يتجاوز 4MB.");
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    setError("");
    if (!request?.order_id) return setError("رابط التقييم غير صالح.");
    if (!rating) return setError("اختار عدد النجوم أولًا.");
    if (!name.trim()) return setError("اكتب اسمك من فضلك.");
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (image) imageUrl = await uploadCustomerReviewImage(image, token);
      await submitCustomerReview({ orderId: request.order_id, token, customerName: name, rating, reviewText: text, imageUrl });
      setDone(true);
    } catch (e: any) {
      const msg = String(e?.message || "");
      setError(msg.includes("REVIEW_ALREADY") || msg.includes("REVIEW_LINK_INVALID") ? "تم استخدام رابط التقييم من قبل أو انتهت صلاحيته." : "حصلت مشكلة أثناء إرسال التقييم. جرّب مرة أخرى.");
    } finally { setSubmitting(false); }
  };

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-14">
    <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
      <section className="w-full rounded-[2rem] border border-border bg-card p-5 shadow-2xl sm:p-8">
        {loading ? <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> : done ? (
          <div className="py-10 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400"/><h1 className="mt-5 text-2xl font-black sm:text-3xl">شكرًا على تقييمك ❤️</h1><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-subtle">وصلنا رأيك بنجاح. التقييم يدخل أولًا للمراجعة، وبعدها ممكن يظهر على موقع SODFA.</p><Link to="/" className="bg-sodfa mt-7 inline-flex rounded-xl px-6 py-3 text-sm font-bold text-primary-foreground">العودة للمتجر</Link></div>
        ) : !request ? (
          <div className="py-10 text-center"><X className="mx-auto h-12 w-12 text-red-400"/><h1 className="mt-4 text-xl font-bold">رابط التقييم غير متاح</h1><p className="mt-2 text-sm leading-7 text-subtle">الرابط قد يكون انتهت صلاحيته أو تم استخدامه بالفعل.</p><Link to="/" className="mt-6 inline-flex rounded-xl border border-border px-5 py-3 text-sm font-semibold">العودة للمتجر</Link></div>
        ) : (
          <>
            <div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary"><ShieldCheck size={28}/></div><h1 className="mt-5 text-2xl font-black sm:text-3xl">قيّم تجربتك معنا ❤️</h1><p className="mt-2 text-sm leading-7 text-subtle">رأيك بيساعدنا نطور تجربة SODFA ونختار منتجات أفضل.</p></div>
            <div className="mt-8 flex justify-center gap-2" dir="ltr">{[1,2,3,4,5].map((n) => <button key={n} type="button" aria-label={`${n} نجوم`} onClick={() => setRating(n)} className="rounded-xl p-1 transition hover:scale-110"><Star className={n <= rating ? "h-10 w-10 fill-amber-400 text-amber-400" : "h-10 w-10 text-slate-500"}/></button>)}</div>
            <p className="mt-2 text-center text-xs text-subtle">{rating ? `${rating} من 5` : "اختار تقييمك"}</p>
            <div className="mt-7 space-y-4">
              <label className="block text-sm font-semibold">الاسم<input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="mt-2 h-12 w-full rounded-xl border border-border bg-input px-4 outline-none focus:border-primary"/></label>
              <label className="block text-sm font-semibold">اكتب رأيك (اختياري)<textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={5} className="mt-2 w-full resize-none rounded-xl border border-border bg-input p-4 leading-7 outline-none focus:border-primary" placeholder="إيه أكتر حاجة عجبتك؟"/></label>
              <div><p className="text-sm font-semibold">صورة (اختياري)</p><label className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border p-4 hover:border-primary"><ImagePlus className="text-primary"/><span className="min-w-0 flex-1 text-sm text-subtle">{image ? image.name : "ارفع صورة للمنتج أو تجربتك — حتى 4MB"}</span><input type="file" accept="image/*" className="hidden" onChange={(e) => chooseImage(e.target.files?.[0] ?? null)}/></label>{preview && <div className="relative mt-3 w-fit"><img src={preview} alt="معاينة" className="h-28 w-28 rounded-2xl object-cover"/><button type="button" onClick={() => { setImage(null); URL.revokeObjectURL(preview); setPreview(""); }} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-black text-white"><X size={14}/></button></div>}</div>
            </div>
            {error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-200">{error}</div>}
            <button type="button" disabled={submitting} onClick={submit} className="bg-sodfa mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-primary-foreground shadow-[0_16px_40px_-16px_rgba(192,107,207,.8)] disabled:cursor-not-allowed disabled:opacity-60">{submitting && <Loader2 className="animate-spin" size={18}/>}إرسال التقييم</button>
          </>
        )}
      </section>
    </div>
  </main>;
}
