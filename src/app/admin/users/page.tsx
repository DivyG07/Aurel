import { db } from "@/lib/db";
import { isAdminEmail } from "@/auth";
import { deleteUser, setBanned, setRole } from "../actions";
import { Notice, PageHead, Table, td, fmtDate } from "../ui";
import { ConfirmButton } from "../ConfirmButton";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  const sp = await searchParams;
  const users = await db.user.findMany({
    where: sp.q ? { OR: [{ email: { contains: sp.q, mode: "insensitive" } }, { name: { contains: sp.q, mode: "insensitive" } }] } : undefined,
    orderBy: { createdAt: "desc" },
    include: { accounts: { select: { provider: true } }, _count: { select: { bids: true, loginEvents: true } } },
  });

  return (
    <>
      <PageHead title="Accounts" sub={`${users.length} registered collectors`} />
      <Notice error={sp.error} />
      <form className="mb-5 flex gap-3">
        <input name="q" defaultValue={sp.q} placeholder="Search name or email…" className="field max-w-xs" />
        <button className="btn btn-ghost">Search</button>
      </form>
      <Table head={["Account", "Sign-in method", "Role", "Joined", "Last login", "Logins", "Bids", ""]} empty={!users.length}>
        {users.map((u) => {
          const admin = isAdminEmail(u.email);
          const methods = [...new Set(u.accounts.map((a) => a.provider))];
          if (u.passwordHash) methods.push("password");
          return (
            <tr key={u.id} className={u.banned ? "opacity-50" : ""}>
              <td className={td}>
                <p>{u.name ?? "—"}</p>
                <p className="text-xs text-mist">{u.email}</p>
                {u.banned && <p className="text-[10px] uppercase tracking-[0.2em] text-red-300">Suspended</p>}
              </td>
              <td className={td}>{methods.join(", ") || "—"}</td>
              <td className={td}>
                {admin ? (
                  <span className="text-gold">ADMIN</span>
                ) : (
                  <form action={setRole} className="flex gap-1">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue={u.role === "DEALER" ? "DEALER" : "COLLECTOR"} className="field !w-auto !py-1.5 text-xs">
                      <option value="COLLECTOR">Collector</option>
                      <option value="DEALER">Dealer</option>
                    </select>
                    <button className="text-xs text-mist hover:text-gold">Set</button>
                  </form>
                )}
              </td>
              <td className={`${td} whitespace-nowrap text-mist`}>{fmtDate(u.createdAt)}</td>
              <td className={`${td} whitespace-nowrap text-mist`}>{fmtDate(u.lastLoginAt)}</td>
              <td className={td}>{u.loginCount}</td>
              <td className={td}>{u._count.bids}</td>
              <td className={`${td} whitespace-nowrap`}>
                {!admin && (
                  <div className="flex gap-3">
                    <form action={setBanned}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="banned" value={u.banned ? "0" : "1"} />
                      <button className="text-xs text-mist hover:text-gold">{u.banned ? "Restore" : "Suspend"}</button>
                    </form>
                    <ConfirmButton action={deleteUser} id={u.id} label="Delete" confirm={`Delete ${u.email}? This cannot be undone.`} />
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
