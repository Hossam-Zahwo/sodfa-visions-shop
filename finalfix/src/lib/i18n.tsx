import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const dict = {
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.categories": { ar: "الأقسام", en: "Categories" },
  "nav.offers": { ar: "العروض", en: "Offers" },
  "nav.products": { ar: "كل المنتجات", en: "All Products" },
  "nav.menu": { ar: "القائمة", en: "Menu" },
  "nav.cart": { ar: "السلة", en: "Cart" },
  "nav.search": { ar: "بحث", en: "Search" },

  "hero.1.label": { ar: "حماية بمستوى آخر", en: "Protection, elevated" },
  "hero.1.title": { ar: "جرابات تحمي بأناقة", en: "Cases Built to Last" },
  "hero.1.sub": {
    ar: "خامات مميزة وتصميم دقيق يناسب هاتفك تمامًا.",
    en: "Premium materials, precision fit for your phone.",
  },
  "hero.2.label": { ar: "طاقة فورية", en: "Instant power" },
  "hero.2.title": { ar: "شحن أسرع بمرّة", en: "Charge Twice as Fast" },
  "hero.2.sub": {
    ar: "شواحن وكابلات معتمدة تحافظ على بطاريتك.",
    en: "Certified chargers and cables that protect your battery.",
  },
  "hero.3.label": { ar: "بدون أسلاك", en: "Wire-free" },
  "hero.3.title": { ar: "ضعه واتركه يشحن", en: "Just Drop and Charge" },
  "hero.3.sub": {
    ar: "شحن لاسلكي مغناطيسي بثبات كامل.",
    en: "Magnetic wireless charging that never slips.",
  },
  "hero.cta": { ar: "تسوّق الآن", en: "Shop Now" },

  "home.categories": { ar: "تسوّق حسب القسم", en: "Shop by Category" },
  "home.categories.sub": { ar: "كل ما يحتاجه هاتفك", en: "Everything your phone needs" },
  "home.featured": { ar: "منتجات مختارة", en: "Featured Products" },
  "home.best": { ar: "الأكثر مبيعًا", en: "Best Sellers" },
  "home.new": { ar: "وصل حديثًا", en: "New Arrivals" },
  "home.viewAll": { ar: "عرض الكل", en: "View all" },

  "find.title": { ar: "ابحث عن هاتفك", en: "Find Your Phone" },
  "find.sub": {
    ar: "اختر الماركة والموديل لعرض المنتجات المتوافقة.",
    en: "Pick your brand and model to see compatible products.",
  },
  "find.brand": { ar: "الماركة", en: "Brand" },
  "find.model": { ar: "الموديل", en: "Model" },
  "find.choose": { ar: "اختر", en: "Choose" },
  "find.results": { ar: "منتجات متوافقة", en: "Compatible products" },
  "find.empty": { ar: "اختر الموديل لعرض النتائج.", en: "Select a model to see results." },

  "product.addToCart": { ar: "أضف إلى السلة", en: "Add to Cart" },
  "product.added": { ar: "تمت الإضافة", en: "Added" },
  "product.colors": { ar: "الألوان", en: "Colors" },
  "product.model": { ar: "الموديل", en: "Model" },
  "product.qty": { ar: "الكمية", en: "Quantity" },
  "product.inStock": { ar: "متوفر", en: "In stock" },
  "product.outStock": { ar: "غير متوفر", en: "Out of stock" },
  "product.description": { ar: "الوصف", en: "Description" },
  "product.off": { ar: "خصم", en: "OFF" },
  "product.related": { ar: "منتجات مشابهة", en: "You may also like" },

  "shop.title": { ar: "كل المنتجات", en: "All Products" },
  "shop.search": { ar: "ابحث عن منتج...", en: "Search products..." },
  "shop.category": { ar: "القسم", en: "Category" },
  "shop.all": { ar: "الكل", en: "All" },
  "shop.price": { ar: "أقصى سعر", en: "Max price" },
  "shop.results": { ar: "منتج", en: "products" },
  "shop.empty": { ar: "لا توجد نتائج مطابقة.", en: "No matching products." },
  "shop.reset": { ar: "إعادة ضبط", en: "Reset" },

  "cart.title": { ar: "سلة التسوق", en: "Your Cart" },
  "cart.empty": { ar: "سلتك فارغة حاليًا.", en: "Your cart is empty." },
  "cart.continue": { ar: "متابعة التسوق", en: "Continue shopping" },
  "cart.subtotal": { ar: "المجموع الفرعي", en: "Subtotal" },
  "cart.shipping": { ar: "الشحن", en: "Shipping" },
  "cart.free": { ar: "مجاني", en: "Free" },
  "cart.total": { ar: "الإجمالي", en: "Total" },
  "cart.checkout": { ar: "إتمام الطلب", en: "Checkout" },
  "cart.soon": { ar: "الدفع قريبًا", en: "Checkout coming soon" },
  "cart.remove": { ar: "حذف", en: "Remove" },
  "cart.items": { ar: "منتج", en: "items" },

  "offers.title": { ar: "العروض", en: "Offers" },
  "offers.sub": { ar: "خصومات على منتجات مختارة", en: "Discounts on selected products" },
  "categories.title": { ar: "الأقسام", en: "Categories" },

  "footer.tag": {
    ar: "إكسسوارات هاتف مميزة — مصر",
    en: "Premium phone accessories — Egypt",
  },
  "footer.rights": { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },
  "common.currency": { ar: "ج.م", en: "EGP" },
  "common.back": { ar: "رجوع", en: "Back" },

  "hero.cta2": { ar: "استكشف الأقسام", en: "Explore Categories" },
  "hero.b1.t": { ar: "شحن سريع", en: "Fast Delivery" },
  "hero.b1.s": { ar: "خلال 48 ساعة داخل مصر", en: "Within 48h across Egypt" },
  "hero.b2.t": { ar: "ضمان أصلي", en: "Genuine Warranty" },
  "hero.b2.s": { ar: "منتجات أصلية 100%", en: "100% authentic products" },
  "hero.b3.t": { ar: "الدفع عند الاستلام", en: "Cash on Delivery" },
  "hero.b3.s": { ar: "ادفع بعد ما تستلم", en: "Pay when it arrives" },

  "feat.1.t": { ar: "توصيل لكل المحافظات", en: "Nationwide Shipping" },
  "feat.1.s": { ar: "شحن سريع وآمن", en: "Fast and safe delivery" },
  "feat.2.t": { ar: "خامات بريميوم", en: "Premium Materials" },
  "feat.2.s": { ar: "اختيار دقيق لكل منتج", en: "Carefully curated picks" },
  "feat.3.t": { ar: "استبدال خلال 14 يوم", en: "14-Day Returns" },
  "feat.3.s": { ar: "بدون تعقيد", en: "No hassle, no questions" },
  "feat.4.t": { ar: "دعم على واتساب", en: "WhatsApp Support" },
  "feat.4.s": { ar: "متاح طوال اليوم", en: "Available around the clock" },

  "stats.1.n": { ar: "+12,000", en: "12,000+" },
  "stats.1.t": { ar: "عميل سعيد", en: "Happy customers" },
  "stats.2.n": { ar: "+120", en: "120+" },
  "stats.2.t": { ar: "منتج متاح", en: "Products available" },
  "stats.3.n": { ar: "24/7", en: "24/7" },
  "stats.3.t": { ar: "دعم فني", en: "Customer support" },
  "stats.4.n": { ar: "%100", en: "100%" },
  "stats.4.t": { ar: "منتجات أصلية", en: "Authentic products" },

  "cart.whatsapp": { ar: "إتمام الطلب عبر واتساب", en: "Order via WhatsApp" },
  "cart.order": { ar: "طلب جديد من صدفة", en: "New SODFA order" },
  "cart.qtyShort": { ar: "الكمية", en: "Qty" },
} satisfies Dict;

export type TKey = keyof typeof dict;

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
  pick: (ar: string, en: string) => string;
  price: (n: number) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("sodfa-lang");
    if (saved === "en" || saved === "ar") setLangState(saved);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("sodfa-lang", l);
  }, []);

  const value = useMemo<Ctx>(() => {
    const pick = (ar: string, en: string) => (lang === "ar" ? ar : en);
    return {
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      t: (key) => dict[key][lang],
      pick,
      price: (n) =>
        lang === "ar"
          ? `${n.toLocaleString("ar-EG")} ج.م`
          : `EGP ${n.toLocaleString("en-US")}`,
    };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
