import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, FolderOpen, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { listCategories, type DbCategory } from "@/lib/db";

export function CategoryGrid() {
  const { pick } = useLang();
  const [items, setItems] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await listCategories();
        if (alive) setItems(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "تعذر تحميل الأقسام");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-2xl border border-border bg-card">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        تعذر تحميل الأقسام حاليًا. حاول تحديث الصفحة.
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-subtle">
        لا توجد أقسام مضافة حاليًا.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((category) => (
        <Link
          key={category.id}
          to="/category/$slug"
          params={{ slug: category.slug }}
          className="group flex min-h-32 items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <FolderOpen size={24} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-bold sm:text-lg">
              {pick(category.name_ar, category.name_en)}
            </span>
            <span className="mt-1 block truncate text-xs text-subtle">{category.slug}</span>
          </span>
          <ArrowLeft size={18} className="shrink-0 text-subtle transition-transform group-hover:-translate-x-1" />
        </Link>
      ))}
    </div>
  );
}
