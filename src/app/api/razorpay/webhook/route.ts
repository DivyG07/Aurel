import { markPaid } from "@/lib/payments";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Razorpay webhook (Dashboard → Settings → Webhooks → URL: <site>/api/razorpay/webhook,
 * events: payment.captured). Backs up the browser callback if the visitor closes the tab mid-payment.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? "")) return new Response("bad signature", { status: 401 });
  const evt = JSON.parse(raw) as { event: string; payload?: { payment?: { entity?: { id: string; order_id: string; method?: string } } } };
  const pay = evt.payload?.payment?.entity;
  if ((evt.event === "payment.captured" || evt.event === "order.paid") && pay?.order_id) await markPaid(pay.order_id, pay.id, pay.method);
  return Response.json({ ok: true });
}
