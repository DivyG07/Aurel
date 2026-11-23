import { db } from "@/lib/db";
import { inr, PURPOSES, razorpayConfigured, razorpayTestMode, type Purpose } from "@/lib/razorpay";
import { refundPaymentAction } from "../actions";
import { ConfirmButton } from "../ConfirmButton";
import { Notice, PageHead, Table, td, fmtDate } from "../ui";

const tone: Record<string, string> = { PAID: "text-emerald-300", REFUNDED: "text-sky-200", FAILED: "text-red-300", CREATED: "text-mist" };

export default async function AdminPayments({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const rows = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { email: true, name: true } }, car: { select: { model: true } } } });
  const paid = rows.filter((r) => r.status === "PAID");
  return (
    <>
      <PageHead
        title="Payments"
        sub={razorpayConfigured() ? `Razorpay connected · ${razorpayTestMode() ? "TEST mode — no real money" : "LIVE mode"}` : "Razorpay not connected — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"}
      />
      <Notice saved={sp.saved} error={sp.error} />
      <div className="mb-8 grid grid-cols-2 gap-px bg-white/5 md:grid-cols-4">
        {[
          ["Collected (held)", inr(paid.reduce((s, r) => s + r.amountPaise, 0))],
          ["Paid", String(paid.length)],
          ["Refunded", String(rows.filter((r) => r.status === "REFUNDED").length)],
          ["Abandoned / failed", String(rows.filter((r) => r.status === "FAILED" || r.status === "CREATED").length)],
        ].map(([k, v]) => (
          <div key={k} className="bg-ink p-5">
            <p className="font-display text-3xl">{v}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-mist">{k}</p>
          </div>
        ))}
      </div>
      <Table head={["When", "Member", "For", "Amount", "Status", "Razorpay", ""]} empty={!rows.length}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className={`${td} whitespace-nowrap text-mist`}>{fmtDate(r.createdAt)}</td>
            <td className={td}>{r.user.name ?? "—"}<p className="text-xs text-mist">{r.user.email}</p></td>
            <td className={td}>{PURPOSES[r.purpose as Purpose]?.short ?? r.purpose}{r.car && <p className="text-xs text-gold">{r.car.model}</p>}</td>
            <td className={td}>{inr(r.amountPaise)}</td>
            <td className={`${td} ${tone[r.status] ?? ""}`}>{r.status}{r.method && <p className="text-xs text-mist">{r.method}</p>}</td>
            <td className={`${td} font-mono text-[10px] text-mist`}>{r.razorpayPaymentId ?? r.razorpayOrderId}{r.refundId && <p>refund {r.refundId}</p>}</td>
            <td className={td}>
              {r.status === "PAID" && <ConfirmButton action={refundPaymentAction} id={r.id} label="Refund" confirm={`Refund ${inr(r.amountPaise)} to ${r.user.email}? This calls Razorpay and can't be undone.`} className="text-xs text-gold hover:text-gold-soft" />}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
