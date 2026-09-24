export type ProductAutomationSuggestion = {
  name_ar?: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  variant_type?: string;
  variant_value?: string;
  color?: string;
  category_id?: string;
};

const COLOR_MAP: Array<[RegExp, string, string]> = [
  [/\b(black|blk)\b|أسود|اسود/i, "أسود", "Black"],
  [/\b(white|wht)\b|أبيض|ابيض/i, "أبيض", "White"],
  [/\b(blue|blu)\b|أزرق|ازرق/i, "أزرق", "Blue"],
  [/\b(red)\b|أحمر|احمر/i, "أحمر", "Red"],
  [/\b(green)\b|أخضر|اخضر/i, "أخضر", "Green"],
  [/\b(purple|violet)\b|بنفسجي/i, "بنفسجي", "Purple"],
  [/\b(clear|transparent)\b|شفاف/i, "شفاف", "Clear"],
  [/\b(pink)\b|وردي/i, "وردي", "Pink"],
];

export function suggestFromText(text: string): ProductAutomationSuggestion {
  const value = text.trim();
  if (!value) return {};
  const color = COLOR_MAP.find(([re]) => re.test(value));
  const model = value.match(/(?:iPhone|iphone)\s*(\d{1,2}(?:\s*(?:Pro\s*Max|Pro|Plus|Mini))?)/i)?.[0] ||
    value.match(/(S\d{1,2}(?:\s*Ultra|\s*Plus)?)/i)?.[0] || "";
  const looksLikeCase = /case|cover|جراب|كفر/i.test(value);
  const looksLikeCharger = /charger|شاحن/i.test(value);
  const looksLikeCable = /cable|كابل|وصلة/i.test(value);

  let nameEn = value;
  if (!/[a-z]/i.test(value)) {
    if (looksLikeCase) nameEn = model ? `${model} Phone Case` : "Phone Case";
    else if (looksLikeCharger) nameEn = "Fast Charger";
    else if (looksLikeCable) nameEn = "Charging Cable";
  }

  const features: string[] = [];
  if (/magsafe|ماج سيف/i.test(value)) features.push("MagSafe");
  if (/shock|صدمات|مقاوم للصدمات/i.test(value)) features.push("Shock Protection");
  if (/wireless|لاسلكي/i.test(value)) features.push("Wireless Charging");
  if (/camera|كاميرا/i.test(value)) features.push("Camera Protection");
  const featureText = features.length ? `\nالمميزات: ${features.join("، ")}` : "";

  return {
    name_en: nameEn,
    description_ar: `${value}${model ? `\nمتوافق مع ${model}.` : ""}${color ? `\nاللون: ${color[1]}.` : ""}${featureText}`,
    description_en: `${nameEn}${model ? `\nCompatible with ${model}.` : ""}${color ? `\nColor: ${color[2]}.` : ""}${features.length ? `\nFeatures: ${features.join(", ")}.` : ""}`,
    variant_type: color ? "لون" : model ? "موديل" : undefined,
    variant_value: color ? color[1] : model || undefined,
    color: color?.[1],
  };
}

export function buildSkuPreview(nameEn: string, variantValue?: string) {
  const base = nameEn.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "PRODUCT";
  const suffix = variantValue?.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 12);
  return `SODFA-${base}${suffix ? `-${suffix}` : ""}`;
}
