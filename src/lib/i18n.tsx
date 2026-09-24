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

  "hero.1.label": { ar: "جراب يليق بموبايلك", en: "Protection, made better" },
  "hero.1.title": { ar: "حماية شيك… وشكل يليق بموبايلك", en: "Protection that looks as good as it feels" },
  "hero.1.sub": {
    ar: "اختار الشكل اللي يعجبك، وخد حماية عملية بخامة محترمة تناسب استخدامك اليومي من غير ما شكل الموبايل يضيع.",
    en: "A clean finish, a comfortable fit, and everyday protection without losing the look of your phone.",
  },
  "hero.2.label": { ar: "شحن يعتمد عليه", en: "Power you can rely on" },
  "hero.2.title": { ar: "شاحن وكابل يواكبوا يومك", en: "Charging made for everyday life" },
  "hero.2.sub": {
    ar: "من البيت للشغل ولحد العربية، اختار شحن عملي وسهل تعتمد عليه كل يوم من غير وجع دماغ.",
    en: "Reliable everyday charging for home, work, and the road.",
  },
  "hero.3.label": { ar: "خلّي الشحن أسهل", en: "Less cable, less hassle" },
  "hero.3.title": { ar: "شحن لاسلكي أسهل… ومكانه دايمًا جاهز", en: "Just drop and charge" },
  "hero.3.sub": {
    ar: "حط موبايلك، اشحنه، وكمل يومك. حلول بسيطة تخلي مكانك أرتب واستخدامك أسهل.",
    en: "Simple wireless charging that keeps your setup clean and your routine easier.",
  },
  "hero.cta": { ar: "تسوّق الآن", en: "Shop Now" },

  "home.categories": { ar: "تسوّق حسب القسم", en: "Shop by Category" },
  "home.categories.sub": { ar: "كل ما يحتاجه هاتفك", en: "Everything your phone needs" },
  "home.featured": { ar: "منتجات مختارة", en: "Featured Products" },
  "home.best": { ar: "الأكثر مبيعًا", en: "Best Sellers" },
  "home.new": { ar: "وصل حديثًا", en: "New Arrivals" },
  "home.viewAll": { ar: "عرض الكل", en: "View all" },

  "find.title": { ar: "ابحث بنوع تليفونك", en: "Find by Your Phone" },
  "find.sub": {
    ar: "اكتب نوع وموديل تليفونك، وهنطلع لك المنتجات المتوافقة من الكتالوج.",
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
  "cart.free": { ar: "يُحسب حسب المحافظة", en: "Calculated by governorate" },
  "cart.total": { ar: "الإجمالي", en: "Total" },
  "cart.checkout": { ar: "إتمام الطلب", en: "Checkout" },
  "cart.soon": { ar: "أكمل بياناتك لإرسال الطلب على واتساب", en: "Complete your details to send the order on WhatsApp" },
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
  "hero.b1.t": { ar: "توصيل لحد بابك", en: "Doorstep delivery" },
  "hero.b1.s": { ar: "بنوصّل لمعظم المحافظات", en: "Delivery across Egypt" },
  "hero.b2.t": { ar: "اختيارات متراجعة", en: "Carefully selected" },
  "hero.b2.s": { ar: "منتجات بنختارها بعناية", en: "Products selected with care" },
  "hero.b3.t": { ar: "دفع عند الاستلام", en: "Cash on delivery" },
  "hero.b3.s": { ar: "ادفع لما طلبك يوصلك", en: "Pay when your order arrives" },

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
