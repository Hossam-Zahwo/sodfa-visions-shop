import imgCase from "@/assets/p-case.jpg";
import imgCharger from "@/assets/p-charger.jpg";
import imgCable from "@/assets/p-cable.jpg";
import imgPowerbank from "@/assets/p-powerbank.jpg";
import imgWireless from "@/assets/p-wireless.jpg";
import imgHolder from "@/assets/p-holder.jpg";
import imgAudio from "@/assets/p-audio.jpg";

export type Bilingual = { ar: string; en: string };

export type Category = {
  slug: string;
  name: Bilingual;
  image: string;
};

export type ProductColor = { name: Bilingual; hex: string };

export type Product = {
  id: string;
  slug: string;
  name: Bilingual;
  description: Bilingual;
  category: string;
  price: number;
  oldPrice?: number;
  colors: ProductColor[];
  models?: string[];
  images: string[];
  inStock: boolean;
  tags: Array<"featured" | "best" | "new">;
};

export const categories: Category[] = [
  { slug: "cases", name: { ar: "جرابات الهواتف", en: "Phone Cases" }, image: imgCase },
  { slug: "chargers", name: { ar: "الشواحن", en: "Chargers" }, image: imgCharger },
  { slug: "cables", name: { ar: "الكابلات", en: "Cables" }, image: imgCable },
  { slug: "power-banks", name: { ar: "باور بانك", en: "Power Banks" }, image: imgPowerbank },
  {
    slug: "wireless-charging",
    name: { ar: "الشحن اللاسلكي", en: "Wireless Charging" },
    image: imgWireless,
  },
  { slug: "holders", name: { ar: "حاملات الهواتف", en: "Phone Holders" }, image: imgHolder },
  { slug: "audio", name: { ar: "الصوتيات", en: "Audio" }, image: imgAudio },
  {
    slug: "car",
    name: { ar: "إكسسوارات السيارة", en: "Car Accessories" },
    image: imgHolder,
  },
];

export const brands: Array<{ name: string; models: string[] }> = [
  {
    name: "Apple",
    models: [
      "iPhone 17 Pro Max",
      "iPhone 17",
      "iPhone 16 Pro Max",
      "iPhone 16",
      "iPhone 15",
    ],
  },
  {
    name: "Samsung",
    models: ["Galaxy S25 Ultra", "Galaxy S25", "Galaxy S24", "Galaxy A55"],
  },
  { name: "Xiaomi", models: ["Xiaomi 15 Pro", "Xiaomi 15", "Redmi Note 14 Pro"] },
  { name: "Oppo", models: ["Oppo Reno 12", "Oppo A98"] },
];

const C = {
  black: { name: { ar: "أسود", en: "Black" }, hex: "#0A0A0A" },
  white: { name: { ar: "أبيض", en: "White" }, hex: "#F2F2F2" },
  pink: { name: { ar: "وردي", en: "Pink" }, hex: "#E7A8C4" },
  blue: { name: { ar: "أزرق", en: "Blue" }, hex: "#3B6FD4" },
  clear: { name: { ar: "شفاف", en: "Clear" }, hex: "#8C8C8C" },
  beige: { name: { ar: "بيج", en: "Beige" }, hex: "#D9C7AE" },
  purple: { name: { ar: "بنفسجي", en: "Purple" }, hex: "#8E2AA8" },
};

const appleModels = brands[0].models.slice(0, 4);
const universal = ["Universal"];

export const products: Product[] = [
  {
    id: "p1",
    slug: "premium-iphone-case",
    name: { ar: "جراب آيفون بريميوم", en: "Premium iPhone Case" },
    description: {
      ar: "جراب بخامة سيليكون مبطنة من الداخل، حواف مرتفعة لحماية الكاميرا والشاشة، وملمس ناعم مقاوم لبصمات الأصابع. مقاس دقيق لكل موديل.",
      en: "Soft-touch silicone with a microfiber lining, raised camera and screen edges, and a fingerprint-resistant finish. Precision-cut for every model.",
    },
    category: "cases",
    price: 549,
    oldPrice: 749,
    colors: [C.black, C.pink, C.blue, C.clear, C.beige],
    models: appleModels,
    images: [imgCase, imgWireless, imgHolder],
    inStock: true,
    tags: ["featured", "best"],
  },
  {
    id: "p2",
    slug: "gan-fast-charger-45w",
    name: { ar: "شاحن سريع GaN 45 واط", en: "GaN Fast Charger 45W" },
    description: {
      ar: "شاحن مدمج بتقنية GaN يدعم الشحن السريع مع حماية من ارتفاع الحرارة.",
      en: "Compact GaN charger with fast-charge support and thermal protection.",
    },
    category: "chargers",
    price: 899,
    oldPrice: 1099,
    colors: [C.white, C.black],
    models: universal,
    images: [imgCharger, imgCable],
    inStock: true,
    tags: ["featured", "best"],
  },
  {
    id: "p3",
    slug: "braided-usbc-cable",
    name: { ar: "كابل USB-C مجدول", en: "Braided USB-C Cable" },
    description: {
      ar: "كابل مجدول بطول 1.8 متر يتحمل أكثر من 25 ألف ثنية، ينقل الطاقة والبيانات بسرعة.",
      en: "1.8m braided cable rated for 25,000+ bends with fast power and data transfer.",
    },
    category: "cables",
    price: 299,
    colors: [C.black, C.purple],
    models: universal,
    images: [imgCable, imgCharger],
    inStock: true,
    tags: ["best", "new"],
  },
  {
    id: "p4",
    slug: "slim-power-bank-20000",
    name: { ar: "باور بانك 20000 مللي أمبير", en: "Slim Power Bank 20,000mAh" },
    description: {
      ar: "بطارية محمولة نحيفة بشاشة رقمية ومنفذين، تشحن هاتفك أكثر من ثلاث مرات.",
      en: "Slim portable battery with digital display and dual ports — over three full charges.",
    },
    category: "power-banks",
    price: 1249,
    oldPrice: 1499,
    colors: [C.black],
    models: universal,
    images: [imgPowerbank, imgCable],
    inStock: true,
    tags: ["featured", "new"],
  },
  {
    id: "p5",
    slug: "magnetic-wireless-pad",
    name: { ar: "شاحن لاسلكي مغناطيسي", en: "Magnetic Wireless Pad" },
    description: {
      ar: "قاعدة شحن لاسلكي مغناطيسية بقوة 15 واط مع سطح مانع للانزلاق.",
      en: "15W magnetic wireless charging pad with an anti-slip surface.",
    },
    category: "wireless-charging",
    price: 799,
    colors: [C.black, C.white],
    models: universal,
    images: [imgWireless, imgCharger],
    inStock: true,
    tags: ["featured", "new"],
  },
  {
    id: "p6",
    slug: "magnetic-car-mount",
    name: { ar: "حامل سيارة مغناطيسي", en: "Magnetic Car Mount" },
    description: {
      ar: "حامل مغناطيسي قوي يدور 360 درجة ويثبت بإحكام على التابلوه.",
      en: "Strong magnetic mount with 360° rotation and a secure dashboard grip.",
    },
    category: "car",
    price: 449,
    oldPrice: 599,
    colors: [C.black],
    models: universal,
    images: [imgHolder, imgWireless],
    inStock: true,
    tags: ["best"],
  },
  {
    id: "p7",
    slug: "sodfa-buds-pro",
    name: { ar: "سماعات صدفة برو", en: "SODFA Buds Pro" },
    description: {
      ar: "سماعات لاسلكية بعزل ضوضاء نشط وبطارية تدوم حتى 30 ساعة مع العلبة.",
      en: "True wireless earbuds with active noise cancelling and 30h total battery.",
    },
    category: "audio",
    price: 1899,
    oldPrice: 2299,
    colors: [C.black, C.white],
    models: universal,
    images: [imgAudio, imgWireless],
    inStock: true,
    tags: ["featured", "new", "best"],
  },
  {
    id: "p8",
    slug: "desk-phone-stand",
    name: { ar: "حامل مكتبي للهاتف", en: "Desk Phone Stand" },
    description: {
      ar: "حامل ألومنيوم قابل للطي بزاوية مريحة للمشاهدة والعمل.",
      en: "Foldable aluminium stand with a comfortable viewing angle.",
    },
    category: "holders",
    price: 379,
    colors: [C.black, C.white],
    models: universal,
    images: [imgHolder, imgCase],
    inStock: false,
    tags: ["new"],
  },
  {
    id: "p9",
    slug: "clear-armor-case",
    name: { ar: "جراب شفاف مقوّى", en: "Clear Armor Case" },
    description: {
      ar: "جراب شفاف مقاوم للاصفرار بحواف ممتصة للصدمات.",
      en: "Anti-yellowing clear case with shock-absorbing bumpers.",
    },
    category: "cases",
    price: 399,
    oldPrice: 499,
    colors: [C.clear, C.black, C.purple],
    models: [...appleModels, "Galaxy S25 Ultra", "Galaxy S25"],
    images: [imgCase, imgHolder],
    inStock: true,
    tags: ["best", "new"],
  },
  {
    id: "p10",
    slug: "car-fast-charger",
    name: { ar: "شاحن سيارة سريع", en: "Car Fast Charger" },
    description: {
      ar: "شاحن سيارة بمنفذين يدعم الشحن السريع لجهازين في نفس الوقت.",
      en: "Dual-port car charger that fast-charges two devices at once.",
    },
    category: "car",
    price: 349,
    colors: [C.black],
    models: universal,
    images: [imgCharger, imgCable],
    inStock: true,
    tags: ["featured"],
  },
  {
    id: "p11",
    slug: "magsafe-power-bank",
    name: { ar: "باور بانك مغناطيسي", en: "Magnetic Power Bank" },
    description: {
      ar: "بطارية مغناطيسية 10000 مللي أمبير تلتصق بظهر الهاتف وتشحنه لاسلكيًا.",
      en: "10,000mAh magnetic battery that snaps on and charges wirelessly.",
    },
    category: "power-banks",
    price: 1099,
    colors: [C.black, C.white],
    models: appleModels,
    images: [imgPowerbank, imgWireless],
    inStock: true,
    tags: ["new"],
  },
  {
    id: "p12",
    slug: "lightning-fast-cable",
    name: { ar: "كابل لايتنينج سريع", en: "Lightning Fast Cable" },
    description: {
      ar: "كابل معتمد بطول متر لشحن سريع وآمن.",
      en: "Certified 1m cable for fast, safe charging.",
    },
    category: "cables",
    price: 249,
    oldPrice: 329,
    colors: [C.black, C.white],
    models: appleModels,
    images: [imgCable, imgCharger],
    inStock: true,
    tags: ["best"],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const byTag = (tag: "featured" | "best" | "new") =>
  products.filter((p) => p.tags.includes(tag));
export const byCategory = (slug: string) => products.filter((p) => p.category === slug);
export const onSale = () => products.filter((p) => p.oldPrice);
export const compatibleWith = (model: string) =>
  products.filter((p) => p.models?.includes(model) || p.models?.includes("Universal"));
export const discountPct = (p: Product) =>
  p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
