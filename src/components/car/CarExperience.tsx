"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CarView, ColorView } from "@/lib/types";
import { bodyTypeLabel, statusLabel } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { WishlistButton } from "@/components/site/WishlistButton";
import { CompareButton } from "@/components/compare/CompareTray";
import { toast } from "@/lib/stores";
import { PriceChart } from "./PriceChart";
import { InquiryDialog } from "./InquiryDialog";
import { Viewer360 } from "./Viewer360";
import { RazorpayButton } from "@/components/payments/RazorpayButton";

type Initial = { variant?: string; color?: string; interior?: string; caliper?: string; view?: string };
type Tab = "photos" | "360";

const pick = (list: ColorView[], id?: string) => list.find((c) => c.id === id) ?? list[0];
const delta = (n: number) => (n > 0 ? `+${formatPrice(n)}` : n < 0 ? `−${formatPrice(-n)}` : "Included");

function Gallery({ car }: { car: CarView }) {
  const [i, setI] = useState(0);
  const photos = car.photos;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((n) => (n + 1) % photos.length);
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length]);
  if (!photos.length) return <div className="grid h-full place-items-center font-display text-5xl text-white/10">{car.brand.name}</div>;
  const p = photos[i];
  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={p.url}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          drag={photos.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) setI((n) => (n + 1) % photos.length);
            if (info.offset.x > 60) setI((n) => (n - 1 + photos.length) % photos.length);
          }}
        >
          {/* Blurred fill behind, whole photo in front — nothing gets cropped away. */}
          <Image src={p.url} alt="" fill sizes="30vw" className="pointer-events-none scale-110 object-cover opacity-40 blur-2xl" />
          <Image src={p.url} alt={`${car.brand.name} ${car.model}`} fill priority sizes="(min-width:1024px) 70vw, 100vw" className="pointer-events-none object-contain" />
        </motion.div>
      </AnimatePresence>
      {photos.length > 1 && (
        <>
          <button onClick={() => setI((n) => (n - 1 + photos.length) % photos.length)} className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 backdrop-blur hover:border-gold" aria-label="Previous photo">←</button>
          <button onClick={() => setI((n) => (n + 1) % photos.length)} className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 backdrop-blur hover:border-gold" aria-label="Next photo">→</button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {photos.map((ph, n) => (
              <button key={ph.url} onClick={() => setI(n)} className={`relative h-12 w-20 overflow-hidden border transition ${n === i ? "border-gold" : "border-white/20 opacity-60 hover:opacity-100"}`} aria-label={`Photo ${n + 1}`}>
                <Image src={ph.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
      {p.credit && <p className="absolute bottom-2 right-3 max-w-[60%] truncate text-[10px] text-white/50">Photo: {p.credit.split(" · http")[0]}</p>}
    </div>
  );
}

export function CarExperience({ car, initial, paymentsEnabled = false }: { car: CarView; initial: Initial; paymentsEnabled?: boolean }) {
  const groups = useMemo(
    () => ({
      exterior: car.colors.filter((c) => c.kind === "EXTERIOR"),
      interior: car.colors.filter((c) => c.kind === "INTERIOR"),
      caliper: car.colors.filter((c) => c.kind === "CALIPER"),
    }),
    [car.colors],
  );
  const [variant, setVariant] = useState(car.variants.find((v) => v.id === initial.variant) ?? car.variants[0]);
  const [ext, setExt] = useState(() => pick(groups.exterior, initial.color));
  const [int, setInt] = useState(() => pick(groups.interior, initial.interior));
  const [cal, setCal] = useState(() => pick(groups.caliper, initial.caliper));
  const [tab, setTab] = useState<Tab>(initial.view === "360" && car.sketchfabUid ? "360" : "photos");
  const [paintable, setPaintable] = useState<boolean | null>(null);
  const [inquiry, setInquiry] = useState(false);
  const name = `${car.brand.name} ${car.model}`;

  const specs = {
    ...car.specs,
    powerHp: variant?.powerHp ?? car.specs.powerHp,
    torqueNm: variant?.torqueNm ?? car.specs.torqueNm,
    zeroToHundred: variant?.zeroToHundred ?? car.specs.zeroToHundred,
    topSpeedKmh: variant?.topSpeedKmh ?? car.specs.topSpeedKmh,
  };
  const total = car.priceFrom + (variant?.priceDelta ?? 0) + (ext?.priceDelta ?? 0) + (int?.priceDelta ?? 0) + (cal?.priceDelta ?? 0);
  const summary = [variant?.name, ext?.name, int && `${int.name} interior`, cal && `${cal.name} calipers`].filter(Boolean).join(" · ");

  useEffect(() => {
    const qs = new URLSearchParams({ variant: variant?.id ?? "", color: ext?.id ?? "", interior: int?.id ?? "", caliper: cal?.id ?? "", ...(tab === "360" ? { view: "360" } : {}) });
    window.history.replaceState(null, "", `?${qs}`);
  }, [variant, ext, int, cal, tab]);

  const chooseExterior = (c: ColorView) => {
    setExt(c);
    if (tab === "photos" && car.sketchfabUid) toast(`${c.name} selected — open the 360° view to see it on the car`, "info");
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: name, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast("Link to this configuration copied", "success");
      }
    } catch {}
  };

  const swatches = (list: ColorView[], value: ColorView | undefined, set: (c: ColorView) => void, title: string, note?: React.ReactNode) => (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">{title}</p>
        <p className="truncate text-xs text-mist">{value?.name} · <span className="text-ivory/70">{delta(value?.priceDelta ?? 0)}</span></p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {list.map((c) => (
          <button
            key={c.id}
            onClick={() => set(c)}
            title={`${c.name}${c.finish !== "GLOSS" ? ` (${c.finish.toLowerCase()})` : ""}`}
            aria-label={c.name}
            aria-pressed={c.id === value?.id}
            className={`h-10 w-10 rounded-full border transition duration-300 ${c.id === value?.id ? "scale-110 border-gold ring-2 ring-gold/30" : "border-white/20 hover:scale-105"}`}
            style={{ background: c.finish === "MATTE" ? c.hex : `radial-gradient(circle at 30% 30%, #ffffff55, ${c.hex} 45%, #00000088)` }}
          />
        ))}
      </div>
      {note}
    </div>
  );

  return (
    <>
      <section className="grid pt-[72px] lg:h-[100svh] lg:grid-cols-[1fr_430px]">
        <div className="flex h-[70svh] flex-col bg-ink lg:h-full">
          <div className="relative min-h-0 flex-1" data-lenis-prevent>
            {tab === "360" && car.sketchfabUid ? (
              <Viewer360 uid={car.sketchfabUid} title={name} paint={ext?.hex} paintMaterials={car.sketchfabPaint} credit={car.sketchfabCredit} onPaintSupport={setPaintable} />
            ) : (
              <Gallery car={car} />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] bg-onyx px-4 py-3 md:px-6">
            <div className="flex overflow-hidden border border-white/15" style={{ borderRadius: "var(--radius)" }}>
              <button onClick={() => setTab("photos")} className={`px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] transition ${tab === "photos" ? "bg-gold text-ink" : "text-ivory/75 hover:text-ivory"}`}>Photos</button>
              <button onClick={() => car.sketchfabUid ? setTab("360") : toast("A 360° model isn't available for this car yet", "info")} className={`px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] transition ${tab === "360" ? "bg-gold text-ink" : car.sketchfabUid ? "text-ivory/75 hover:text-ivory" : "text-ivory/30"}`}>360° view</button>
            </div>
            {car.configuratorUrl && (
              <a href={car.configuratorUrl} target="_blank" rel="noopener noreferrer" className="border border-white/15 px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] text-ivory/80 transition hover:border-gold hover:text-gold" style={{ borderRadius: "var(--radius)" }}>
                Official configurator ↗
              </a>
            )}
            <span className="ml-auto hidden text-[10px] uppercase tracking-[0.22em] text-mist md:inline">
              {tab === "360" ? "Drag to orbit · scroll to zoom · double-click to focus" : "Swipe or use ← → keys"}
            </span>
          </div>
        </div>

        <aside data-lenis-prevent className="flex flex-col border-l border-white/5 bg-onyx lg:overflow-y-auto">
          <div className="space-y-9 p-6 md:p-8">
            <div>
              <p className="eyebrow">{car.brand.name} · {car.year} · {bodyTypeLabel[car.bodyType]}</p>
              <h1 className="mt-3 font-display text-4xl leading-none md:text-5xl">{car.model}</h1>
              <p className="mt-3 text-sm text-mist">{car.tagline}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className={`border px-3 py-1 text-[9px] uppercase tracking-[0.25em] ${car.status === "AVAILABLE" ? "border-emerald-300/40 text-emerald-300/90" : "border-gold/50 text-gold"}`}>{statusLabel[car.status]}</span>
              <div className="flex gap-2">
                <CompareButton item={{ slug: car.slug, name, image: car.heroImage }} />
                <WishlistButton slug={car.slug} name={name} />
              </div>
            </div>

            {car.variants.length > 1 && (
              <div>
                <p className="eyebrow">Model</p>
                <div className="mt-4 space-y-2">
                  {car.variants.map((v) => (
                    <button key={v.id} onClick={() => setVariant(v)} className={`flex w-full items-center justify-between border px-4 py-3.5 text-left transition ${v.id === variant?.id ? "border-gold bg-gold/[0.06]" : "border-white/10 hover:border-white/30"}`} style={{ borderRadius: "var(--radius)" }}>
                      <span>
                        <span className="block text-sm">{v.name}</span>
                        {v.note && <span className="mt-0.5 block text-xs text-mist">{v.note}</span>}
                      </span>
                      <span className="text-xs text-ivory/70">{delta(v.priceDelta)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {swatches(groups.exterior, ext, chooseExterior, "Exterior",
              tab === "360" && paintable === false ? <p className="mt-3 text-[11px] text-mist">This 3D model&apos;s paint can&apos;t be recoloured; your choice is saved to the configuration.</p> : tab === "360" && paintable ? <p className="mt-3 text-[11px] text-gold">Live on the 360° model.</p> : null,
            )}
            {swatches(groups.interior, int, setInt, "Interior")}
            {swatches(groups.caliper, cal, setCal, "Brake calipers")}
          </div>

          <div className="sticky bottom-0 mt-auto border-t border-white/10 bg-onyx/95 p-6 backdrop-blur md:p-8">
            <p className="text-[10px] uppercase tracking-[0.25em] text-mist">As configured</p>
            <p className="mt-1 font-display text-4xl text-gilded"><Counter value={total} format={(n) => formatPrice(Math.round(n / 100) * 100)} /></p>
            <p className="mt-1 truncate text-xs text-mist">{summary}</p>
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
              <button onClick={() => setInquiry(true)} className="btn btn-primary">Request private viewing</button>
              <button onClick={share} className="btn btn-ghost !px-4">Share</button>
            </div>
            <a
              href={`/api/cars/${car.slug}/spec-sheet?${new URLSearchParams({ variant: variant?.id ?? "", color: ext?.id ?? "", interior: int?.id ?? "", caliper: cal?.id ?? "" })}`}
              onClick={() => toast("Preparing your spec sheet PDF…", "info")}
              className="mt-2 flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-[0.22em] text-mist transition hover:text-gold"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" /></svg>
              Download spec sheet (PDF)
            </a>
            {paymentsEnabled && car.status === "AVAILABLE" && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <RazorpayButton purpose="CAR_RESERVATION" carSlug={car.slug} label="Reserve this car · ₹1,00,000 refundable" className="btn btn-ghost w-full !text-[10px]" />
                <p className="mt-1.5 text-center text-[10px] text-mist">Holds the car for you while an advisor prepares the paperwork.</p>
              </div>
            )}
            {car.status === "RESERVED" && <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-gold">Reserved — join the waiting list via concierge</p>}
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-[1480px] px-5 py-24 md:px-10">
        <p className="eyebrow">Performance</p>
        <div className="mt-10 grid grid-cols-2 gap-px bg-white/5 md:grid-cols-4">
          {[
            { label: "Power", value: specs.powerHp, unit: "hp" },
            { label: "Torque", value: specs.torqueNm, unit: "Nm" },
            { label: "0–100 km/h", value: specs.zeroToHundred, unit: "s", decimals: 1 },
            { label: "Top speed", value: specs.topSpeedKmh, unit: "km/h" },
          ].map((s) => (
            <div key={s.label} className="bg-ink px-6 py-10">
              <p className="font-display text-6xl md:text-7xl"><Counter value={s.value} decimals={s.decimals ?? 0} /><span className="ml-2 text-xl text-gold">{s.unit}</span></p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-mist">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 grid gap-16 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">The story</p>
            <p className="mt-6 font-display text-3xl leading-snug text-ivory/90 md:text-4xl" style={{ textTransform: "none", letterSpacing: "normal" }}>{car.description}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Specification</p>
            <dl className="mt-6 divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {[
                ["Engine", specs.engine],
                ["Transmission", specs.transmission],
                ["Drivetrain", specs.drivetrain],
                ["Seats", String(specs.seats)],
                ["Weight", specs.weightKg ? `${specs.weightKg.toLocaleString()} kg` : "—"],
                ["Origin", car.brand.country],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-4 text-sm">
                  <dt className="text-mist">{k}</dt>
                  <dd className="text-right text-ivory">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {car.priceHistory.length > 1 && (
          <Reveal className="mt-24">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Market index</p>
                <p className="mt-3 font-display text-4xl">Twelve-month value trend</p>
              </div>
              <p className="text-xs text-mist">Indicative · sample data</p>
            </div>
            <PriceChart points={car.priceHistory} />
          </Reveal>
        )}
      </section>

      <AnimatePresence>{inquiry && <InquiryDialog car={car} summary={`${summary} — ${formatPrice(total)}`} onClose={() => setInquiry(false)} />}</AnimatePresence>
    </>
  );
}
