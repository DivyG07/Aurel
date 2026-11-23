import Link from "next/link";
import { db } from "@/lib/db";
import { PageHead, Table, td, fmtDate } from "../ui";

const PAGE = 50;

export default async function LoginsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; kind?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = {
    ...(sp.q ? { email: { contains: sp.q, mode: "insensitive" as const } } : {}),
    ...(sp.kind ? { kind: sp.kind } : {}),
  };
  const [rows, total] = await Promise.all([
    db.loginEvent.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.loginEvent.count({ where }),
  ]);
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.kind ? { kind: sp.kind } : {}), page: String(p) })}`;

  return (
    <>
      <PageHead title="Login activity" sub={`${total} events — every sign-in, sign-up and failed attempt`} />
      <form className="mb-5 flex flex-wrap gap-3">
        <input name="q" defaultValue={sp.q} placeholder="Filter by email…" className="field max-w-xs" />
        <select name="kind" defaultValue={sp.kind ?? ""} className="field max-w-[180px]">
          <option value="">All events</option>
          <option value="SIGN_IN">Sign-ins</option>
          <option value="SIGN_UP">Sign-ups</option>
          <option value="FAILED">Failed</option>
        </select>
        <button className="btn btn-ghost">Filter</button>
      </form>
      <Table head={["When", "Email", "Method", "Event", "IP", "Device"]} empty={!rows.length}>
        {rows.map((l) => (
          <tr key={l.id}>
            <td className={`${td} whitespace-nowrap text-mist`}>{fmtDate(l.createdAt)}</td>
            <td className={td}>{l.userId ? <Link href={`/admin/users?q=${encodeURIComponent(l.email)}`} className="hover:text-gold">{l.email}</Link> : l.email}</td>
            <td className={td}>{l.provider}</td>
            <td className={`${td} ${l.kind === "FAILED" ? "text-red-300" : l.kind === "SIGN_UP" ? "text-gold" : ""}`}>{l.kind}</td>
            <td className={`${td} text-mist`}>{l.ip ?? "—"}</td>
            <td className={`${td} max-w-[260px] truncate text-xs text-mist`} title={l.userAgent ?? ""}>{l.userAgent ?? "—"}</td>
          </tr>
        ))}
      </Table>
      <div className="mt-5 flex gap-3 text-sm">
        {page > 1 && <Link href={qs(page - 1)} className="btn btn-ghost">← Newer</Link>}
        {page * PAGE < total && <Link href={qs(page + 1)} className="btn btn-ghost">Older →</Link>}
      </div>
    </>
  );
}
