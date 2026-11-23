"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import type { CarView } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const ease = [0.22, 1, 0.36, 1] as const;
const SLIDE_MS = 6500;

export interface HeroVideo {
  src: string;
  src720?: string | null;
  poster?: string | null;
  title: string;
  car?: string | null;
}

/** Full-bleed hero: cinematic video reel (home) or real-photo slides (brand worlds). Type kept modest so the cars stay the subject. */
export function Hero({ cars, videos = [], cutEveryMs = 0, eyebrow, title, cta = { href: "/cars", label: "Explore the collection" } }: { cars: CarView[]; videos?: HeroVideo[]; cutEveryMs?: number; eyebrow: string; title: [string, string]; cta?: { href: string; label: string } }) {
  const slides = cars.filter((c) => c.heroImage);
  const [i, setI] = useState(0);
  const [v, setV] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 160]);
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const [videoAllowed, setVideoAllowed] = useState(false);
  const [hiRes, setHiRes] = useState(false);
  // Decide on the client: skip video for reduced-motion users or ?video=off, and only use 1080p on wide screens.
  useEffect(() => {
    const off = new URLSearchParams(window.location.search).get("video") === "off" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setVideoAllowed(!off);
    setHiRes(window.innerWidth * window.devicePixelRatio >= 2400);
  }, []);
  const useVideo = videos.length > 0 && videoAllowed && failed.size < videos.length;
  const nextClip = () => setV((n) => {
    for (let k = 1; k <= videos.length; k++) {
      const cand = (n + k) % videos.length;
      if (!failed.has(cand)) return cand;
    }
    return n;
  });

  // Fast-cut reel: hard cut to the next clip a few seconds after the current one actually starts
  // playing, so a slow-loading clip is never cut before it's been seen.
  const [playing, setPlaying] = useState(-1);
  useEffect(() => {
    if (!useVideo || !cutEveryMs || videos.length < 2 || playing !== v) return;
    const t = setTimeout(nextClip, cutEveryMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, playing, useVideo, cutEveryMs, videos.length]);
  // Safety net: if a clip never starts within 10 s, move on.
  useEffect(() => {
    if (!useVideo || videos.length < 2 || playing === v) return;
    const t = setTimeout(nextClip, 10000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, playing, useVideo, videos.length]);

  useEffect(() => {
    if (useVideo || paused || slides.length < 2) return;
    const t = setTimeout(() => setI((n) => (n + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, paused, slides.length, useVideo]);

  const car = slides[i];
  const video = videos[v];

  return (
    <section className="relative h-[100svh] min-h-[560px] overflow-hidden bg-black" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <motion.div className="absolute inset-0" style={useVideo ? undefined : { y }}>
        {useVideo ? (
          // One plain <video>, no transforms or crossfades on it: some GPU drivers crash when a
          // hardware-decoded video sits inside animated/transformed layers.
          <video
            key={video.src}
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={hiRes ? video.src : (video.src720 ?? video.src)}
            poster={video.poster ?? undefined}
            autoPlay
            muted
            playsInline
            preload="auto"
            onPlaying={() => setPlaying(v)}
            disablePictureInPicture
            onEnded={nextClip}
            onError={() => {
              setFailed((s) => new Set(s).add(v));
              nextClip();
            }}
            loop={videos.length === 1}
          />
        ) : (
          car && (
            <AnimatePresence initial={false}>
              <motion.div key={car.slug} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease }}>
                <Image src={car.heroImage!} alt={`${car.brand.name} ${car.model}`} fill priority sizes="100vw" className="animate-kenburns object-cover" />
              </motion.div>
            </AnimatePresence>
          )
        )}
      </motion.div>
      {/* Quick white flash on each cut — a separate layer, never a transform on the video itself. */}
      {useVideo && cutEveryMs > 0 && <div key={`flash-${v}`} className="pointer-events-none absolute inset-0 animate-[cutflash_0.45s_ease-out_forwards] bg-white" />}
      {useVideo && video?.car && (
        <p key={`car-${v}`} className="pointer-events-none absolute right-5 top-24 z-10 animate-[cutlabel_0.6s_ease-out] text-[10px] uppercase tracking-[0.35em] text-white/80 md:right-10">
          {video.car}
        </p>
      )}
      {/* Gentle tints: just enough for legibility at the edges, the middle stays clean. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="relative mx-auto flex h-full max-w-[1480px] flex-col justify-end px-5 pb-10 md:px-10">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>{eyebrow}</motion.p>
            <h1 className="mt-3 font-display text-4xl leading-[1.02] md:text-6xl">
              {title.map((line, n) => (
                <span key={line} className="block overflow-hidden pb-[0.06em]">
                  <motion.span className={`block ${n === 1 ? "text-gilded" : ""}`} initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.3 + n * 0.12, duration: 1.1, ease }}>
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            {!useVideo && car && (
              <AnimatePresence mode="wait">
                <motion.div key={car.slug} className="mt-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease }}>
                  <p className="text-sm text-ivory/85">
                    <span className="text-gold">{car.brand.name}</span> {car.model} · {car.specs.powerHp} hp · from {formatPrice(car.priceFrom, { compact: true })}
                  </p>
                </motion.div>
              </AnimatePresence>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {useVideo ? (
                <>
                  <Link href={cta.href} className="btn btn-primary">{cta.label}</Link>
                  <Link href="/auctions" className="btn btn-ghost !border-white/30 !text-white">Live auctions</Link>
                </>
              ) : (
                car && (
                  <>
                    <Link href={`/cars/${car.slug}`} className="btn btn-primary">View this car</Link>
                    {car.sketchfabUid && <Link href={`/cars/${car.slug}?view=360`} className="btn btn-ghost !border-white/30 !text-white">360° view</Link>}
                  </>
                )
              )}
            </div>
          </div>

          {!useVideo && slides.length > 1 && (
            <div className="flex gap-2 md:w-[380px]">
              {slides.map((s, n) => (
                <button key={s.slug} onClick={() => setI(n)} className="group flex-1 text-left" aria-label={`Show ${s.model}`}>
                  <span className="relative block h-[2px] overflow-hidden bg-white/20">
                    {n === i ? (
                      <motion.span key={`${s.slug}-${paused}`} className="absolute inset-y-0 left-0 bg-gold" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: paused ? 0.3 : SLIDE_MS / 1000, ease: "linear" }} />
                    ) : (
                      n < i && <span className="absolute inset-0 bg-white/50" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
          {useVideo && videos.length > 1 && (
            <div className="flex gap-2">
              {videos.map((vid, n) => (
                <button key={vid.src} onClick={() => setV(n)} className={`h-[3px] w-10 transition ${n === v ? "bg-gold" : "bg-white/30 hover:bg-white/60"}`} aria-label={vid.title} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
