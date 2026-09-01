import { useLang, type TKey } from "@/lib/i18n";

const stats: Array<{ n: TKey; t: TKey }> = [
  { n: "stats.1.n", t: "stats.1.t" },
  { n: "stats.2.n", t: "stats.2.t" },
  { n: "stats.3.n", t: "stats.3.t" },
  { n: "stats.4.n", t: "stats.4.t" },
];

export function Stats() {
  const { t } = useLang();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-4 py-8 sm:px-10 sm:py-10">
        <div
          className="bg-sodfa pointer-events-none absolute -bottom-32 end-0 h-64 w-64 rounded-full opacity-15 blur-3xl"
          aria-hidden
        />
        <div className="relative grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.n} className="min-w-0 text-center">
              <div className="text-gradient text-2xl font-bold sm:text-4xl">{t(s.n)}</div>
              <div className="mt-1 text-xs text-subtle sm:text-sm">{t(s.t)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
