import { supabase } from "./supabase";

export type DbCategory = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  created_at?: string;
};

export type DbProduct = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  category_id: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  in_stock: boolean;
  featured: boolean;
  best_seller: boolean;
  is_new: boolean;
  image_url: string | null;
  barcode?: string | null;
  sku?: string | null;
  is_active?: boolean;
  keywords?: string[];
  created_at?: string;
  updated_at?: string;
};

export type DbProductVariant = {
  id: string;
  product_id: string;
  variant_name: string;
  variant_type: string | null;
  variant_value: string | null;
  barcode: string;
  sku: string | null;
  name_ar: string | null;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  price: number | null;
  old_price: number | null;
  stock: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DbProductImage = {
  id: string;
  product_id: string;
  variant_id: string | null;
  image_url: string;
  storage_path: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at?: string;
};

export type StoreColor = {
  name: { ar: string; en: string };
  hex: string;
};

export type StoreProduct = {
  id: string;
  slug: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  category: string;
  categoryId: string | null;
  price: number;
  oldPrice?: number;
  colors: StoreColor[];
  models?: string[];
  images: string[];
  inStock: boolean;
  tags: Array<"featured" | "best" | "new">;
  keywords: string[];
};

export async function dashboardStats() {
  const [{ count: products }, { count: categories }, { count: orders }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);
  return { products: products ?? 0, categories: categories ?? 0, orders: orders ?? 0 };
}

export async function listProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id,slug,name_ar,name_en,description_ar,description_en,category_id,base_price,sale_price,final_price,stock_quantity,is_active,is_featured,is_bestseller,is_new,is_offer,keywords,barcode,sku,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p:any):DbProduct => ({
    id:p.id, slug:p.slug, name_ar:p.name_ar||"", name_en:p.name_en||"",
    description_ar:p.description_ar??null, description_en:p.description_en??null, category_id:p.category_id??null,
    price:Number(p.final_price ?? p.sale_price ?? p.base_price ?? 0), old_price:p.base_price==null?null:Number(p.base_price),
    stock:Number(p.stock_quantity ?? 0), in_stock:Boolean(p.is_active && Number(p.stock_quantity ?? 0)>0),
    featured:Boolean(p.is_featured), best_seller:Boolean(p.is_bestseller), is_new:Boolean(p.is_new),
    image_url:null, keywords:Array.isArray(p.keywords)?p.keywords:[], barcode:p.barcode??null, sku:p.sku??null, is_active:Boolean(p.is_active), created_at:p.created_at, updated_at:p.updated_at,
  }));
}

export async function listCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name_ar");
  if (error) throw error;
  return (data ?? []) as DbCategory[];
}

export async function listProductVariants(productIds?: string[]) {
  let query = supabase
    .from("product_variants")
    .select("id,product_id,sku,barcode,price,sale_price,is_active,name,color,size,created_at,updated_at")
    .order("created_at", { ascending: true });
  if (productIds?.length) query = query.in("product_id", productIds);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((v:any):DbProductVariant => {
    const type=v.color ? "color" : v.size ? "size" : "variant";
    const value=v.color ?? v.size ?? v.name ?? null;
    return {id:v.id,product_id:v.product_id,variant_name:v.name||value||"Variant",variant_type:type,variant_value:value,barcode:v.barcode,sku:v.sku??null,name_ar:null,name_en:null,description_ar:null,description_en:null,price:v.price==null?null:Number(v.price),old_price:v.sale_price==null?null:Number(v.sale_price),stock:null,image_url:null,is_active:Boolean(v.is_active),created_at:v.created_at,updated_at:v.updated_at};
  });
}

export async function listProductImages(productIds?: string[]) {
  let query = supabase
    .from("product_images")
    .select("*")
    .order("sort_order", { ascending: true });
  if (productIds?.length) query = query.in("product_id", productIds);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DbProductImage[];
}

const colorPalette: StoreColor[] = [
  { name: { ar: "أسود", en: "Black" }, hex: "#111111" },
  { name: { ar: "أبيض", en: "White" }, hex: "#F4F4F4" },
  { name: { ar: "أزرق", en: "Blue" }, hex: "#3B82F6" },
  { name: { ar: "أحمر", en: "Red" }, hex: "#EF4444" },
  { name: { ar: "وردي", en: "Pink" }, hex: "#EC4899" },
];

function makeColors(variants: DbProductVariant[]): StoreColor[] {
  const values = variants
    .filter((v) => /color|colour|لون/i.test(v.variant_type ?? ""))
    .map((v) => v.variant_value?.trim())
    .filter(Boolean) as string[];

  const unique = [...new Set(values)];
  return unique.slice(0, 5).map((value, index) => ({
    name: { ar: value, en: value },
    hex: colorPalette[index % colorPalette.length].hex,
  }));
}

function toStoreProduct(
  product: DbProduct,
  category: DbCategory | undefined,
  variants: DbProductVariant[],
  images: DbProductImage[],
): StoreProduct {
  const productImages = images
    .filter((image) => image.product_id === product.id && !image.variant_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.image_url);

  const variantImages = images
    .filter((image) => image.product_id === product.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.image_url);

  const allImages = [...new Set([
    ...productImages,
    ...variantImages,
  ])];

  const productVariants = variants.filter((variant) => variant.product_id === product.id && variant.is_active);
  const models = [...new Set(
    productVariants
      .filter((v) => /model|موديل|جهاز/i.test(v.variant_type ?? ""))
      .map((v) => v.variant_value?.trim())
      .filter(Boolean) as string[],
  )];

  const tags: StoreProduct["tags"] = [];
  if (product.featured) tags.push("featured");
  if (product.best_seller) tags.push("best");
  if (product.is_new) tags.push("new");

  return {
    id: product.id,
    slug: product.slug,
    name: { ar: product.name_ar, en: product.name_en },
    description: {
      ar: product.description_ar ?? "",
      en: product.description_en ?? product.description_ar ?? "",
    },
    category: category?.slug ?? "",
    categoryId: product.category_id,
    price: Number(product.price) || 0,
    oldPrice: product.old_price == null || Number(product.old_price) <= Number(product.price) ? undefined : Number(product.old_price),
    colors: makeColors(productVariants),
    models: models.length ? models : undefined,
    images: allImages.length ? allImages : ["/placeholder.svg"],
    inStock: Boolean(product.in_stock && Number(product.stock) > 0),
    tags,
    keywords: product.keywords ?? [],
  };
}

/** Public-store products. The storefront and the admin now use the same Supabase source of truth. */
export async function listStoreProducts(): Promise<StoreProduct[]> {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  const categoryMap = new Map<string, DbCategory>(categories.map((category) => [category.id, category] as [string, DbCategory]));

  // Variants/images are optional for a normal product. If their tables/policies are unavailable,
  // the product itself still remains visible using its main image and base data.
  const [variantsResult, imagesResult] = await Promise.allSettled([
    listProductVariants(products.map((product) => product.id)),
    listProductImages(products.map((product) => product.id)),
  ]);

  const variants = variantsResult.status === "fulfilled" ? variantsResult.value : [];
  const images = imagesResult.status === "fulfilled" ? imagesResult.value : [];

  return products.map((product) =>
    toStoreProduct(product, categoryMap.get(product.category_id ?? ""), variants, images),
  );
}

export async function getStoreProduct(slug: string): Promise<StoreProduct | null> {
  const products = await listStoreProducts();
  return products.find((product) => product.slug === slug) ?? null;
}
