import { Headphones, RefreshCcw, Sparkles, Truck } from "lucide-react";
import { useLang, type TKey } from "@/lib/i18n";

const items = [
  { icon: Truck, t: "feat.1.t" as TKey, s: "feat.1.s" as TKey },
  { icon: Sparkles, t: "feat.2.t" as TKey, s: "feat.2.s" as TKey },
  { icon: RefreshCcw, t: "feat.3.t" as TKey, s: "feat.3.s" as TKey },
  { icon: Headphones, t: "feat.4.t" as TKey, s: "feat.4.s" as TKey },
];

export function FeatureStrip() {
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-input">
        <div
          className="bg-sodfa pointer-events-none absolute -top-28 start-1/3 h-52 w-52 rounded-full opacity-15 blur-3xl"
          aria-hidden
        />
        <div className="relative grid grid-cols-2 divide-border sm:divide-x lg:grid-cols-4 rtl:sm:divide-x-reverse">
          {items.map((it) => (
            <div key={it.t} className="flex min-w-0 items-start gap-3 p-5 sm:p-6">
              <span className="bg-sodfa grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary-foreground">
                <it.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t(it.t)}</span>
                <span className="mt-0.5 block text-xs text-subtle">{t(it.s)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
