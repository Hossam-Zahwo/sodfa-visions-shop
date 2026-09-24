import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown, ChevronRight, GripVertical, ImagePlus, Plus, Trash2, Pencil,
  RefreshCw, Star, X, Upload, Images, Eye, EyeOff, Save, ArrowUp, ArrowDown, Sparkles, Wand2, Check,
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPage } from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  listCategories, listProductImages, listProductVariants, listProducts,
  type DbCategory, type DbProduct, type DbProductImage, type DbProductVariant,
} from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { suggestFromText } from "@/lib/productAutomation";

export const Route = createFileRoute("/admin/products")({ component: ProductsAdmin });

const empty = {
  slug: "", name_ar: "", name_en: "", description_ar: "", description_en: "",
  category_id: "", price: "", old_price: "", stock: "0", in_stock: true,
  featured: false, best_seller: false, is_new: false,
};

type UploadItem = { file: File; preview: string };
type AdminProduct = DbProduct & { thumbnail_url?: string };
type VariantDraft = {
  id?: string;
  variant_name: string;
  variant_type: string;
  variant_value: string;
  color: string;
  sku: string;
  barcode: string;
  price: string;
  old_price: string;
  stock: string;
  images: UploadItem[];
  existingImages: DbProductImage[];
  primaryIndex: number;
};

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function makeUniqueSlug(value: string, excludeId: string | null) {
  const base = slugify(value);
  if (!base) return "";
  const { data, error } = await supabase.from("products").select("id,slug").ilike("slug", `${base}%`);
  if (error) throw error;
  const used = new Set((data || []).filter((r: any) => r.id !== excludeId).map((r: any) => r.slug));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

async function makeUniqueCode(prefix: string, table: "products" | "product_variants", column: "sku" | "barcode") {
  for (let i = 0; i < 12; i++) {
    const code = column === "sku"
      ? `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`
      : `${prefix}${Math.floor(Math.random() * 900000 + 100000)}`;
    const { data, error } = await supabase.from(table).select("id").eq(column, code).limit(1);
    if (error) throw error;
    if (!data?.length) return code;
  }
  throw new Error(`تعذر إنشاء ${column} فريد تلقائيًا.`);
}

function makeVariant(): VariantDraft {
  return {
    variant_name: "", variant_type: "لون", variant_value: "", color: "",
    sku: "", barcode: "", price: "", old_price: "", stock: "0", images: [], existingImages: [], primaryIndex: 0,
  };
}

function ProductsAdmin() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [cats, setCats] = useState<DbCategory[]>([]);
  const [variants, setVariants] = useState<DbProductVariant[]>([]);
  const [images, setImages] = useState<DbProductImage[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [tab, setTab] = useState<"general" | "advanced">("general");
  const [entryMode, setEntryMode] = useState<"automation" | "manual">("automation");
  const [automationText, setAutomationText] = useState("");
  const [automationBusy, setAutomationBusy] = useState(false);
  const [automationDone, setAutomationDone] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState({ sku: "", barcode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [drafts, setDrafts] = useState<VariantDraft[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mainExisting, setMainExisting] = useState<DbProductImage[]>([]);
  const [mainUploads, setMainUploads] = useState<UploadItem[]>([]);
  const [mainPrimary, setMainPrimary] = useState(0);
  const [dragMain, setDragMain] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const ps = await listProducts();
      const imgs = await listProductImages(ps.map((p) => p.id));
      setItems(ps.map((p) => ({
        ...p,
        thumbnail_url:
          imgs.find((i) => i.product_id === p.id && !i.variant_id && i.is_primary)?.image_url ||
          imgs.find((i) => i.product_id === p.id && !i.variant_id)?.image_url,
      })));
      setCats(await listCategories());
      setVariants(await listProductVariants(ps.map((p) => p.id)));
      setImages(imgs);
    } catch (e: any) {
      setError(e.message || "تعذر تحميل المنتجات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, DbProductVariant[]>();
    variants.forEach((v) => {
      const list = map.get(v.product_id) || [];
      list.push(v);
      map.set(v.product_id, list);
    });
    return map;
  }, [variants]);

  const reset = () => {
    setEditing(null); setForm(empty); setShow(false); setTab("general"); setEntryMode("automation");
    setAutomationText(""); setAutomationBusy(false); setAutomationDone(false); setGeneratedCodes({ sku: "", barcode: "" });
    setHasVariants(false); setDrafts([]); setMainExisting([]); setMainUploads([]);
    setMainPrimary(0); setError("");
  };

  const openNew = async () => {
    setEditing(null); setForm(empty); setHasVariants(false); setDrafts([]);
    setMainExisting([]); setMainUploads([]); setMainPrimary(0); setTab("general");
    setError(""); setShow(true); setEntryMode("automation"); setAutomationText(""); setAutomationDone(false);
    try {
      const [sku, barcode] = await Promise.all([makeUniqueCode("SODFA", "products", "sku"), makeUniqueCode("622", "products", "barcode")]);
      setGeneratedCodes({ sku, barcode });
    } catch (e: any) { setError(e.message || "تعذر تجهيز SKU و Barcode تلقائيًا."); }
  };

  const openEdit = (p: AdminProduct) => {
    setError("");
    setEntryMode("manual"); setAutomationText(""); setAutomationDone(false);
    setGeneratedCodes({ sku: p.sku || "", barcode: p.barcode || "" });
    setEditing(p.id);
    setForm({
      slug: p.slug, name_ar: p.name_ar, name_en: p.name_en,
      description_ar: p.description_ar || "", description_en: p.description_en || "",
      category_id: p.category_id || "", price: String(p.price),
      old_price: p.old_price == null ? "" : String(p.old_price),
      stock: String(p.stock), in_stock: p.in_stock, featured: p.featured,
      best_seller: p.best_seller, is_new: p.is_new,
    });
    const pv = grouped.get(p.id) || [];
    setHasVariants(pv.length > 0);
    setDrafts(pv.map((v) => {
      const ex = images.filter((i) => i.variant_id === v.id).sort((a, b) => a.sort_order - b.sort_order);
      return {
        id: v.id,
        variant_name: v.variant_name,
        variant_type: v.variant_type || "لون",
        variant_value: v.variant_value || "",
        color: v.color || "",
        sku: v.sku || "",
        barcode: v.barcode || "",
        price: v.price == null ? "" : String(v.price),
        old_price: v.old_price == null ? "" : String(v.old_price),
        stock: String(v.stock ?? 0),
        images: [], existingImages: ex,
        primaryIndex: Math.max(0, ex.findIndex((i) => i.is_primary)),
      };
    }));
    setMainExisting(images.filter((i) => i.product_id === p.id && !i.variant_id).sort((a, b) => a.sort_order - b.sort_order));
    setMainUploads([]); setMainPrimary(0); setTab("general"); setShow(true);
  };

  const normalizeImageFiles = (files: FileList | File[]) =>
    Array.from(files).filter((file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024);

  const addFiles = (files: FileList | File[]) => {
    const arr = normalizeImageFiles(files);
    setMainUploads((prev) => {
      const existing = new Set(prev.map((x) => `${x.file.name}:${x.file.size}:${x.file.lastModified}`));
      return [...prev, ...arr.filter((f) => !existing.has(`${f.name}:${f.size}:${f.lastModified}`)).map((file) => ({
        file, preview: URL.createObjectURL(file),
      }))];
    });
  };

  const addVariantFiles = (idx: number, files: FileList | File[]) => {
    const arr = normalizeImageFiles(files);
    setDrafts((prev) => prev.map((v, i) => {
      if (i !== idx) return v;
      const existing = new Set(v.images.map((x) => `${x.file.name}:${x.file.size}:${x.file.lastModified}`));
      return {
        ...v,
        images: [...v.images, ...arr.filter((f) => !existing.has(`${f.name}:${f.size}:${f.lastModified}`)).map((file) => ({
          file, preview: URL.createObjectURL(file),
        }))],
      };
    }));
  };

  const reorder = <T,>(list: T[], from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
    const next = [...list]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next;
  };

  const reorderMainExisting = (from: number, to: number) => setMainExisting((v) => reorder(v, from, to));
  const reorderMainUploads = (from: number, to: number) => setMainUploads((v) => reorder(v, from, to));
  const reorderVariantExisting = (idx: number, from: number, to: number) =>
    setDrafts((prev) => prev.map((v, i) => i === idx ? { ...v, existingImages: reorder(v.existingImages, from, to) } : v));
  const reorderVariantUploads = (idx: number, from: number, to: number) =>
    setDrafts((prev) => prev.map((v, i) => i === idx ? { ...v, images: reorder(v.images, from, to) } : v));

  const setPrimaryImage = async (imageId: string, productId: string, variantId: string | null) => {
    let clear = supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
    clear = variantId === null ? clear.is("variant_id", null) : clear.eq("variant_id", variantId);
    const cleared = await clear;
    if (cleared.error) throw cleared.error;
    const target = await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId).eq("product_id", productId);
    if (target.error) throw target.error;
  };

  const removeExistingImage = async (image: DbProductImage) => {
    if (!confirm("حذف هذه الصورة نهائيًا؟")) return;
    setLoading(true);
    try {
      const dbDelete = await supabase.from("product_images").delete().eq("id", image.id);
      if (dbDelete.error) throw dbDelete.error;
      if (image.storage_path) await supabase.storage.from("product-images").remove([image.storage_path]);
      setMainExisting((prev) => prev.filter((x) => x.id !== image.id));
      setDrafts((prev) => prev.map((v) => ({ ...v, existingImages: v.existingImages.filter((x) => x.id !== image.id) })));
      setImages((prev) => prev.filter((x) => x.id !== image.id));
      toast.success("تم حذف الصورة.");
    } catch (e: any) {
      setError(e.message || "تعذر حذف الصورة.");
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = async (
    productId: string,
    files: UploadItem[],
    variantId: string | null,
    primaryIndex: number,
    existing: DbProductImage[],
  ) => {
    if (!files.length) return [] as DbProductImage[];
    const rows: any[] = [];
    const paths: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const ext = (item.file.name.split(".").pop() || "jpg").toLowerCase();
        const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
        const storagePath = `products/${productId}/${variantId || "main"}/${crypto.randomUUID()}.${safeExt}`;
        const up = await supabase.storage.from("product-images").upload(storagePath, item.file, {
          upsert: false, contentType: item.file.type || "image/jpeg",
        });
        if (up.error) throw up.error;
        paths.push(storagePath);
        const url = supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl;
        rows.push({
          product_id: productId, variant_id: variantId, image_url: url, storage_path: storagePath,
          is_primary: false, sort_order: existing.length + i,
        });
      }
      const { data, error } = await supabase.from("product_images").insert(rows).select("*");
      if (error) throw error;
      const inserted = (data || []) as DbProductImage[];
      if (!inserted.length) throw new Error("تم رفع الصور لكن لم يتم تسجيلها.");
      const hasExistingPrimary = existing.some((i) => i.is_primary);
      const selected = hasExistingPrimary ? existing.find((i) => i.is_primary)! : inserted[primaryIndex] || inserted[0];
      await setPrimaryImage(selected.id, productId, variantId);
      return inserted;
    } catch (e) {
      if (paths.length) await supabase.storage.from("product-images").remove(paths).catch(() => undefined);
      throw e;
    }
  };

  const persistOrder = async (rows: DbProductImage[]) => {
    for (let i = 0; i < rows.length; i++) {
      const r = await supabase.from("product_images").update({ sort_order: i }).eq("id", rows[i].id);
      if (r.error) throw r.error;
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const isEditing = Boolean(editing);
    let productId = editing;
    try {
      const generatedSlug = await makeUniqueSlug(form.slug || form.name_en, editing);
      if (!generatedSlug) throw new Error("اكتب الاسم الإنجليزي أو الـ Slug.");

      const payload: any = {
        slug: generatedSlug,
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        description_ar: form.description_ar || null,
        description_en: form.description_en || null,
        category_id: form.category_id || null,
        base_price: form.old_price ? Number(form.old_price) : Number(form.price) || 0,
        sale_price: Number(form.price) || 0,
        final_price: Number(form.price) || 0,
        stock_quantity: Math.max(0, Number(form.stock) || 0),
        is_active: Boolean(form.in_stock),
        is_featured: Boolean(form.featured),
        is_bestseller: Boolean(form.best_seller),
        is_new: Boolean(form.is_new),
        is_offer: Boolean(form.old_price),
      };
      if (!isEditing) {
        payload.sku = generatedCodes.sku || await makeUniqueCode("SODFA", "products", "sku");
        payload.barcode = generatedCodes.barcode || await makeUniqueCode("622", "products", "barcode");
      }

      if (isEditing) {
        const r = await supabase.from("products").update(payload).eq("id", editing).select("id").single();
        if (r.error) throw r.error;
        productId = r.data.id;
      } else {
        const r = await supabase.from("products").insert(payload).select("id").single();
        if (r.error) throw r.error;
        productId = r.data.id;
      }

      if (!productId) throw new Error("تعذر تحديد رقم المنتج.");

      const uploadedMain = await uploadFiles(productId, mainUploads, null, mainPrimary, mainExisting);
      const finalMain = [...mainExisting, ...uploadedMain];
      await persistOrder(finalMain);

      // Persist the primary image even when the user only changes an existing image.
      const selectedMain =
        finalMain.find((image) => image.is_primary)?.id ??
        uploadedMain[mainPrimary]?.id ??
        finalMain[0]?.id;
      if (selectedMain) {
        await setPrimaryImage(selectedMain, productId, null);
      }

      const keep: string[] = [];
      if (hasVariants) {
        for (let i = 0; i < drafts.length; i++) {
          const v = drafts[i];
          const value = v.variant_value.trim();
          const rawFinalPrice = v.price.trim();
          const rawOldPrice = v.old_price.trim();
          const finalPrice = rawFinalPrice === "" ? Number(form.price) || 0 : Number(rawFinalPrice);
          const enteredOldPrice = rawOldPrice === "" ? null : Number(rawOldPrice);
          if (!Number.isFinite(finalPrice) || finalPrice < 0) {
            throw new Error(`سعر الـ Variant رقم ${i + 1} غير صحيح.`);
          }
          if (enteredOldPrice !== null && (!Number.isFinite(enteredOldPrice) || enteredOldPrice < 0)) {
            throw new Error(`السعر القديم للـ Variant رقم ${i + 1} غير صحيح.`);
          }
          const oldPrice = enteredOldPrice !== null && enteredOldPrice > finalPrice ? enteredOldPrice : null;
          const vp: any = {
            product_id: productId,
            variant_name: v.variant_name.trim() || `${form.name_ar} - ${value || `Variant ${i + 1}`}`,
            variant_type: v.variant_type.trim() || "Variant",
            variant_value: value || null,
            color: v.color.trim() || (/لون|color/i.test(v.variant_type) ? value : null),
            sale_price: finalPrice,
            final_price: finalPrice,
            base_price: oldPrice ?? finalPrice,
            stock_quantity: Math.max(0, Number(v.stock) || 0),
            sku: v.sku || await makeUniqueCode(`SODFA-V-${productId.slice(0, 6).toUpperCase()}`, "product_variants", "sku"),
            barcode: v.barcode || await makeUniqueCode("623", "product_variants", "barcode"),
            is_active: true,
            display_order: i,
          };

          let variantId = v.id;
          if (variantId) {
            const r = await supabase.from("product_variants").update(vp).eq("id", variantId).select("id").single();
            if (r.error) throw r.error;
          } else {
            const r = await supabase.from("product_variants").insert(vp).select("id").single();
            if (r.error) throw r.error;
            variantId = r.data.id;
          }
          keep.push(variantId);

          const uploaded = await uploadFiles(productId, v.images, variantId, v.primaryIndex, v.existingImages);
          await persistOrder([...v.existingImages, ...uploaded]);

          if (v.existingImages.length || uploaded.length) {
            const primaryId =
              v.existingImages.find((x) => x.is_primary)?.id ??
              uploaded[v.primaryIndex]?.id ??
              uploaded[0]?.id;
            if (primaryId) await setPrimaryImage(primaryId, productId, variantId);
          }
        }
      }

      const oldVariants = variants.filter((v) => v.product_id === productId && !keep.includes(v.id));
      if (oldVariants.length) {
        const r = await supabase.from("product_variants").delete().in("id", oldVariants.map((v) => v.id));
        if (r.error) throw r.error;
      }

      await load();
      reset();
      toast.success(isEditing ? "تم تعديل المنتج بنجاح" : "تم إضافة المنتج بنجاح", {
        description: "تم حفظ البيانات والصور وترتيبها والـ Variants.",
      });
    } catch (err: any) {
      if (!isEditing && productId) {
        const { data: rollbackImages } = await supabase.from("product_images").select("storage_path").eq("product_id", productId);
        const rollbackPaths = (rollbackImages || []).map((row: any) => row.storage_path).filter(Boolean) as string[];
        await supabase.from("product_images").delete().eq("product_id", productId);
        await supabase.from("product_variants").delete().eq("product_id", productId);
        await supabase.from("products").delete().eq("id", productId);
        if (rollbackPaths.length) await supabase.storage.from("product-images").remove(rollbackPaths).catch(() => undefined);
      }
      const message = String(err?.message || "حدث خطأ أثناء حفظ المنتج");
      setError(message);
      toast.error("تعذر حفظ المنتج", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف المنتج وجميع الـ Variants والصور الخاصة به؟")) return;
    setLoading(true);
    try {
      const imgs = images.filter((i) => i.product_id === id);
      const paths = imgs.map((i) => i.storage_path).filter(Boolean) as string[];
      const r = await supabase.from("products").delete().eq("id", id);
      if (r.error) throw r.error;
      if (paths.length) await supabase.storage.from("product-images").remove(paths);
      await load();
    } catch (e: any) {
      setError(e.message || "تعذر حذف المنتج.");
    } finally {
      setLoading(false);
    }
  };

  const removeVariant = async (v: DbProductVariant) => {
    if (!confirm(`حذف ${v.variant_name}؟`)) return;
    setLoading(true);
    try {
      const imgs = images.filter((i) => i.variant_id === v.id);
      const paths = imgs.map((i) => i.storage_path).filter(Boolean) as string[];
      const r = await supabase.from("product_variants").delete().eq("id", v.id);
      if (r.error) throw r.error;
      if (paths.length) await supabase.storage.from("product-images").remove(paths);
      await load();
    } catch (e: any) {
      setError(e.message || "تعذر حذف الـ Variant.");
    } finally {
      setLoading(false);
    }
  };

  const runAutomationAssist = async () => {
    const source = automationText.trim() || `${form.name_ar} ${form.name_en}`.trim();
    if (!source) { toast.error("اكتب اسم أو وصف المنتج أولًا."); return; }
    setAutomationBusy(true);
    try {
      // Local automation is always available. If a future AI endpoint is configured,
      // the same preview can be upgraded without changing the product form/database flow.
      const suggestion = suggestFromText(source);
      const matchedCategory = cats.find((c) => {
        const haystack = `${c.name_ar} ${c.name_en}`.toLowerCase();
        return (suggestion.name_en || source).toLowerCase().split(/\s+/).some((word) => word.length > 3 && haystack.includes(word));
      });
      setForm((f) => ({
        ...f,
        name_en: f.name_en || suggestion.name_en || "",
        description_ar: f.description_ar || suggestion.description_ar || "",
        description_en: f.description_en || suggestion.description_en || "",
        category_id: f.category_id || matchedCategory?.id || "",
      }));
      if (suggestion.variant_type || suggestion.variant_value) {
        setHasVariants(true);
        if (!drafts.length) {
          const sku = await makeUniqueCode("SODFA-V", "product_variants", "sku");
          const barcode = await makeUniqueCode("623", "product_variants", "barcode");
          setDrafts([{ ...makeVariant(), variant_name: `${form.name_ar || suggestion.name_en || "Product"} - ${suggestion.variant_value || "Variant"}`, variant_type: suggestion.variant_type || "Variant", variant_value: suggestion.variant_value || "", color: suggestion.color || "", sku, barcode, price: form.price }]);
        }
      }
      setAutomationDone(true);
      toast.success("تمت مساعدة الإدخال تلقائيًا — راجع وعدّل البيانات قبل الحفظ.");
    } finally {
      setAutomationBusy(false);
    }
  };

  const addAutomatedVariant = async () => {
    const sku = await makeUniqueCode("SODFA-V", "product_variants", "sku");
    const barcode = await makeUniqueCode("623", "product_variants", "barcode");
    setDrafts((p) => [...p, { ...makeVariant(), sku, barcode, price: form.price }]);
  };

  const updateDraft = (idx: number, patch: Partial<VariantDraft>) =>
    setDrafts((prev) => prev.map((v, i) => i === idx ? { ...v, ...patch } : v));

  const variantThumb = (id: string) =>
    images.find((i) => i.variant_id === id && i.is_primary)?.image_url ||
    images.find((i) => i.variant_id === id)?.image_url;

  return (
    <AdminGuard>
      <AdminPage>
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-900 shadow-sm"><Images size={21}/></div>
                <div>
                  <h1 className="text-2xl font-black text-white sm:text-3xl">إضافة وإدارة المنتجات</h1>
                  <p className="mt-1 text-sm text-slate-400">نفس بيانات SODFA الحالية، بواجهة مرئية أسهل لإدارة الصور والـ Variants.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800" onClick={() => void load()} disabled={loading}><RefreshCw size={16}/></Button>
              <Button onClick={() => void openNew()} className="bg-white text-slate-950 hover:bg-slate-100"><Plus size={17}/> منتج جديد</Button>
            </div>
          </div>

          {error && <div className="mb-5 rounded-2xl border border-red-900/80 bg-red-950/40 p-4 text-sm text-red-200">{error}</div>}

          {show && (
            <div className="sodfa-admin-editor mb-7">
            <Card className="overflow-hidden border-transparent bg-transparent text-white shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={reset} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50">←</button>
                  <div><h2 className="text-xl font-black">{editing ? "تعديل المنتج" : "Add New Product"}</h2><p className="text-xs text-slate-500">{editing ? "تعديل البيانات والصور والـ Variants" : "أضف المنتج بكل تفاصيله من مكان واحد"}</p></div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="border-slate-200 bg-white" onClick={reset}>إلغاء</Button>
                  <Button type="submit" form="product-editor" disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700"><Save size={16}/> {loading ? "جاري الحفظ..." : "Publish"}</Button>
                </div>
              </div>

              <div className="col-span-full rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-4 text-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><div className="flex items-center gap-2 font-black"><Sparkles size={17}/> طريقة إضافة المنتج</div><p className="mt-1 text-xs text-slate-500">الأوتوميشن يساعدك في تجهيز البيانات، وأنت تقدر تعدّل أي حاجة يدويًا قبل الحفظ.</p></div>
                    <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                      <button type="button" onClick={() => setEntryMode("automation")} className={`rounded-lg px-4 py-2 text-sm font-bold ${entryMode === "automation" ? "bg-slate-900 text-white" : "text-slate-500"}`}><Wand2 size={14} className="inline"/> Automation</button>
                      <button type="button" onClick={() => setEntryMode("manual")} className={`rounded-lg px-4 py-2 text-sm font-bold ${entryMode === "manual" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Manual</button>
                    </div>
                  </div>
                  {entryMode === "automation" && !editing && <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                    <Input value={automationText} onChange={(e) => setAutomationText(e.target.value)} placeholder="اكتب وصف المنتج مثل: جراب iPhone 16 Pro Max شفاف MagSafe" className="bg-white"/>
                    <Button type="button" onClick={() => void runAutomationAssist()} disabled={automationBusy} className="bg-violet-700 hover:bg-violet-800"><Sparkles size={16}/> {automationBusy ? "جاري التحليل..." : "مساعدة تلقائية"}</Button>
                  </div>}
                  {automationDone && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><Check size={14} className="inline"/> تم تجهيز اقتراحات تلقائية. راجعها وعدّلها قبل Publish.</div>}
                </div>
                <form id="product-editor" onSubmit={save} className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[290px_300px_minmax(0,1fr)]">
                <div className="space-y-5">
                  <ImageGalleryEditor
                    title="صور المنتج"
                    existing={mainExisting}
                    uploads={mainUploads}
                    primaryIndex={mainPrimary}
                    onUpload={addFiles}
                    onRemoveUpload={(i) => setMainUploads((v) => v.filter((_, n) => n !== i))}
                    onRemoveExisting={(im) => void removeExistingImage(im)}
                    onPrimaryExisting={(id) => setMainExisting((v) => v.map((im) => ({ ...im, is_primary: im.id === id })))}
                    onPrimaryUpload={setMainPrimary}
                    onMoveExisting={reorderMainExisting}
                    onMoveUpload={reorderMainUploads}
                    dragIndex={dragMain}
                    setDragIndex={setDragMain}
                    inputRef={fileRef}
                  />
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Visibility</div>
                    <div className="mt-3 flex items-center justify-between">
                      <div><div className="text-sm font-bold">ظاهر للعملاء</div><div className="text-xs text-slate-500">يمكنك إخفاء المنتج مؤقتًا.</div></div>
                      <button type="button" onClick={() => setForm((f) => ({ ...f, in_stock: !f.in_stock }))} className={`relative h-6 w-11 rounded-full transition ${form.in_stock ? "bg-blue-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${form.in_stock ? "right-1" : "right-6"}`}/></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-black">معاينة سريعة</div>
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <div className="grid grid-cols-[72px_1fr] gap-3 p-3">
                        <div className="h-[72px] overflow-hidden rounded-xl bg-white">{(mainExisting[0]?.image_url || mainUploads[0]?.preview) && <img src={mainExisting[0]?.image_url || mainUploads[0]?.preview} className="h-full w-full object-cover" />}</div>
                        <div className="min-w-0"><div className="line-clamp-2 text-sm font-bold">{form.name_ar || "اسم المنتج"}</div><div className="mt-1 text-xs text-slate-500">{form.name_en || "Product name"}</div><div className="mt-2 font-black text-slate-900">{form.price ? `${form.price} جنيه` : "—"}</div></div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-1">
                    <div className="grid grid-cols-2">
                      <button type="button" onClick={() => setTab("general")} className={`rounded-xl px-3 py-2 text-sm font-bold ${tab === "general" ? "bg-white shadow-sm ring-1 ring-slate-200" : "text-slate-500"}`}>General</button>
                      <button type="button" onClick={() => setTab("advanced")} className={`rounded-xl px-3 py-2 text-sm font-bold ${tab === "advanced" ? "bg-white shadow-sm ring-1 ring-slate-200" : "text-slate-500"}`}>Advanced</button>
                    </div>
                  </div>

                  <CardContent className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    {tab === "general" ? (
                      <div className="space-y-5">
                        <div><h3 className="font-black">Product Details</h3><p className="text-xs text-slate-500">Key info to describe and display your product.</p></div>
                        <Field label="Product Name *"><Input required value={form.name_ar} placeholder="اسم المنتج بالعربي" onChange={(e) => setForm({ ...form, name_ar: e.target.value })}/></Field>
                        <Field label="English Name *"><Input required value={form.name_en} placeholder="e.g. Premium Phone Case" onChange={(e) => setForm({ ...form, name_en: e.target.value })}/></Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Category"><select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">بدون تصنيف</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}</select></Field>
                          <Field label="Slug"><Input value={form.slug} placeholder="premium-iphone-case" onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}/></Field>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="السعر الحالي (الفعلي) *"><Input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/></Field>
                          <Field label="السعر القديم (قبل الخصم)"><Input type="number" min="0" value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })}/></Field>
                        </div>
                        <Field label="Description"><Textarea rows={5} value={form.description_ar} placeholder="اكتب وصفًا مختصرًا يوضح المميزات..." onChange={(e) => setForm({ ...form, description_ar: e.target.value })}/></Field>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div><h3 className="font-black">Advanced</h3><p className="text-xs text-slate-500">البيانات القديمة التي يحتاجها النظام محفوظة كما هي.</p></div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="English Description"><Textarea rows={5} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })}/></Field>
                          <Field label="Stock"><Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}/></Field>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {([["featured","Featured"],["best_seller","Best Seller"],["is_new","New"],["in_stock","Active"]] as const).map(([key,label]) => (
                            <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold"><input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })}/>{label}</label>
                          ))}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-sm font-black">Generated identifiers</div>
                          <p className="mt-1 text-xs text-slate-500">يتم إنشاء SKU و Barcode تلقائيًا عند بدء إضافة المنتج، ولا تحتاج لكتابتهما يدويًا.</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2"><div className="text-[10px] font-bold text-slate-400">SKU</div><div className="mt-1 break-all font-mono text-xs">{generatedCodes.sku || "سيتم التوليد تلقائيًا"}</div></div>
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2"><div className="text-[10px] font-bold text-slate-400">BARCODE</div><div className="mt-1 break-all font-mono text-xs">{generatedCodes.barcode || "سيتم التوليد تلقائيًا"}</div></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="space-y-5">
                  <CardContent className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3"><div><h3 className="font-black">Related Variants</h3><p className="text-xs text-slate-500">كل Variant يأخذ بيانات المنتج الأساسية ويضيف الاختلاف والصور.</p></div><button type="button" onClick={() => { const next = !hasVariants; setHasVariants(next); if (next && !drafts.length) setDrafts([makeVariant()]); }} className={`relative h-6 w-11 rounded-full ${hasVariants ? "bg-blue-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${hasVariants ? "right-1" : "right-6"}`}/></button></div>
                    {hasVariants && <div className="mt-4 space-y-4">{drafts.map((v, i) => (
                      <VariantEditor
                        key={v.id || i} variant={v} index={i} baseName={form.name_ar}
                        onChange={updateDraft}
                        onRemove={() => setDrafts((p) => p.filter((_, n) => n !== i))}
                        onFiles={addVariantFiles}
                        onRemoveExisting={(im) => void removeExistingImage(im)}
                        onMoveExisting={reorderVariantExisting}
                        onMoveUpload={reorderVariantUploads}
                        onPrimaryExisting={(idx, id) => setDrafts((p) => p.map((x, n) => n === idx ? { ...x, existingImages: x.existingImages.map((im) => ({ ...im, is_primary: im.id === id })) } : x))}
                        onPrimaryUpload={(idx, value) => updateDraft(idx, { primaryIndex: value })}
                      />
                    ))}<Button type="button" variant="outline" className="w-full border-dashed border-slate-300 bg-white" onClick={() => void addAutomatedVariant()}><Plus size={16}/> إضافة Variant آخر</Button></div>}
                  </CardContent>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-black">Tips</h3>
                    <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500"><li>• اسحب الصورة لتغيير ترتيبها، أو استخدم الأسهم.</li><li>• علامة النجمة تحدد الصورة الرئيسية.</li><li>• كل Variant له معرض صور مستقل يظهر للعميل عند اختياره.</li></ul>
                  </div>
                </div>
              </form>
            </Card>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><div><h2 className="font-black text-white">Products</h2><p className="text-xs text-slate-500">{items.length} منتج</p></div></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="bg-slate-900 text-slate-400"><tr><th className="p-4 text-right">Product</th><th className="p-4 text-right">Barcode</th><th className="p-4 text-right">Price</th><th className="p-4 text-right">Stock</th><th className="p-4 text-right">Variants</th><th className="p-4 text-right">Actions</th></tr></thead>
                <tbody>
                  {items.map((p) => {
                    const vs = grouped.get(p.id) || [];
                    return <Fragment key={p.id}>
                      <tr className="border-t border-slate-800 bg-slate-950 hover:bg-slate-900/70">
                        <td className="p-4"><div className="flex items-center gap-3"><div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-800">{p.thumbnail_url ? <img src={p.thumbnail_url} className="h-full w-full object-cover" /> : <ImagePlus className="m-4 text-slate-600" size={20}/>}</div><div><div className="font-bold text-white">{p.name_ar}</div><div className="text-xs text-slate-500">{p.name_en}</div></div></div></td>
                        <td className="p-4 font-mono text-xs text-slate-400">{p.barcode || "—"}</td><td className="p-4 text-white">{p.price} جنيه</td><td className="p-4 text-slate-300">{p.stock}</td>
                        <td className="p-4">{vs.length ? <button className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-xs text-white" onClick={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))}>{expanded[p.id] ? <ChevronDown size={15}/> : <ChevronRight size={15}/>} {vs.length} Variant</button> : <span className="text-slate-600">—</span>}</td>
                        <td className="p-4"><div className="flex gap-2"><Button size="sm" variant="outline" className="border-slate-700 bg-transparent text-white" onClick={() => openEdit(p)}><Pencil size={15}/></Button><Button size="sm" variant="destructive" onClick={() => void remove(p.id)}><Trash2 size={15}/></Button></div></td>
                      </tr>
                      {expanded[p.id] && vs.map((v) => {
                        const thumb = variantThumb(v.id);
                        return <tr key={v.id} className="border-t border-slate-900 bg-slate-900/60">
                          <td className="p-3 pr-10" colSpan={2}><div className="flex items-center gap-3"><div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-950 ring-1 ring-slate-800">{thumb ? <img src={thumb} className="h-full w-full object-cover"/> : <ImagePlus size={18} className="m-4 text-slate-700"/>}</div><div><div className="font-bold text-white">↳ {v.variant_name}</div><div className="text-xs text-slate-400">{v.variant_type || "Variant"}: {v.variant_value || "—"} {v.color ? `• ${v.color}` : ""}</div><div className="mt-1 font-mono text-[10px] text-slate-600">{v.sku || "—"} • {v.barcode || "—"}</div></div></div></td>
                          <td className="p-3 text-white">{v.price ?? p.price} جنيه{v.old_price != null && Number(v.old_price) > Number(v.price ?? p.price) ? <span className="ms-2 text-xs text-slate-500 line-through">{v.old_price} جنيه</span> : null}</td><td className="p-3 text-slate-300">{v.stock ?? 0}</td><td className="p-3 text-xs text-slate-500">{images.filter((i) => i.variant_id === v.id).length} صور</td>
                          <td className="p-3"><div className="flex gap-2"><Button size="sm" variant="outline" className="border-slate-700 bg-transparent text-white" onClick={() => openEdit(p)}><Pencil size={15}/></Button><Button size="sm" variant="destructive" onClick={() => void removeVariant(v)}><Trash2 size={15}/></Button></div></td>
                        </tr>;
                      })}
                    </Fragment>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminPage>
    </AdminGuard>
  );
}

function ImageGalleryEditor(props: {
  title: string;
  existing: DbProductImage[];
  uploads: UploadItem[];
  primaryIndex: number;
  onUpload: (files: FileList | File[]) => void;
  onRemoveUpload: (i: number) => void;
  onRemoveExisting: (image: DbProductImage) => void;
  onPrimaryExisting: (id: string) => void;
  onPrimaryUpload: (i: number) => void;
  onMoveExisting: (from: number, to: number) => void;
  onMoveUpload: (from: number, to: number) => void;
  dragIndex: number | null;
  setDragIndex: (i: number | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { existing, uploads } = props;
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between"><div><div className="font-black">{props.title}</div><div className="text-xs text-slate-500">{existing.length + uploads.length} صورة</div></div><button type="button" onClick={() => props.inputRef.current?.click()} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50"><Plus size={18}/></button></div>
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const from = props.dragIndex; if (from != null && from < existing.length) props.onMoveExisting(from, Math.min(existing.length - 1, from)); props.setDragIndex(null); }} className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-2">
      <div className="grid grid-cols-2 gap-2">
        {existing.map((im, i) => <ImageTile key={im.id} src={im.image_url} label={i === 0 ? "Cover" : `${i + 1}`} primary={im.is_primary} onPrimary={() => props.onPrimaryExisting(im.id)} onRemove={() => props.onRemoveExisting(im)} draggable onDragStart={() => props.setDragIndex(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { const from = props.dragIndex; if (from != null) props.onMoveExisting(from, i); props.setDragIndex(null); }} onUp={() => props.onMoveExisting(i, Math.max(0, i - 1))} onDown={() => props.onMoveExisting(i, Math.min(existing.length - 1, i + 1))} />)}
        {uploads.map((im, i) => <ImageTile key={im.preview} src={im.preview} label={`New ${i + 1}`} primary={props.primaryIndex === i && existing.length === 0} onPrimary={() => props.onPrimaryUpload(i)} onRemove={() => props.onRemoveUpload(i)} draggable onDragStart={() => props.setDragIndex(existing.length + i)} onUp={() => props.onMoveUpload(i, Math.max(0, i - 1))} onDown={() => props.onMoveUpload(i, Math.min(uploads.length - 1, i + 1))} />)}
        {!existing.length && !uploads.length && <div className="col-span-2 grid min-h-[220px] place-items-center p-6 text-center text-slate-400"><div><Upload className="mx-auto mb-2" size={26}/><div className="text-sm font-bold">اسحب الصور هنا أو اضغط +</div><div className="mt-1 text-xs">حتى 10MB للصورة</div></div></div>}
      </div>
      <input ref={props.inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && props.onUpload(e.target.files)}/>
    </div>
    <p className="mt-2 text-[11px] leading-5 text-slate-500">يمكن حذف أي صورة، تعيين الرئيسية، أو تغيير الترتيب بالسحب/الأسهم.</p>
  </div>;
}

function ImageTile(props: {
  src: string; label: string; primary: boolean; onPrimary: () => void; onRemove: () => void;
  draggable?: boolean; onDragStart?: () => void; onDragOver?: (e: React.DragEvent) => void; onDrop?: () => void;
  onUp?: () => void; onDown?: () => void;
}) {
  return <div draggable={props.draggable} onDragStart={props.onDragStart} onDragOver={props.onDragOver} onDrop={props.onDrop} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white">
    <img src={props.src} className="aspect-square w-full object-cover" alt="" />
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1.5 text-white">
      <button type="button" title="تعيين كرئيسية" onClick={props.onPrimary} className={`rounded-md px-1.5 py-1 text-[10px] ${props.primary ? "bg-white text-slate-900" : "bg-black/30"}`}>{props.primary ? <Star size={11} className="inline fill-current"/> : "رئيسية"}</button>
      <div className="flex gap-0.5"><button type="button" title="أعلى" onClick={props.onUp} className="rounded p-1 hover:bg-white/20"><ArrowUp size={11}/></button><button type="button" title="أسفل" onClick={props.onDown} className="rounded p-1 hover:bg-white/20"><ArrowDown size={11}/></button><button type="button" title="حذف" onClick={props.onRemove} className="rounded p-1 hover:bg-red-500/50"><X size={12}/></button></div>
    </div>
    <div className="absolute left-1 top-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] text-white"><GripVertical size={10} className="inline"/> {props.label}</div>
  </div>;
}

function VariantEditor(props: {
  variant: VariantDraft; index: number; baseName: string;
  onChange: (i: number, patch: Partial<VariantDraft>) => void;
  onRemove: () => void; onFiles: (i: number, f: FileList | File[]) => void;
  onRemoveExisting: (image: DbProductImage) => void;
  onMoveExisting: (idx: number, from: number, to: number) => void;
  onMoveUpload: (idx: number, from: number, to: number) => void;
  onPrimaryExisting: (idx: number, id: string) => void;
  onPrimaryUpload: (idx: number, value: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const v = props.variant;
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-start justify-between gap-3"><div><div className="font-black">Variant {props.index + 1}</div><div className="text-xs text-slate-500">مثل: أسود / iPhone 15 Pro / 256GB</div></div><Button type="button" size="sm" variant="destructive" onClick={props.onRemove}><Trash2 size={14}/></Button></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Field label="اسم الـ Variant"><Input value={v.variant_name} placeholder={`${props.baseName} - أسود`} onChange={(e) => props.onChange(props.index, { variant_name: e.target.value })}/></Field>
      <Field label="نوع الاختلاف"><Input value={v.variant_type} placeholder="لون / مقاس / موديل" onChange={(e) => props.onChange(props.index, { variant_type: e.target.value })}/></Field>
      <Field label="قيمة الاختلاف"><Input value={v.variant_value} placeholder="أسود / XL / iPhone 15" onChange={(e) => props.onChange(props.index, { variant_value: e.target.value })}/></Field>
      <Field label="لون الـ Variant (اختياري)"><Input value={v.color} placeholder="#000 أو أسود" onChange={(e) => props.onChange(props.index, { color: e.target.value })}/></Field>
      <Field label="السعر الحالي (الفعلي)"><Input type="number" min="0" value={v.price} onChange={(e) => props.onChange(props.index, { price: e.target.value })}/></Field>
      <Field label="السعر القديم (قبل الخصم)"><Input type="number" min="0" value={v.old_price} onChange={(e) => props.onChange(props.index, { old_price: e.target.value })}/></Field>
      <Field label="Stock الخاص بالـ Variant"><Input type="number" min="0" step="1" value={v.stock} onChange={(e) => props.onChange(props.index, { stock: e.target.value })}/></Field>
      <Field label="SKU تلقائي"><Input value={v.sku || "سيتم إنشاؤه تلقائيًا"} readOnly/></Field>
      <Field label="Barcode تلقائي"><Input value={v.barcode || "سيتم إنشاؤه تلقائيًا"} readOnly/></Field>
    </div>
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold">صور الـ Variant</span><button type="button" onClick={() => ref.current?.click()} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold"><ImagePlus size={14} className="inline"/> إضافة صور</button></div>
      <div className="grid grid-cols-3 gap-2">
        {v.existingImages.map((im, i) => <ImageTile key={im.id} src={im.image_url} label={`${i + 1}`} primary={im.is_primary} onPrimary={() => props.onPrimaryExisting(props.index, im.id)} onRemove={() => props.onRemoveExisting(im)} onUp={() => props.onMoveExisting(props.index, i, Math.max(0, i - 1))} onDown={() => props.onMoveExisting(props.index, i, Math.min(v.existingImages.length - 1, i + 1))} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag != null) props.onMoveExisting(props.index, drag, i); setDrag(null); }}/>)}
        {v.images.map((im, i) => <ImageTile key={im.preview} src={im.preview} label={`New ${i + 1}`} primary={v.primaryIndex === i && !v.existingImages.some((x) => x.is_primary)} onPrimary={() => props.onPrimaryUpload(props.index, i)} onRemove={() => props.onChange(props.index, { images: v.images.filter((_, n) => n !== i) })} onUp={() => props.onMoveUpload(props.index, i, Math.max(0, i - 1))} onDown={() => props.onMoveUpload(props.index, i, Math.min(v.images.length - 1, i + 1))}/>)}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && props.onFiles(props.index, e.target.files)}/>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2 text-sm"><span className="block font-semibold text-slate-700">{label}</span>{children}</label>;
}
