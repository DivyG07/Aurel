import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { phaseOf } from "@/lib/auctions";
import { Notice, PageHead, Table, td, fmtDate } from "../ui";

export default async function AdminAuctions({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const auctions = await db.auction.findMany({
    orderBy: { startsAt: "desc" },
    include: { car: { include: { brand: true } }, bids: { orderBy: { amount: "desc" }, take: 1, include: { user: { select: { email: true } } } }, _count: { select: { bids: true } } },
  });
  return (
    <>
      <PageHead title="Auctions" sub="Schedule a lot, set its window and rules. Signed-in members bid live." action={<Link href="/admin/auctions/new" className="btn btn-primary">Schedule auction</Link>} />
      <Notice saved={sp.saved} />
      <Table head={["Lot", "Window", "Phase", "High bid", "Bids", ""]} empty={!auctions.length}>
        {auctions.map((a) => {
          const phase = phaseOf(a);
          return (
            <tr key={a.id}>
              <td className={td}>
                <p className="text-xs text-gold">{a.car.brand.name} {a.car.model}</p>
                <p>{a.title}</p>
              </td>
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
