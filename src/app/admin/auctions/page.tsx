import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { phaseOf } from "@/lib/auctions";
import { imageUrl, parseIds } from "@/lib/uploads";
import { conditionLabel, listingTypeLabel } from "@/lib/types";
import { approveListing, rejectListing } from "../actions";
import { Notice, PageHead, Table, td, fmtDate } from "../ui";

const carName = (a: { car: { model: string; brand: { name: string } } | null; make: string | null; model: string | null }) =>
  a.car ? `${a.car.brand.name} ${a.car.model}` : `${a.make ?? ""} ${a.model ?? ""}`.trim();

export default async function AdminAuctions({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const [pending, auctions] = await Promise.all([
    db.auction.findMany({ where: { status: "PENDING_REVIEW" }, orderBy: { createdAt: "asc" }, include: { seller: { select: { name: true, email: true, role: true } }, car: { include: { brand: true } } } }),
    db.auction.findMany({
      where: { status: { not: "PENDING_REVIEW" } },
      orderBy: { startsAt: "desc" },
      include: { car: { include: { brand: true } }, seller: { select: { email: true } }, bids: { orderBy: { amount: "desc" }, take: 1, include: { user: { select: { email: true } } } }, _count: { select: { bids: true } } },
    }),
  ]);

  return (
    <>
      <PageHead title="Auctions" sub="House lots you schedule, plus cars members submit for review." action={<Link href="/admin/auctions/new" className="btn btn-primary">Schedule house lot</Link>} />
      <Notice saved={sp.saved} />

      <section className="mb-12">
        <p className="eyebrow mb-4">Awaiting review ({pending.length})</p>
        {!pending.length && <p className="text-sm text-mist">No member submissions waiting.</p>}
        <div className="space-y-4">
          {pending.map((a) => {
            const imgs = parseIds(a.imageIds);
            return (
              <div key={a.id} className="grid gap-5 border border-sky-300/20 bg-onyx p-5 lg:grid-cols-[260px_1fr_280px]">
                <div className="grid grid-cols-3 gap-1.5">
                  {imgs.slice(0, 6).map((id) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={id} href={imageUrl(id)} target="_blank" rel="noreferrer"><img src={imageUrl(id)} alt="" className="aspect-square w-full object-cover" /></a>
                  ))}
                  {!imgs.length && <p className="col-span-3 text-xs text-mist">No photos</p>}
                </div>
                <div className="text-sm">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sky-200">{listingTypeLabel[a.listingType as keyof typeof listingTypeLabel] ?? a.listingType}</p>
                  <p className="mt-1 font-display text-2xl">{a.title}</p>
                  <p className="mt-1 text-mist">{carName(a)}{a.year ? ` · ${a.year}` : ""}{a.mileageKm != null ? ` · ${a.mileageKm.toLocaleString()} km` : ""}{a.condition ? ` · ${conditionLabel[a.condition] ?? a.condition}` : ""}{a.location ? ` · ${a.location}` : ""}</p>
                  <p className="mt-2 text-mist">Seller: {a.seller?.name ?? "—"} · {a.seller?.email} ({a.seller?.role.toLowerCase()})</p>
                  <p className="mt-2">Start {formatPrice(a.startingBid)} · reserve {a.reservePrice ? formatPrice(a.reservePrice) : "none"} · +{formatPrice(a.bidIncrement)}</p>
                  <p className="text-mist">{fmtDate(a.startsAt)} → {fmtDate(a.endsAt)}</p>
                  {a.description && <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-ivory/80">{a.description}</p>}
                </div>
                <form action={approveListing} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <textarea name="note" rows={3} placeholder="Note to the seller (optional)" className="field text-xs" />
                  <button type="submit" className="btn btn-primary">Approve & go live</button>
                  <button type="submit" formAction={rejectListing} className="btn btn-ghost !text-red-300">Reject</button>
                  <p className="text-[10px] text-mist">Approving opens bidding immediately for {Math.round((a.endsAt.getTime() - a.startsAt.getTime()) / 864e5)} day(s).</p>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      <Table head={["Lot", "Type", "Window", "Phase", "High bid", "Bids", ""]} empty={!auctions.length}>
        {auctions.map((a) => {
          const phase = phaseOf(a);
          return (
            <tr key={a.id}>
              <td className={td}>
                <p className="text-xs text-gold">{carName(a)}</p>
                <p>{a.title}</p>
                {a.seller && <p className="text-xs text-mist">by {a.seller.email}</p>}
              </td>
              <td className={`${td} text-xs`}>{listingTypeLabel[a.listingType as keyof typeof listingTypeLabel] ?? a.listingType}</td>
              <td className={`${td} whitespace-nowrap text-xs text-mist`}>
                {fmtDate(a.startsAt)}
                <br />→ {fmtDate(a.endsAt)}
              </td>
              <td className={`${td} ${phase === "LIVE" ? "text-red-300" : phase === "UPCOMING" ? "text-gold" : "text-mist"}`}>{phase}</td>
              <td className={td}>
                {a.bids[0] ? formatPrice(a.bids[0].amount) : <span className="text-mist">from {formatPrice(a.startingBid)}</span>}
                {a.bids[0] && <p className="text-xs text-mist">{a.bids[0].user.email}</p>}
              </td>
              <td className={td}>{a._count.bids}</td>
              <td className={`${td} whitespace-nowrap`}>
                <div className="flex gap-4">
                  <Link href={`/auctions/${a.id}`} className="text-xs text-mist hover:text-ivory">Room</Link>
                  <Link href={`/admin/auctions/${a.id}`} className="text-xs text-gold">Manage</Link>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
