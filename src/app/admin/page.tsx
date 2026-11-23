import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { phaseOf } from "@/lib/auctions";
import { sheetsConfigured } from "@/lib/sheets";
import { PageHead, Table, td, fmtDate } from "./ui";

export default async function AdminDashboard() {
  const dayAgo = new Date(Date.now() - 864e5);
  const [users, newUsers, loginsToday, cars, auctions, bids, newInquiries, recentLogins, recentBids] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: dayAgo } } }),
    db.loginEvent.count({ where: { createdAt: { gte: dayAgo }, kind: { not: "FAILED" } } }),
    db.car.count(),
    db.auction.findMany({ select: { status: true, startsAt: true, endsAt: true } }),
    db.bid.aggregate({ _count: true, _max: { amount: true } }),
    db.inquiry.count({ where: { status: "NEW" } }),
    db.loginEvent.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.bid.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { email: true } }, auction: { select: { id: true, title: true } } } }),
  ]);
  const live = auctions.filter((a) => phaseOf(a) === "LIVE").length;

  const stats = [
    { label: "Accounts", value: users, sub: `+${newUsers} in 24h`, href: "/admin/users" },
    { label: "Sign-ins (24h)", value: loginsToday, href: "/admin/logins" },
    { label: "Listings", value: cars, href: "/admin/cars" },
    { label: "Live auctions", value: live, sub: `${auctions.length} total`, href: "/admin/auctions" },
    { label: "Bids", value: bids._count, sub: bids._max.amount ? `High ${formatPrice(bids._max.amount, { compact: true })}` : undefined, href: "/admin/auctions" },
    { label: "New inquiries", value: newInquiries, href: "/admin/inquiries" },
  ];

  return (
    <>
      <PageHead
        title="Dashboard"
        sub={sheetsConfigured() ? "Google Sheets mirror: connected" : "Google Sheets mirror: not connected yet"}
        action={<Link href="/admin/auctions/new" className="btn btn-primary">New auction</Link>}
      />
      <div className="grid grid-cols-2 gap-px bg-white/5 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-ink p-5 transition hover:bg-onyx">
            <p className="font-display text-4xl">{s.value}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-mist">{s.label}</p>
            {s.sub && <p className="mt-1 text-xs text-gold">{s.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex justify-between"><p className="eyebrow">Latest sign-ins</p><Link href="/admin/logins" className="text-xs text-mist hover:text-gold">All →</Link></div>
          <Table head={["When", "Email", "Method", "Event"]} empty={!recentLogins.length}>
            {recentLogins.map((l) => (
              <tr key={l.id}>
                <td className={`${td} whitespace-nowrap text-mist`}>{fmtDate(l.createdAt)}</td>
                <td className={td}>{l.email}</td>
                <td className={td}>{l.provider}</td>
                <td className={`${td} ${l.kind === "FAILED" ? "text-red-300" : l.kind === "SIGN_UP" ? "text-gold" : ""}`}>{l.kind}</td>
              </tr>
            ))}
          </Table>
        </section>
        <section>
          <div className="mb-3 flex justify-between"><p className="eyebrow">Latest bids</p><Link href="/admin/auctions" className="text-xs text-mist hover:text-gold">Auctions →</Link></div>
          <Table head={["When", "Bidder", "Lot", "Amount"]} empty={!recentBids.length}>
            {recentBids.map((b) => (
              <tr key={b.id}>
                <td className={`${td} whitespace-nowrap text-mist`}>{fmtDate(b.createdAt)}</td>
                <td className={td}>{b.user.email}</td>
                <td className={td}><Link href={`/admin/auctions/${b.auction.id}`} className="hover:text-gold">{b.auction.title}</Link></td>
                <td className={`${td} text-gold`}>{formatPrice(b.amount)}</td>
              </tr>
            ))}
          </Table>
        </section>
      </div>
    </>
  );
}
