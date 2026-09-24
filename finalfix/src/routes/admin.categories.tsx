import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPage } from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { listCategories, type DbCategory } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/categories")({ component: CategoriesAdmin });

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function CategoriesAdmin() {
  const [items, setItems] = useState<DbCategory[]>([]);
  const [form, setForm] = useState({ slug: "", name_ar: "", name_en: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setError(""); setItems(await listCategories()); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذر تحميل الأقسام"); }
  };
  useEffect(() => { void load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const slug = slugify(form.slug || form.name_en);
      if (!slug) throw new Error("اكتب الاسم الإنجليزي أو الـ Slug أولًا.");
      const payload = { slug, name_ar: form.name_ar.trim(), name_en: form.name_en.trim() };
      if (!payload.name_ar || !payload.name_en) throw new Error("الاسم العربي والإنجليزي مطلوبان.");
      const result = editing
        ? await supabase.from("categories").update(payload).eq("id", editing)
        : await supabase.from("categories").insert(payload);
      if (result.error) throw result.error;
      setShow(false); setEditing(null); setForm({ slug: "", name_ar: "", name_en: "" });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "حدث خطأ أثناء حفظ القسم"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف التصنيف؟ المنتجات المرتبطة به قد تتأثر حسب قيود قاعدة البيانات.")) return;
    const result = await supabase.from("categories").delete().eq("id", id);
    if (result.error) setError(result.error.message); else await load();
  };

  const openNew = () => { setEditing(null); setForm({ slug: "", name_ar: "", name_en: "" }); setShow(true); setError(""); };
  const openEdit = (c: DbCategory) => { setEditing(c.id); setForm({ slug: c.slug, name_ar: c.name_ar, name_en: c.name_en }); setShow(true); setError(""); };

  return <AdminGuard><AdminPage>
    <div className="mb-6 flex items-center justify-between gap-3"><div><h1 className="text-3xl font-extrabold">التصنيفات</h1><p className="text-slate-400">أضف الأقسام أولًا ثم اربط المنتجات بها.</p></div><Button onClick={openNew}><Plus size={17}/>إضافة تصنيف</Button></div>
    {error && <div className="mb-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-red-300">{error}</div>}
    {show && <Card className="mb-6 border-slate-800 bg-slate-900"><CardContent className="p-6"><form onSubmit={save} className="grid gap-4 md:grid-cols-2">
      <Field label="الاسم بالعربي"><Input required value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })}/></Field>
      <Field label="English name"><Input required value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })}/></Field>
      <Field label="Slug"><Input value={form.slug} placeholder="phone-cases" onChange={e => setForm({ ...form, slug: slugify(e.target.value) })}/></Field>
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">الـ Slug هو الجزء الذي يظهر في الرابط، مثل: <b className="text-slate-200">/category/phone-cases</b>. إذا تركته فارغًا سيتم توليده من الاسم الإنجليزي.</div>
      <div className="flex gap-2 md:col-span-2"><Button disabled={saving} type="submit">{saving ? "جاري الحفظ..." : editing ? "حفظ التعديل" : "إضافة"}</Button><Button type="button" variant="outline" className="border-slate-700 bg-transparent" onClick={() => setShow(false)}>إلغاء</Button></div>
    </form></CardContent></Card>}
    <div className="grid gap-4 md:grid-cols-2">{items.map(c => <Card key={c.id} className="border-slate-800 bg-slate-900"><CardContent className="flex items-center gap-4 p-4"><div className="grid h-14 w-14 place-items-center rounded-xl bg-slate-800 text-slate-500">#</div><div className="flex-1"><h3 className="font-bold">{c.name_ar}</h3><p className="text-sm text-slate-400">{c.name_en} · /category/{c.slug}</p></div><Button type="button" variant="outline" className="border-slate-700 bg-transparent" onClick={() => openEdit(c)}><Pencil size={16}/></Button><Button type="button" variant="destructive" onClick={() => remove(c.id)}><Trash2 size={16}/></Button></CardContent></Card>)}</div>
  </AdminPage></AdminGuard>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2 text-sm"><span className="block">{label}</span>{children}</label>; }
