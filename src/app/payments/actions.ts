"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { markPaid } from "@/lib/payments";
import { createOrder, fetchPayment, PURPOSES, razorpayConfigured, verifyCheckoutSignature, type Purpose } from "@/lib/razorpay";

type Start =
  | { ok: true; orderId: string; amount: number; currency: string; keyId: string; description: string; prefill: { name: string; email: string } }
  | { ok: false; message: string; needsLogin?: boolean };

/** Creates a Razorpay order. The amount is fixed server-side by purpose — never trusted from the browser. */
export async function startPayment(purpose: Purpose, carSlug?: string): Promise<Start> {
  if (!razorpayConfigured()) return { ok: false, message: "Payments aren't set up yet." };
  const s = await auth();
  if (!s?.user?.id) return { ok: false, message: "Please sign in first.", needsLogin: true };
  if (!(purpose in PURPOSES)) return { ok: false, message: "Unknown payment." };

  const user = await db.user.findUnique({ where: { id: s.user.id }, select: { name: true, email: true, verifiedBidder: true } });
  let carId: string | null = null;
  let description: string = PURPOSES[purpose].label;

  if (purpose === "BIDDER_DEPOSIT" && user?.verifiedBidder) return { ok: false, message: "You're already a verified bidder." };
  if (purpose === "CAR_RESERVATION") {
    const car = carSlug ? await db.car.findUnique({ where: { slug: carSlug }, include: { brand: true } }) : null;
    if (!car) return { ok: false, message: "Car not found." };
    if (car.status !== "AVAILABLE") return { ok: false, message: "This car is no longer available to reserve." };
    carId = car.id;
    description = `Reserve ${car.brand.name} ${car.model} (refundable)`;
  }

  const amount = PURPOSES[purpose].amountPaise;
  let order: { id: string };
  try {
    order = await createOrder(amount, `${purpose}-${Date.now()}`, { userId: s.user.id, purpose, carSlug: carSlug ?? "" });
  } catch (e) {
    console.error("[razorpay] order failed:", (e as Error).message);
    return { ok: false, message: "Payment service unavailable — please try again shortly." };
  }
  await db.payment.create({ data: { userId: s.user.id, purpose, carId, amountPaise: amount, razorpayOrderId: order.id } });
  return { ok: true, orderId: order.id, amount, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID!, description, prefill: { name: user?.name ?? "", email: user?.email ?? "" } };
}

/** Called by Checkout's success handler. Verifies the signature, then double-checks with Razorpay's API. */
export async function confirmPayment(input: { orderId: string; paymentId: string; signature: string }) {
  const s = await auth();
  if (!s?.user?.id) return { ok: false, message: "Please sign in." };
  const p = await db.payment.findUnique({ where: { razorpayOrderId: input.orderId } });
  if (!p || p.userId !== s.user.id) return { ok: false, message: "Payment not found." };
  if (!verifyCheckoutSignature(input.orderId, input.paymentId, input.signature)) {
    await db.payment.update({ where: { id: p.id }, data: { status: "FAILED" } });
    return { ok: false, message: "We couldn't verify that payment. You have not been charged twice — contact the concierge." };
  }
  const live = await fetchPayment(input.paymentId).catch(() => null);
  if (live && (live.order_id !== input.orderId || live.amount !== p.amountPaise)) return { ok: false, message: "Payment details didn't match. Please contact the concierge." };
  await markPaid(input.orderId, input.paymentId, live?.method);
  revalidatePath("/", "layout");
  return { ok: true, message: p.purpose === "BIDDER_DEPOSIT" ? "Deposit received — you can now bid." : "Reserved! Your advisor will be in touch." };
}

export async function cancelPayment(orderId: string) {
  const s = await auth();
  if (!s?.user?.id) return;
  await db.payment.updateMany({ where: { razorpayOrderId: orderId, userId: s.user.id, status: "CREATED" }, data: { status: "FAILED" } });
}
