import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BadgeCheck, Truck, Wallet } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { useLang, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Slide = { image: string; label: TKey; title: TKey; sub: TKey; to: string };

const slides: Slide[] = [
  { image: hero1, label: "hero.1.label", title: "hero.1.title", sub: "hero.1.sub", to: "cases" },
  { image: hero2, label: "hero.2.label", title: "hero.2.title", sub: "hero.2.sub", to: "chargers" },
  { image: hero3, label: "hero.3.label", title: "hero.3.title", sub: "hero.3.sub", to: "wireless-charging" },
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
    <section
      className="relative isolate min-h-[680px] overflow-hidden border-b border-border sm:min-h-[760px] lg:min-h-[calc(100svh-4.5rem)]"
    >
      <div className="absolute inset-0 -z-20 bg-transparent">
        {slides.map((s, i) => (
          <img key={s.to} src={s.image} alt="" aria-hidden={i !== index} className={cn("absolute inset-0 h-full w-full object-cover object-center transition-[opacity,transform] duration-[1400ms] ease-out", i === index ? "scale-100 opacity-100" : "scale-[1.04] opacity-0")} />
        ))}
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,10,20,.96)_0%,rgba(5,10,20,.78)_38%,rgba(5,10,20,.28)_70%,rgba(5,10,20,.62)_100%)]" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_45%,rgba(142,42,168,.32),transparent_35%)]" aria-hidden />
      <div className="hero-ambient pointer-events-none absolute inset-0 -z-10" aria-hidden />

      <div className="mx-auto flex min-h-[680px] w-full max-w-[1600px] items-center px-5 py-14 sm:min-h-[760px] sm:px-8 sm:py-16 lg:min-h-[calc(100svh-4.5rem)] lg:px-12 lg:py-20 xl:px-16">
        <div key={index} className="fade-up w-full max-w-3xl text-pretty">
          <span className="text-gradient text-[11px] font-semibold tracking-[0.3em] uppercase sm:text-xs">{t(slide.label)}</span>
          <h1 className="mt-5 max-w-4xl text-[2.35rem] leading-[1.25] font-black tracking-[-0.025em] sm:mt-6 sm:text-5xl sm:leading-[1.22] lg:text-7xl lg:leading-[1.18]">{t(slide.title)}</h1>
          <p className="mt-7 max-w-3xl text-[15px] leading-[2.15] text-white/75 sm:mt-8 sm:text-lg sm:leading-[2.05]">{t(slide.sub)}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3 sm:mt-10">
            <Link to="/category/$slug" params={{ slug: slide.to }} className="bg-sodfa inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold text-primary-foreground transition-all hover:glow-strong">{t("hero.cta")}<Arrow className="h-4 w-4"/></Link>
            <Link to="/categories" className="inline-flex h-12 items-center rounded-full border border-white/30 bg-white/5 px-7 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10">{t("hero.cta2")}</Link>
          </div>

          <ul className="mt-11 grid gap-6 sm:grid-cols-3 sm:gap-5">
            {benefits.map((b) => <li key={b.t} className="flex min-w-0 items-start gap-3"><span className="bg-sodfa grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary-foreground"><b.icon className="h-4 w-4"/></span><span><span className="block text-sm font-medium">{t(b.t)}</span><span className="block text-xs text-white/50">{t(b.s)}</span></span></li>)}
          </ul>

          <div className="mt-11 flex items-center gap-2">
            {slides.map((s, i) => <button key={s.to} type="button" onClick={() => setIndex(i)} aria-label={`slide ${i + 1}`} className={cn("h-1 rounded-full transition-all duration-500", i === index ? "bg-white w-12" : "w-6 bg-white/30 hover:bg-white/60")}/>)}
          </div>
        </div>
      </div>
    </section>
  );
}
