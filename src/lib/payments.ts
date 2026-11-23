import "server-only";
import { db } from "./db";
import { mirror } from "./sheets";
import { PURPOSES, inr, type Purpose } from "./razorpay";

/**
 * Marks a payment PAID and applies its effect. Idempotent — safe to call from both the
 * checkout callback and the webhook.
 */
export async function markPaid(orderId: string, paymentId: string, method?: string) {
  const p = await db.payment.findUnique({ where: { razorpayOrderId: orderId }, include: { user: { select: { email: true } }, car: { select: { model: true, slug: true } } } });
  if (!p) return null;
  if (p.status === "PAID" || p.status === "REFUNDED") return p;

  const paid = await db.payment.update({ where: { id: p.id }, data: { status: "PAID", razorpayPaymentId: paymentId, method: method ?? null, paidAt: new Date() } });
  const purpose = p.purpose as Purpose;

  if (purpose === "BIDDER_DEPOSIT") {
    await db.user.update({ where: { id: p.userId }, data: { verifiedBidder: true } });
    await db.notification.create({ data: { userId: p.userId, type: "SYSTEM", title: "You're a verified bidder", body: `Deposit of ${inr(p.amountPaise)} received — you can now bid in every auction.`, href: "/auctions" } });
  } else if (purpose === "CAR_RESERVATION" && p.carId) {
    await db.car.update({ where: { id: p.carId }, data: { status: "RESERVED" } });
    await db.inquiry.create({ data: { type: "PURCHASE", status: "NEW", carId: p.carId, userId: p.userId, name: p.user.email ?? "Member", email: p.user.email ?? "", message: `Reservation deposit paid: ${inr(p.amountPaise)} (Razorpay ${paymentId}).` } });
    await db.notification.create({ data: { userId: p.userId, type: "SYSTEM", title: `${p.car?.model ?? "Car"} reserved for you`, body: `Deposit of ${inr(p.amountPaise)} received. A private client advisor will call you within one business day.`, href: p.car ? `/cars/${p.car.slug}` : "/account" } });
  }

  mirror("Payments", { id: p.id, time: new Date(), email: p.user.email, purpose: PURPOSES[purpose].short, car: p.car?.model ?? "", amountINR: p.amountPaise / 100, status: "PAID", razorpayOrder: orderId, razorpayPayment: paymentId, method: method ?? "" }, "id");
  return paid;
}
