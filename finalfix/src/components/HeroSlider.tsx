import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BadgeCheck, Truck, Wallet } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { useLang, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Slide = {
  image: string;
  label: TKey;
  title: TKey;
  sub: TKey;
  to: string;
};

const slides: Slide[] = [
  { image: hero1, label: "hero.1.label", title: "hero.1.title", sub: "hero.1.sub", to: "cases" },
  {
    image: hero2,
    label: "hero.2.label",
    title: "hero.2.title",
    sub: "hero.2.sub",
    to: "chargers",
  },
  {
    image: hero3,
    label: "hero.3.label",
    title: "hero.3.title",
    sub: "hero.3.sub",
    to: "wireless-charging",
  },
];

const benefits = [
  { icon: Truck, t: "hero.b1.t" as TKey, s: "hero.b1.s" as TKey },
  { icon: BadgeCheck, t: "hero.b2.t" as TKey, s: "hero.b2.s" as TKey },
  { icon: Wallet, t: "hero.b3.t" as TKey, s: "hero.b3.s" as TKey },
];

const DURATION = 6500;

export function HeroSlider() {
  const { t, dir } = useLang();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), DURATION);
    return () => clearInterval(id);
  }, []);

  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const slide = slides[index];

  return (
    <section className="relative overflow-hidden bg-background">
      {/* ambient purple lighting */}
      <div className="hero-ambient pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pt-10 pb-14 sm:px-6 sm:pt-16 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6 lg:pt-24 lg:pb-28">
        {/* content */}
        <div key={index} className="fade-up order-2 max-w-xl lg:order-1">
          <span className="text-gradient text-[11px] font-semibold tracking-[0.3em] uppercase sm:text-xs">
            {t(slide.label)}
          </span>
          <h1 className="mt-4 text-[2.1rem] leading-[1.1] font-bold sm:text-5xl lg:text-6xl">
            {t(slide.title)}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t(slide.sub)}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/category/$slug"
              params={{ slug: slide.to }}
              className="bg-sodfa inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold text-primary-foreground transition-all hover:glow-strong"
            >
              {t("hero.cta")}
              <Arrow className="h-4 w-4" />
            </Link>
            <Link
              to="/categories"
              className="inline-flex h-12 items-center rounded-full border border-primary/50 bg-transparent px-7 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/10"
            >
              {t("hero.cta2")}
            </Link>
          </div>

          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {benefits.map((b) => (
              <li key={b.t} className="flex min-w-0 items-start gap-3">
                <span className="bg-sodfa grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary-foreground">
                  <b.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{t(b.t)}</span>
                  <span className="block text-xs text-subtle">{t(b.s)}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.to}
                onClick={() => setIndex(i)}
                aria-label={`slide ${i + 1}`}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i === index ? "bg-sodfa w-12" : "w-6 bg-border hover:bg-subtle",
                )}
              />
            ))}
          </div>
        </div>

        {/* product visual — blended, no card */}
        <div className="relative order-1 h-[46vh] min-h-[280px] w-full sm:h-[52vh] lg:order-2 lg:h-[600px]">
          <div
            className="bg-sodfa pointer-events-none absolute inset-8 rounded-full opacity-25 blur-[90px]"
            aria-hidden
          />
          {slides.map((s, i) => (
            <img
              key={s.to}
              src={s.image}
              alt=""
              aria-hidden={i !== index}
              loading={i === 0 ? "eager" : "lazy"}
              className={cn(
                "hero-blend absolute inset-0 h-full w-full object-contain transition-opacity duration-[1400ms] ease-out",
                i === index ? "opacity-100" : "opacity-0",
              )}
              style={
                i === index
                  ? { animation: `sodfa-float ${DURATION + 2000}ms ease-out both` }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
