import { db } from "@/lib/db";
import { PageHead, Table, td, fmtDate } from "../ui";

export default async function Subscribers() {
  const rows = await db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHead title="Private client list" sub={`${rows.length} newsletter sign-ups from the "Request access" form on the home page`} />
      <Table head={["Signed up", "Email"]} empty={!rows.length}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className={`${td} whitespace-nowrap text-mist`}>{fmtDate(r.createdAt)}</td>
            <td className={td}><a href={`mailto:${r.email}`} className="hover:text-gold">{r.email}</a></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
