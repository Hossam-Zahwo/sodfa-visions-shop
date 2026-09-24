import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ImagePlus, Plus, Trash2, Pencil, RefreshCw, Star, X, Upload } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPage } from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { listCategories, listProductImages, listProductVariants, listProducts, type DbCategory, type DbProduct, type DbProductImage, type DbProductVariant } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/products")({ component: ProductsAdmin });

const empty={slug:"",name_ar:"",name_en:"",description_ar:"",description_en:"",category_id:"",price:"",old_price:"",stock:"0",in_stock:true,featured:false,best_seller:false,is_new:false,keywords:""};

function slugify(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");}
async function makeUniqueSlug(value:string,excludeId:string|null){
 const base=slugify(value); if(!base)return "";
 const {data,error}=await supabase.from("products").select("id,slug").ilike("slug",`${base}%`); if(error)throw error;
 const used=new Set((data||[]).filter((r:any)=>r.id!==excludeId).map((r:any)=>r.slug));
 if(!used.has(base))return base;
 let n=2; while(used.has(`${base}-${n}`))n++; return `${base}-${n}`;
}
async function makeUniqueCode(prefix:string,kind:"sku"|"barcode"){
 for(let i=0;i<8;i++){
   const code=kind==="sku"?`${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*900+100)}`:`${prefix}${Math.floor(Math.random()*9000+1000)}`;
   const {data,error}=await supabase.from("products").select("id").eq(kind,code).limit(1); if(error)throw error; if(!data?.length)return code;
 }
 throw new Error(`تعذر إنشاء ${kind} فريد تلقائيًا.`);
}
async function makeVariantSku(productId:string,v:VariantDraft){
 const base=(v.variant_value||v.variant_name||"VAR").trim().toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,18)||"VAR";
 const code=`SODFA-V-${productId.slice(0,6).toUpperCase()}-${base}-${Math.floor(Math.random()*900+100)}`;
 const {data,error}=await supabase.from("product_variants").select("id").eq("sku",code).limit(1); if(error)throw error;
 return data?.length ? `${code}-${Math.floor(Math.random()*90+10)}` : code;
}
type UploadItem={file:File;preview:string};
type VariantDraft={id?:string;variant_name:string;variant_type:string;variant_value:string;sku:string;name_ar:string;name_en:string;description_ar:string;description_en:string;price:string;old_price:string;stock:string;images:UploadItem[];existingImages:DbProductImage[];primaryIndex:number};

function makeVariant():VariantDraft{return{id:undefined,variant_name:"",variant_type:"",variant_value:"",sku:"",name_ar:"",name_en:"",description_ar:"",description_en:"",price:"",old_price:"",stock:"0",images:[],existingImages:[],primaryIndex:0}}

function ProductsAdmin(){
 const [items,setItems]=useState<DbProduct[]>([]),[cats,setCats]=useState<DbCategory[]>([]),[variants,setVariants]=useState<DbProductVariant[]>([]),[images,setImages]=useState<DbProductImage[]>([]);
 const [form,setForm]=useState(empty),[editing,setEditing]=useState<string|null>(null),[show,setShow]=useState(false),[error,setError]=useState(""),[loading,setLoading]=useState(false),[hasVariants,setHasVariants]=useState(false),[drafts,setDrafts]=useState<VariantDraft[]>([]),[expanded,setExpanded]=useState<Record<string,boolean>>({});
 const fileRef=useRef<HTMLInputElement>(null); const [mainUploads,setMainUploads]=useState<UploadItem[]>([]); const [mainPrimary,setMainPrimary]=useState(0);
 const load=async()=>{setLoading(true);try{const ps=await listProducts();const imgs=await listProductImages(ps.map(p=>p.id));setItems(ps.map(p=>({...p,image_url:imgs.find(i=>i.product_id===p.id&&!i.variant_id&&i.is_primary)?.image_url||imgs.find(i=>i.product_id===p.id&&!i.variant_id)?.image_url||null})));setCats(await listCategories());setVariants(await listProductVariants(ps.map(p=>p.id)));setImages(imgs)}catch(e:any){setError(e.message)}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const mainImages=useMemo(()=>images.filter(i=>!i.variant_id),[images]);
 const grouped=useMemo(()=>{const m=new Map<string,DbProductVariant[]>();variants.forEach(v=>{const a=m.get(v.product_id)||[];a.push(v);m.set(v.product_id,a)});return m},[variants]);
 const reset=()=>{setEditing(null);setForm(empty);setShow(false);setHasVariants(false);setDrafts([]);setMainUploads([]);setMainPrimary(0);setError("")};
 const openNew=()=>{setEditing(null);setForm(empty);setHasVariants(false);setDrafts([]);setMainUploads([]);setMainPrimary(0);setError("");setShow(true)};
 const openEdit=async(p:DbProduct)=>{setError("");setEditing(p.id);setForm({slug:p.slug,name_ar:p.name_ar,name_en:p.name_en,description_ar:p.description_ar||"",description_en:p.description_en||"",category_id:p.category_id||"",price:String(p.price),old_price:p.old_price==null?"":String(p.old_price),stock:String(p.stock),in_stock:p.in_stock,featured:p.featured,best_seller:p.best_seller,is_new:p.is_new,keywords:(p.keywords||[]).join(", ")});const pv=variants.filter(v=>v.product_id===p.id);setHasVariants(pv.length>0);setDrafts(pv.map(v=>({id:v.id,variant_name:v.variant_name,variant_type:v.variant_type||"",variant_value:v.variant_value||"",sku:v.sku||"",name_ar:v.name_ar||"",name_en:v.name_en||"",description_ar:v.description_ar||"",description_en:v.description_en||"",price:v.price==null?"":String(v.price),old_price:v.old_price==null?"":String(v.old_price),stock:v.stock==null?"0":String(v.stock),images:[],existingImages:images.filter(i=>i.variant_id===v.id),primaryIndex:Math.max(0,images.filter(i=>i.variant_id===v.id).findIndex(i=>i.is_primary))})));setMainUploads([]);setMainPrimary(0);setShow(true)};
 const addFiles=(files:FileList|File[])=>{const arr=Array.from(files).filter(f=>f.type.startsWith("image/"));setMainUploads(prev=>[...prev,...arr.map(file=>({file,preview:URL.createObjectURL(file)}))])};
 const addVariantFiles=(idx:number,files:FileList|File[])=>{const arr=Array.from(files).filter(f=>f.type.startsWith("image/"));setDrafts(prev=>prev.map((v,i)=>i===idx?{...v,images:[...v.images,...arr.map(file=>({file,preview:URL.createObjectURL(file)}))]}:v))};
 const uploadFiles=async(productId:string,files:UploadItem[],variantId:string|null,primaryIndex:number,existing:DbProductImage[])=>{
   if(files.length===0)return existing;
   const rows:Partial<DbProductImage>[]=[];
   for(let i=0;i<files.length;i++){const item=files[i];const ext=item.file.name.split(".").pop()||"jpg";const path=`products/${productId}/${variantId||"main"}/${crypto.randomUUID()}.${ext}`;const up=await supabase.storage.from("product-images").upload(path,item.file,{upsert:false,contentType:item.file.type});if(up.error)throw up.error;const pub=supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;rows.push({product_id:productId,variant_id:variantId,image_url:pub,storage_path:path,is_primary:(existing.length===0&&i===primaryIndex),sort_order:existing.length+i});}
   if(rows.length){const {data,error}=await supabase.from("product_images").insert(rows).select();if(error)throw error;return [...existing,...(data||[]) as DbProductImage[]]}
   return existing;
 };
 const save=async(e:React.FormEvent)=>{e.preventDefault();setError("");setLoading(true);try{
   const generatedSlug=await makeUniqueSlug(form.slug||form.name_en,editing); if(!generatedSlug) throw new Error("اكتب الاسم الإنجليزي أو الـ Slug.");
   const payload:any={
     slug:generatedSlug,
     name_ar:form.name_ar.trim(),
     name_en:form.name_en.trim(),
     description_ar:form.description_ar||null,
     description_en:form.description_en||null,
     category_id:form.category_id||null,
     base_price:form.old_price?Number(form.old_price):Number(form.price)||0,
     sale_price:Number(form.price)||0,
     final_price:Number(form.price)||0,
     stock_quantity:Math.max(0,Number(form.stock)||0),
     is_active:Boolean(form.in_stock),
     is_featured:Boolean(form.featured),
     is_bestseller:Boolean(form.best_seller),
     is_new:Boolean(form.is_new),
     is_offer:Boolean(Boolean(form.old_price)),
     keywords:[...new Set(form.keywords.split(/[,\n،]+/).map((x:string)=>x.trim()).filter(Boolean))],
     sku:editing ? undefined : await makeUniqueCode("SODFA", "sku"),
     barcode:editing ? undefined : await makeUniqueCode("622"+Date.now().toString().slice(-7), "barcode"),
   };
   Object.keys(payload).forEach(k=>payload[k]===undefined&&delete payload[k]);
   let productId=editing;
   if(editing){const r=await supabase.from("products").update(payload).eq("id",editing).select("id").single();if(r.error)throw r.error;productId=r.data.id;}else{const r=await supabase.from("products").insert(payload).select("id").single();if(r.error)throw r.error;productId=r.data.id;}
   const existingMain=images.filter(i=>i.product_id===productId&&!i.variant_id);await uploadFiles(productId!,mainUploads,null,mainPrimary,existingMain);
   if(hasVariants){
     const keep:string[]=[];
     for(const v of drafts){const type=(v.variant_type||"").trim().toLowerCase();const value=(v.variant_value||"").trim();const vp:any={product_id:productId,name:v.variant_name||`${form.name_ar} - ${value||"Variant"}`,color:/color|colour|لون|اللون/.test(type)?value:null,size:/size|مقاس|المقاس/.test(type)?value:null,sku:v.sku||await makeVariantSku(productId!,v),price:v.price?Number(v.price):Number(form.price)||0,sale_price:v.price?Number(v.price):Number(form.price)||0,is_active:true};let vid=v.id;if(vid){const r=await supabase.from("product_variants").update(vp).eq("id",vid).select("id,barcode,sku").single();if(r.error)throw r.error;keep.push(vid)}else{const r=await supabase.from("product_variants").insert(vp).select("id,barcode,sku").single();if(r.error)throw r.error;vid=r.data.id;keep.push(vid)}
       const existing=v.existingImages;await uploadFiles(productId!,v.images,vid,v.primaryIndex,existing);
     }
     const old=variants.filter(v=>v.product_id===productId&&!keep.includes(v.id));if(old.length){const r=await supabase.from("product_variants").delete().in("id",old.map(v=>v.id));if(r.error)throw r.error;}
   }else{const old=variants.filter(v=>v.product_id===productId);if(old.length){const r=await supabase.from("product_variants").delete().in("id",old.map(v=>v.id));if(r.error)throw r.error;}}
   reset();await load();
 }catch(err:any){setError(err.message||"حدث خطأ أثناء حفظ المنتج")}finally{setLoading(false)}};
 const remove=async(id:string)=>{if(!confirm("حذف المنتج وجميع الـ Variants والصور الخاصة به؟"))return;setLoading(true);const r=await supabase.from("products").delete().eq("id",id);if(r.error)setError(r.error.message);else await load();setLoading(false)};
 const removeVariant=async(v:DbProductVariant)=>{if(!confirm("حذف الـ Variant؟"))return;const r=await supabase.from("product_variants").delete().eq("id",v.id);if(r.error)setError(r.error.message);else await load()};
 const updateDraft=(idx:number,patch:Partial<VariantDraft>)=>setDrafts(prev=>prev.map((v,i)=>i===idx?{...v,...patch}:v));
 return <AdminGuard><AdminPage><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-extrabold">المنتجات</h1><p className="text-slate-400">المنتج الأساسي والـ Variants والصور والباركودات</p></div><div className="flex gap-2"><Button variant="outline" className="border-slate-700 bg-transparent" onClick={load}><RefreshCw size={17}/></Button><Button onClick={openNew}><Plus size={17}/>إضافة منتج</Button></div></div>
 {error&&<div className="mb-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-red-300">{error}</div>}
 {show&&<Card className="mb-6 border-slate-800 bg-slate-900"><CardContent className="p-6"><form onSubmit={save} className="grid gap-4 md:grid-cols-2">
   <Field label="الاسم بالعربي"><Input required value={form.name_ar} onChange={e=>setForm({...form,name_ar:e.target.value})}/></Field><Field label="English name"><Input required value={form.name_en} onChange={e=>setForm({...form,name_en:e.target.value})}/></Field>
   <Field label="Slug (اختياري)"><Input value={form.slug} placeholder="premium-iphone-case" onChange={e=>setForm({...form,slug:slugify(e.target.value)})}/><span className="text-xs text-slate-500">اتركه فارغًا وسيتم توليده من الاسم الإنجليزي.</span></Field><Field label="التصنيف"><select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})} className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3"> <option value="">بدون تصنيف</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}</select></Field>
   <Field label="السعر"><Input required type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></Field><Field label="السعر القديم"><Input type="number" min="0" value={form.old_price} onChange={e=>setForm({...form,old_price:e.target.value})}/></Field><Field label="المخزون"><Input type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></Field>
   <div className="md:col-span-2"><ImageUploader title="صور المنتج" files={mainUploads} existing={images.filter(i=>i.product_id===editing&&!i.variant_id)} primary={mainPrimary} onFiles={addFiles} onPrimary={setMainPrimary} onRemove={(i)=>setMainUploads(p=>p.filter((_,n)=>n!==i))} inputRef={fileRef}/></div>
   <Field label="الوصف بالعربي"><Textarea value={form.description_ar} onChange={e=>setForm({...form,description_ar:e.target.value})}/></Field><Field label="English description"><Textarea value={form.description_en} onChange={e=>setForm({...form,description_en:e.target.value})}/></Field>
   <div className="flex flex-wrap gap-4 md:col-span-2 text-sm">{([['featured','مميز'],['best_seller','الأكثر مبيعًا'],['is_new','جديد'],['in_stock','متاح']] as const).map(([k,l])=><label key={k} className="flex items-center gap-2"><input type="checkbox" checked={form[k]} onChange={e=>setForm({...form,[k]:e.target.checked})}/>{l}</label>)}</div>
   <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950 p-4"><Field label="هل المنتج له Variants؟"><select value={hasVariants?"yes":"no"} onChange={e=>{const yes=e.target.value==="yes";setHasVariants(yes);if(yes&&!drafts.length)setDrafts([makeVariant()]);}} className="h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3"><option value="no">لا، منتج واحد</option><option value="yes">نعم، له أكثر من Variant</option></select></Field>{hasVariants&&<div className="mt-4 space-y-4">{drafts.map((v,i)=><VariantEditor key={v.id||i} variant={v} index={i} base={form} onChange={updateDraft} onRemove={()=>setDrafts(p=>p.filter((_,n)=>n!==i))} onFiles={addVariantFiles}/>) }<Button type="button" variant="outline" className="border-slate-700 bg-transparent" onClick={()=>setDrafts(p=>[...p,makeVariant()])}><Plus size={16}/>إضافة Variant آخر</Button></div>}</div>
   <div className="flex gap-2 md:col-span-2"><Button disabled={loading} type="submit">{editing?"حفظ التعديل":"حفظ المنتج"}</Button><Button type="button" variant="outline" className="border-slate-700 bg-transparent" onClick={reset}>إلغاء</Button></div>
 </form></CardContent></Card>}
 <div className="overflow-hidden rounded-xl border border-slate-800"><table className="w-full text-sm"><thead className="bg-slate-900 text-slate-300"><tr><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">Barcode</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">المخزون</th><th className="p-3 text-right">Variants</th><th className="p-3 text-right">إجراءات</th></tr></thead><tbody>{items.map(p=>{const vs=grouped.get(p.id)||[];return <Fragment key={p.id}><tr className="border-t border-slate-800 bg-slate-950"><td className="p-3"><div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-800">{p.image_url&&<img src={p.image_url} className="h-full w-full object-cover"/>}</div><div><div className="font-bold">{p.name_ar}</div><div className="text-xs text-slate-500">{p.name_en}</div></div></div></td><td className="p-3 font-mono text-xs">{p.barcode||"—"}</td><td className="p-3">{p.price} جنيه</td><td className="p-3">{p.stock}</td><td className="p-3">{vs.length? <button className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1" onClick={()=>setExpanded(e=>({...e,[p.id]:!e[p.id]}))}>{expanded[p.id]?<ChevronDown size={15}/>:<ChevronRight size={15}/>} {vs.length}</button>:<span className="text-slate-500">—</span>}</td><td className="p-3"><div className="flex gap-2"><Button size="sm" variant="outline" className="border-slate-700 bg-transparent" onClick={()=>openEdit(p)}><Pencil size={15}/></Button><Button size="sm" variant="destructive" onClick={()=>remove(p.id)}><Trash2 size={15}/></Button></div></td></tr>{expanded[p.id]&&vs.map(v=><tr key={v.id} className="border-t border-slate-900 bg-slate-900/60"><td className="p-3 pr-12"><div className="font-semibold">↳ {v.variant_name}</div><div className="text-xs text-slate-500">{v.variant_type||"اختلاف"}: {v.variant_value||"—"}</div></td><td className="p-3 font-mono text-xs">{v.barcode}</td><td className="p-3">{v.price??p.price} جنيه</td><td className="p-3">{v.stock??p.stock}</td><td className="p-3 text-xs text-slate-400">{v.sku||"بدون SKU"}</td><td className="p-3"><div className="flex gap-2"><Button size="sm" variant="outline" className="border-slate-700 bg-transparent" onClick={()=>openEdit(p)}><Pencil size={15}/></Button><Button size="sm" variant="destructive" onClick={()=>removeVariant(v)}><Trash2 size={15}/></Button></div></td></tr>)} </Fragment>})}</tbody></table></div>
 </AdminPage></AdminGuard>
}

function ImageUploader({title,files,existing,primary,onFiles,onPrimary,onRemove,inputRef}:{title:string;files:UploadItem[];existing:DbProductImage[];primary:number;onFiles:(f:FileList|File[])=>void;onPrimary:(i:number)=>void;onRemove:(i:number)=>void;inputRef:React.RefObject<HTMLInputElement|null>}){const [drag,setDrag]=useState(false);return <div><div className="mb-2 flex items-center justify-between"><span className="text-sm text-slate-300">{title}</span><span className="text-xs text-slate-500">رفع من الجهاز فقط — بدون روابط</span></div><div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);onFiles(e.dataTransfer.files)}} onClick={()=>inputRef.current?.click()} className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center ${drag?"border-white bg-slate-800":"border-slate-700 bg-slate-950"}`}><Upload className="mx-auto mb-2"/><div className="text-sm">اسحب الصور هنا أو اضغط لاختيارها</div><input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e=>e.target.files&&onFiles(e.target.files)}/></div><div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">{existing.map((im,i)=><div key={im.id} className="relative overflow-hidden rounded-lg border border-slate-700"><img src={im.image_url} className="aspect-square w-full object-cover"/><span className="absolute left-1 top-1 rounded bg-slate-950/80 px-1 text-[10px]">{im.is_primary?"رئيسية":"محفوظة"}</span></div>)}{files.map((f,i)=><div key={f.preview} className="relative overflow-hidden rounded-lg border border-slate-700"><img src={f.preview} className="aspect-square w-full object-cover"/><button type="button" className="absolute right-1 top-1 rounded-full bg-slate-950/80 p-1" onClick={e=>{e.stopPropagation();onRemove(i)}}><X size={13}/></button><button type="button" className={`absolute bottom-1 left-1 rounded px-2 py-1 text-[10px] ${primary===i?"bg-white text-slate-950":"bg-slate-950/80"}`} onClick={e=>{e.stopPropagation();onPrimary(i)}}>{primary===i?<><Star size={11} className="inline"/> الرئيسية</>:"تعيين رئيسية"}</button></div>)}</div></div>}

function VariantEditor({variant,index,base,onChange,onRemove,onFiles}:{variant:VariantDraft;index:number;base:typeof empty;onChange:(i:number,p:Partial<VariantDraft>)=>void;onRemove:()=>void;onFiles:(i:number,f:FileList|File[])=>void}){const ref=useRef<HTMLInputElement>(null);return <div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><div className="mb-4 flex items-center justify-between"><div><div className="font-bold">Variant {index+1}</div><div className="text-xs text-slate-500">يأخذ بيانات المنتج الأساسي تلقائيًا، وتملأ فقط الاختلافات هنا</div></div><Button type="button" size="sm" variant="destructive" onClick={onRemove}><Trash2 size={14}/></Button></div><div className="grid gap-3 md:grid-cols-3"><Field label="اسم الـ Variant"><Input required value={variant.variant_name} placeholder={`${base.name_ar} - مثال: أسود`} onChange={e=>onChange(index,{variant_name:e.target.value})}/></Field><Field label="نوع الاختلاف"><Input value={variant.variant_type} placeholder="لون / مقاس / موديل" onChange={e=>onChange(index,{variant_type:e.target.value})}/></Field><Field label="قيمة الاختلاف"><Input value={variant.variant_value} placeholder="أسود / XL / Pro" onChange={e=>onChange(index,{variant_value:e.target.value})}/></Field><Field label="SKU تلقائي"><Input value={variant.sku||"سيتم إنشاؤه تلقائيًا عند الحفظ"} readOnly /></Field><Field label="السعر (اتركه فارغًا = الأساسي)"><Input type="number" value={variant.price} onChange={e=>onChange(index,{price:e.target.value})}/></Field><Field label="السعر القديم"><Input type="number" value={variant.old_price} onChange={e=>onChange(index,{old_price:e.target.value})}/></Field><Field label="المخزون (اترك 0 إن لم يوجد)"><Input type="number" min="0" value={variant.stock} onChange={e=>onChange(index,{stock:e.target.value})}/></Field><Field label="اسم عربي مختلف اختياري"><Input value={variant.name_ar} onChange={e=>onChange(index,{name_ar:e.target.value})}/></Field><Field label="English name override"><Input value={variant.name_en} onChange={e=>onChange(index,{name_en:e.target.value})}/></Field><Field label="وصف عربي مختلف"><Textarea value={variant.description_ar} onChange={e=>onChange(index,{description_ar:e.target.value})}/></Field><Field label="English description override"><Textarea value={variant.description_en} onChange={e=>onChange(index,{description_en:e.target.value})}/></Field><div className="md:col-span-3"><ImageUploader title="صور الـ Variant" files={variant.images} existing={variant.existingImages} primary={variant.primaryIndex} onFiles={f=>onFiles(index,f)} onPrimary={i=>onChange(index,{primaryIndex:i})} onRemove={i=>onChange(index,{images:variant.images.filter((_,n)=>n!==i)})} inputRef={ref}/></div></div></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="space-y-2 text-sm"><span className="block text-slate-300">{label}</span>{children}</label>}
