"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCurtain, type CurtainInfo } from "@/lib/stores";
import { baseTheme, displayStyle, themeFor } from "@/lib/themes";
import { BrandMark } from "./BrandMark";

const tips = [
  "Drag the 360° view to walk around the car — then repaint it from the configurator.",
  "Every bid in the final two minutes extends the auction clock.",
  "Add up to three cars to Compare and the best figure in each row lights up.",
  "Download any car's spec sheet as a PDF from its page.",
  "Icons: see which famous collectors own the cars in this room.",
];

function Row({ images, dir, speed }: { images: string[]; dir: 1 | -1; speed: number }) {
  const strip = [...images, ...images];
  return (
    <motion.div className="flex gap-3" initial={{ x: dir === 1 ? "-50%" : "0%" }} animate={{ x: dir === 1 ? "0%" : "-50%" }} transition={{ duration: speed, ease: "linear" }}>
      {strip.map((src, i) => (
        <div key={i} className="relative aspect-[16/10] h-[30vh] shrink-0 overflow-hidden rounded-sm">
          <Image src={src} alt="" fill sizes="50vw" className="object-cover" />
        </div>
      ))}
    </motion.div>
  );
}

function Screen({ c, montage }: { c: CurtainInfo; montage: string[] }) {
  const th = c.slug ? themeFor(c.slug, c.color, c.label) : baseTheme;
  const [pct, setPct] = useState(0);
  const [tip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      setPct(Math.min(100, Math.round(((t - start) / 2300) ** 0.8 * 100)));
      if (t - start < 2400) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pics = montage.length ? montage : [];
  const third = Math.ceil(pics.length / 3) || 1;
  const rows = [pics.slice(0, third), pics.slice(third, third * 2), pics.slice(third * 2)].map((r) => (r.length ? r : pics));

  return (
    <motion.div
      className="fixed inset-0 z-[90] overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Montage */}
      <motion.div className="absolute inset-[-20%] flex -rotate-[8deg] flex-col justify-center gap-3" initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 3, ease: "easeOut" }}>
        {rows.map((r, i) => <Row key={i} images={r} dir={i % 2 ? -1 : 1} speed={14 + i * 3} />)}
      </motion.div>

      {/* Tint, brand glow, vignette */}
      <div className="absolute inset-0 bg-black/75" />
      <div className="absolute inset-0" style={{ background: `radial-gradient(60% 60% at 50% 50%, ${th.accent}33, transparent 70%)` }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.85))" }} />

      {/* Slanted light sweeps */}
      {[0, 0.25].map((d, i) => (
        <motion.div
          key={i}
          className="absolute -inset-y-20 w-[18vw] -skew-x-[20deg]"
          style={{ background: `linear-gradient(90deg, transparent, ${th.accent}${i ? "22" : "40"}, transparent)` }}
          initial={{ left: "-30%" }}
          animate={{ left: "130%" }}
          transition={{ duration: 1.6, delay: 0.2 + d, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
      <motion.div className="absolute left-0 top-[18%] h-[3px]" style={{ background: th.accent }} initial={{ width: 0 }} animate={{ width: "38%" }} transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} />
      <motion.div className="absolute bottom-[22%] right-0 h-[3px]" style={{ background: th.accent }} initial={{ width: 0 }} animate={{ width: "28%" }} transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }} />

      {/* Logo + name */}
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -12, filter: "blur(12px)" }}
            animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1.4, 0.36, 1] }}
          >
            <div style={{ filter: `drop-shadow(0 0 40px ${th.accent}aa)` }}>
              {c.slug ? (
                <BrandMark slug={c.slug} name={c.label} color="#ffffff" className="h-24 w-24 text-[7rem] md:h-32 md:w-32 md:text-[9rem]" />
              ) : (
                <span className="font-display text-6xl tracking-[0.4em] text-white">A</span>
              )}
            </div>
          </motion.div>
          <div className="mt-8 flex overflow-hidden text-5xl text-white md:text-7xl" style={displayStyle(th)}>
            {c.label.split("").map((ch, i) => (
              <motion.span key={i} initial={{ y: "110%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 + i * 0.035, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                {ch === " " ? " " : ch}
              </motion.span>
            ))}
          </div>
          <motion.p className="mt-4 text-[11px] uppercase tracking-[0.4em]" style={{ color: th.accent }} initial={{ opacity: 0, letterSpacing: "0.8em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ delay: 0.9, duration: 0.9 }}>
            {c.slug ? c.motto : "Returning to the collector's showroom"}
          </motion.p>
        </div>
      </div>

      {/* Loading bar + tip */}
      <div className="absolute inset-x-6 bottom-8 flex flex-col gap-4 md:inset-x-12 md:flex-row md:items-end md:justify-between">
        <div className="w-full max-w-md">
          <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.35em] text-white/70">
            <span>Loading {c.slug ? `${c.label} world` : "showroom"}</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-[3px] bg-white/15">
            <div className="h-full transition-[width] duration-100" style={{ width: `${pct}%`, background: th.accent }} />
          </div>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-white/60 md:text-right">
          <span className="mr-2 uppercase tracking-[0.25em]" style={{ color: th.accent }}>Tip</span>
          {tip}
        </p>
      </div>
    </motion.div>
  );
}

/** GTA-style loading screen played when entering or leaving a brand world. */
export function WorldLoader({ montage }: { montage: string[] }) {
  const curtain = useCurtain((s) => s.curtain);
  return <AnimatePresence>{curtain && <Screen key={curtain.key} c={curtain} montage={montage} />}</AnimatePresence>;
}
