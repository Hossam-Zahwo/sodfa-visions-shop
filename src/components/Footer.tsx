import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useLang } from "@/lib/i18n";
import { categories } from "@/data/catalog";

export function Footer() {
  const { t, pick } = useLang();

  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm text-subtle">{t("footer.tag")}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            {categories.slice(0, 6).map((c) => (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {pick(c.name.ar, c.name.en)}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-10 text-xs text-subtle">
          © {new Date().getFullYear()} SODFA — {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
