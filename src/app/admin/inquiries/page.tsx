import { db } from "@/lib/db";
import { setInquiryStatus } from "../actions";
import { PageHead, Table, td, fmtDate } from "../ui";

export default async function Inquiries() {
  const rows = await db.inquiry.findMany({ orderBy: { createdAt: "desc" }, include: { car: { select: { model: true } } } });
  return (
    <>
      <PageHead title="Inquiries" sub="Viewing, test-drive, purchase and concierge requests" />
      <Table head={["Received", "Client", "Request", "Message", "Status"]} empty={!rows.length}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className={`${td} whitespace-nowrap text-mist`}>{fmtDate(r.createdAt)}</td>
            <td className={td}>
              <p>{r.name}</p>
              <p className="text-xs text-mist">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
            </td>
            <td className={td}>{r.type}{r.car && <p className="text-xs text-gold">{r.car.model}</p>}</td>
            <td className={`${td} max-w-sm whitespace-pre-wrap text-xs text-mist`}>{r.message ?? "—"}</td>
            <td className={td}>
              <form action={setInquiryStatus} className="flex gap-1">
                <input type="hidden" name="id" value={r.id} />
                <select name="status" defaultValue={r.status} className="field !w-auto !py-1.5 text-xs">
                  {["NEW", "CONTACTED", "SCHEDULED", "WON", "LOST"].map((s) => <option key={s}>{s}</option>)}
                </select>
                <button className="text-xs text-mist hover:text-gold">Set</button>
              </form>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
