import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  slug?: string;
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

const DURATION = 6500;

export function HeroSlider() {
  const { t, dir } = useLang();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), DURATION);
    return () => clearInterval(id);
  }, []);

  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden sm:h-[86vh]">
      {slides.map((s, i) => (
        <div
          key={s.to}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1600ms] ease-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={i !== index}
        >
          <img
            src={s.image}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            className="h-full w-full object-cover"
            style={
              i === index
                ? { animation: `sodfa-ken-burns ${DURATION + 2000}ms ease-out both` }
                : undefined
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-e from-background/90 to-transparent" />
        </div>
      ))}

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 sm:pb-24">
        <div key={index} className="fade-up max-w-xl">
          <span className="text-gradient text-xs font-semibold tracking-[0.28em] uppercase">
            {t(slides[index].label)}
          </span>
          <h1 className="mt-4 text-4xl leading-[1.05] font-bold sm:text-6xl lg:text-7xl">
            {t(slides[index].title)}
          </h1>
          <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            {t(slides[index].sub)}
          </p>
          <Link
            to="/category/$slug"
            params={{ slug: slides[index].to }}
            className="bg-sodfa mt-8 inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold text-primary-foreground transition-all hover:glow-strong"
          >
            {t("hero.cta")}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>

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
    </section>
  );
}
