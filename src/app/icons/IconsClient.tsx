"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { IconView } from "@/lib/icons";
import { BrandMark } from "@/components/site/BrandMark";

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("");

export function IconsClient({ icons }: { icons: IconView[] }) {
  const professions = useMemo(() => Array.from(new Set(icons.map((i) => i.profession))).sort(), [icons]);
  const [q, setQ] = useState("");
  const [prof, setProf] = useState<string | null>(null);
  const list = icons.filter((i) => {
    const term = q.trim().toLowerCase();
    const hay = `${i.name} ${i.profession} ${i.country ?? ""} ${i.cars.map((c) => `${c.make} ${c.model}`).join(" ")}`.toLowerCase();
    return (!term || hay.includes(term)) && (!prof || i.profession === prof);
  });

  const chip = (on: boolean) => `border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition ${on ? "border-gold bg-gold text-ink" : "border-white/15 text-ivory/70 hover:border-gold/60"}`;

  return (
    <>
      <div className="mt-10 flex flex-col gap-4 border-y border-white/[0.07] py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button className={chip(!prof)} style={{ borderRadius: "var(--radius)" }} onClick={() => setProf(null)}>Everyone</button>
          {professions.map((p) => (
            <button key={p} className={chip(prof === p)} style={{ borderRadius: "var(--radius)" }} onClick={() => setProf(prof === p ? null : p)}>{p}</button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name or a car…" className="field max-w-xs" />
      </div>

      <motion.div layout className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p) => (
            <motion.div key={p.slug} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
              <Link href={`/icons/${p.slug}`} className="group relative flex h-full flex-col overflow-hidden border border-white/[0.07] bg-onyx transition hover:border-gold/40" style={{ borderRadius: "var(--radius)" }}>
                <div className="relative aspect-[16/9] overflow-hidden bg-graphite">
                  {p.cover ? (
                    <Image src={p.cover} alt="" fill sizes="(min-width:1280px) 33vw, 50vw" className="object-cover opacity-80 transition-opacity duration-700 group-hover:opacity-100" />
                  ) : (
                    <div className="absolute inset-0" style={{ background: "radial-gradient(80% 80% at 30% 20%, color-mix(in oklab, var(--accent) 25%, transparent), transparent 70%)" }} />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-3 left-5 grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-gold/70 bg-ink font-display text-2xl text-gold shadow-xl">
                    {p.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo.url} alt={p.name} loading="lazy" className={`h-full w-full object-cover ${p.photo.focus === "top" ? "object-top" : ""}`} />
                    ) : (
                      initials(p.name)
                    )}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-mist">{p.profession}{p.country ? ` · ${p.country}` : ""}</p>
                  <h2 className="mt-2 font-display text-3xl leading-tight">{p.name}</h2>
                  <ul className="mt-4 space-y-1.5 text-sm text-ivory/80">
                    {p.cars.slice(0, 3).map((c) => (
                      <li key={c.id} className="flex items-center gap-2">
                        {c.brandSlug ? <BrandMark slug={c.brandSlug} name={c.make} className="h-4 w-4 shrink-0 text-[1.4rem] text-gold" /> : <span className="h-1 w-1 shrink-0 rounded-full bg-gold" />}
                        <span className="truncate">{c.make} {c.model}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-5 text-[10px] uppercase tracking-[0.25em] text-gold opacity-70 transition group-hover:opacity-100">
                    {p.cars.length} {p.cars.length === 1 ? "car" : "cars"} · see the garage →
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {!list.length && <p className="py-20 text-center text-mist">No one matches that search.</p>}
    </>
  );
}
