import type { Metadata } from "next";
import Link from "next/link";
import { getPublicGarages } from "@/lib/garage";
import { currentUser } from "@/lib/session";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Collectors' Garages" };
export const dynamic = "force-dynamic";

export default async function GaragesPage({ searchParams }: { searchParams: Promise<{ make?: string }> }) {
  const sp = await searchParams;
  const [owners, user] = await Promise.all([getPublicGarages(), currentUser()]);
  const makes = Array.from(new Set(owners.flatMap((o) => o.cars.map((c) => c.make)))).sort();
  const shown = sp.make ? owners.map((o) => ({ ...o, cars: o.cars.filter((c) => c.make === sp.make) })).filter((o) => o.cars.length) : owners;
  const totalCars = owners.reduce((s, o) => s + o.cars.length, 0);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 pt-32 md:px-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Community</p>
          <h1 className="mt-3 font-display text-5xl leading-none md:text-7xl">Collectors&apos; Garages</h1>
          <p className="mt-4 max-w-xl text-mist">Cars our members own and chose to share — {totalCars} {totalCars === 1 ? "car" : "cars"} from {owners.length} {owners.length === 1 ? "collector" : "collectors"}.</p>
        </div>
        <Link href={user ? "/garage" : "/login?next=/garage"} className="btn btn-primary">{user ? "Manage my garage" : "Add your cars"}</Link>
      </div>

      {makes.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-y border-white/[0.07] py-4">
          <Link href="/garages" className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] ${!sp.make ? "text-gold" : "text-mist hover:text-ivory"}`}>All</Link>
          {makes.map((m) => <Link key={m} href={`/garages?make=${encodeURIComponent(m)}`} className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] ${sp.make === m ? "text-gold" : "text-mist hover:text-ivory"}`}>{m}</Link>)}
        </div>
      )}

      <div className="mt-10 space-y-14">
        {shown.map((o) => (
          <section key={o.id}>
            <div className="flex items-baseline gap-3 border-b border-white/[0.07] pb-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/20 font-semibold text-gold">{o.name[0]?.toUpperCase()}</span>
              <h2 className="font-display text-3xl">{o.name}&apos;s garage</h2>
              <span className="text-[10px] uppercase tracking-[0.2em] text-mist">{o.role === "DEALER" ? "Dealer" : o.role === "ADMIN" ? "Staff" : "Collector"} · {o.cars.length} {o.cars.length === 1 ? "car" : "cars"}</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {o.cars.map((c) => (
                <article key={c.id} className="overflow-hidden border border-white/[0.07] bg-onyx" style={{ borderRadius: "var(--radius)" }}>
                  <div className="aspect-[16/10] bg-graphite">
                    {c.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gold">{c.make} · {c.year}</p>
                    <p className="mt-1 font-display text-xl leading-tight">{c.model}</p>
                    <p className="mt-1 text-xs text-mist">{[c.color, c.mileageKm != null && `${c.mileageKm.toLocaleString()} km`].filter(Boolean).join(" · ")}</p>
                    {c.estValueUsd != null && <p className="mt-2 text-sm text-ivory/80">≈ {formatPrice(c.estValueUsd, { compact: true })}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {!shown.length && (
          <div className="py-20 text-center">
            <p className="font-display text-3xl">No public garages yet.</p>
            <p className="mt-2 text-sm text-mist">Be the first — add your cars and switch on “Show in Collectors&apos; Garages”.</p>
          </div>
        )}
      </div>
    </div>
  );
}
