import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { brands, compatibleWith } from "@/data/catalog";
import { ProductCard } from "./ProductCard";

export function FindYourPhone() {
  const { t } = useLang();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");

  const models = brands.find((b) => b.name === brand)?.models ?? [];
  const results = model ? compatibleWith(model).slice(0, 4) : [];

  const selectClass =
    "h-12 w-full rounded-xl border border-border bg-input px-4 text-sm outline-none focus:border-primary disabled:opacity-40";

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10">
        <div
          className="bg-sodfa pointer-events-none absolute -top-24 -end-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <h2 className="text-xl font-bold sm:text-3xl">{t("find.title")}</h2>
          <p className="mt-1 text-sm text-subtle">{t("find.sub")}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs text-subtle">{t("find.brand")}</span>
              <select
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setModel("");
                }}
                className={selectClass}
              >
                <option value="">{t("find.choose")}</option>
                {brands.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs text-subtle">{t("find.model")}</span>
              <select
                value={model}
                disabled={!brand}
                onChange={(e) => setModel(e.target.value)}
                className={selectClass}
              >
                <option value="">{t("find.choose")}</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-8">
            {results.length === 0 ? (
              <p className="text-sm text-subtle">{t("find.empty")}</p>
            ) : (
              <>
                <p className="mb-4 text-xs tracking-widest text-subtle uppercase">
                  {t("find.results")} — {model}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {results.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
