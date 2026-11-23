"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cancelPayment, confirmPayment, startPayment } from "@/app/payments/actions";
import { toast } from "@/lib/stores";

type Purpose = "BIDDER_DEPOSIT" | "CAR_RESERVATION";
type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void };
  }
}

const SRC = "https://checkout.razorpay.com/v1/checkout.js";
function loadCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = SRC;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Razorpay Checkout for a server-priced order, then verifies the result on the server. */
export function RazorpayButton({ purpose, carSlug, label, className, onPaid }: { purpose: Purpose; carSlug?: string; label: string; className?: string; onPaid?: () => void }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function pay() {
    setBusy(true);
    try {
      const order = await startPayment(purpose, carSlug);
      if (!order.ok) {
        if (order.needsLogin) router.push(`/login?next=${encodeURIComponent(pathname)}`);
        else toast(order.message, "error");
        return;
      }
      if (!(await loadCheckout()) || !window.Razorpay) return toast("Couldn't load the payment window. Check your connection.", "error");
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c9a96e";
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "AUREL",
        description: order.description,
        prefill: order.prefill,
        theme: { color: accent },
        handler: async (r: RazorpayResponse) => {
          const res = await confirmPayment({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
          toast(res.message, res.ok ? "success" : "error");
          if (res.ok) {
            onPaid?.();
            router.refresh();
          }
        },
        modal: { ondismiss: () => { void cancelPayment(order.orderId); toast("Payment cancelled", "info"); } },
      });
      rzp.on("payment.failed", (r) => toast(r.error?.description ?? "Payment failed", "error"));
      rzp.open();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={pay} disabled={busy} className={className ?? "btn btn-primary"}>
      {busy ? "Opening secure checkout…" : label}
    </button>
  );
}
