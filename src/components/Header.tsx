import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { Logo } from "./Logo";
import { useLang } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-border bg-input p-1 text-xs",
        className,
      )}
    >
      <button
        onClick={() => setLang("ar")}
        className={cn(
          "rounded-full px-3 py-1 transition-colors",
          lang === "ar" ? "bg-sodfa text-primary-foreground" : "text-subtle hover:text-foreground",
        )}
      >
        العربية
      </button>
      <button
        onClick={() => setLang("en")}
        className={cn(
          "rounded-full px-3 py-1 transition-colors",
          lang === "en" ? "bg-sodfa text-primary-foreground" : "text-subtle hover:text-foreground",
        )}
      >
        English
      </button>
    </div>
  );
}

export function Header() {
  const { t } = useLang();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate({ to: "/products", search: { q: q || undefined, cat: undefined } });
  };

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/categories", label: t("nav.categories") },
    { to: "/products", label: t("nav.products") },
    { to: "/offers", label: t("nav.offers") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden min-w-0 items-center justify-center gap-7 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label={t("nav.search")}
            onClick={() => setSearchOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            to="/cart"
            aria-label={t("nav.cart")}
            className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="bg-sodfa absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          <LangSwitch className="ms-2 hidden lg:flex" />

          <button
            aria-label={t("nav.menu")}
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-background/95 px-4 py-3 sm:px-6">
          <form onSubmit={submit} className="mx-auto flex max-w-3xl items-center gap-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("shop.search")}
              className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm outline-none placeholder:text-subtle focus:border-primary"
            />
            <button
              type="submit"
              className="bg-sodfa h-11 shrink-0 rounded-xl px-5 text-sm font-medium text-primary-foreground"
            >
              {t("nav.search")}
            </button>
          </form>
        </div>
      )}

      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="border-b border-border py-3 text-base text-muted-foreground last:border-0"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <LangSwitch className="mt-4 w-fit" />
        </div>
      )}
    </header>
  );
}
