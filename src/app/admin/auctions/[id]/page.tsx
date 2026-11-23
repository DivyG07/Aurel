import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { phaseOf } from "@/lib/auctions";
import { cancelAuction, deleteAuction } from "../../actions";
import { ConfirmButton } from "../../ConfirmButton";
import { PageHead, Table, td, fmtDate } from "../../ui";
import { AuctionForm } from "../AuctionForm";

export default async function ManageAuction({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [a, cars] = await Promise.all([
    db.auction.findUnique({ where: { id }, include: { bids: { orderBy: { amount: "desc" }, include: { user: { select: { email: true, name: true } } } } } }),
    db.car.findMany({ include: { brand: true }, orderBy: [{ brand: { name: "asc" } }, { model: "asc" }] }),
  ]);
  if (!a) notFound();
  const phase = phaseOf(a);

  return (
    <>
      <PageHead
        title={a.title}
        sub={`${phase} · ${a.bids.length} bids`}
        action={
          <div className="flex items-center gap-4">
            <Link href={`/auctions/${a.id}`} className="btn btn-ghost">Open live room</Link>
            {phase !== "ENDED" && a.status !== "CANCELLED" && <ConfirmButton action={cancelAuction} id={a.id} label="Cancel auction" confirm="Cancel this auction? Bidders will see it as withdrawn." className="text-xs uppercase tracking-[0.2em] text-red-300" />}
            <ConfirmButton action={deleteAuction} id={a.id} label="Delete" confirm="Delete this auction and all its bids permanently?" />
          </div>
        }
      />
      <AuctionForm
        cars={cars.map((c) => ({ id: c.id, label: `${c.year} ${c.brand.name} ${c.model}`, price: c.priceFrom }))}
        values={{ ...a, startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString() }}
      />
      <h2 className="eyebrow mb-4 mt-14">Bids</h2>
      <Table head={["Time", "Bidder", "Amount"]} empty={!a.bids.length}>
        {a.bids.map((b, i) => (
          <tr key={b.id}>
            <td className={`${td} text-mist`}>{fmtDate(b.createdAt)}</td>
            <td className={td}>{b.user.name ?? "—"} <span className="text-mist">· {b.user.email}</span></td>
            <td className={`${td} ${i === 0 ? "text-gold" : ""}`}>{formatPrice(b.amount)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
