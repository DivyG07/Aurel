import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

// CAPTCHA gate. A solved Turnstile challenge is verified server-side, then a
// short-lived signed cookie proves "human" to the sign-in callbacks — so both
// Google and email/password sign-in are blocked without a passed challenge.

const COOKIE = "aurel-human";
const TTL_MS = 10 * 60 * 1000;

const sign = (v: string) => createHmac("sha256", process.env.AUTH_SECRET ?? "dev").update(v).digest("hex");

export async function clientIp() {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;
}

export async function verifyTurnstile(token: string | null | undefined) {
  if (!token) return false;
  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY ?? "", response: token });
  const ip = await clientIp();
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
    const json = (await res.json()) as { success: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}

export async function grantHuman() {
  const ts = String(Date.now());
  (await cookies()).set(COOKIE, `${ts}.${sign(ts)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: TTL_MS / 1000, path: "/" });
}

export async function isHuman() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [ts, mac] = raw.split(".");
  if (!ts || !mac || Date.now() - Number(ts) > TTL_MS) return false;
  const expected = Buffer.from(sign(ts));
  const got = Buffer.from(mac);
  return expected.length === got.length && timingSafeEqual(expected, got);
}
