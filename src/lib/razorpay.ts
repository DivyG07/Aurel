import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Razorpay REST API (https://razorpay.com/docs/api/). Test-mode keys start with "rzp_test_".

export const PURPOSES = {
  BIDDER_DEPOSIT: { amountPaise: 5_000_00, label: "Refundable bidder deposit", short: "Bidder deposit" },
  CAR_RESERVATION: { amountPaise: 1_00_000_00, label: "Refundable reservation deposit", short: "Car reservation" },
} as const;
export type Purpose = keyof typeof PURPOSES;

const keyId = () => process.env.RAZORPAY_KEY_ID ?? "";
const keySecret = () => process.env.RAZORPAY_KEY_SECRET ?? "";

export const razorpayConfigured = () => Boolean(keyId() && keySecret());
export const razorpayTestMode = () => keyId().startsWith("rzp_test_");
/** When payments are configured, bidding requires the deposit (set REQUIRE_BIDDER_DEPOSIT=false to switch off). */
export const depositRequired = () => razorpayConfigured() && process.env.REQUIRE_BIDDER_DEPOSIT !== "false";

async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString("base64")}`, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) throw new Error(json.error?.description ?? `Razorpay error ${res.status}`);
  return json;
}

export function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  return api<{ id: string; amount: number; currency: string }>("/orders", { method: "POST", body: { amount: amountPaise, currency: "INR", receipt: receipt.slice(0, 40), notes } });
}

export function fetchPayment(paymentId: string) {
  return api<{ id: string; order_id: string; status: string; amount: number; method: string }>(`/payments/${paymentId}`);
}

export function refundPayment(paymentId: string) {
  return api<{ id: string; status: string }>(`/payments/${paymentId}/refund`, { method: "POST", body: {} });
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Checkout signature: HMAC-SHA256(order_id|payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  return safeEqual(createHmac("sha256", keySecret()).update(`${orderId}|${paymentId}`).digest("hex"), signature);
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return safeEqual(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}

export const inr = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
