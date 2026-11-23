"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isAdminEmail } from "@/auth";
import { headers } from "next/headers";
import { clientIp, grantHuman, verifyTurnstile } from "@/lib/human";
import { mirror } from "@/lib/sheets";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Verifies a Turnstile token and sets the short-lived "human" cookie sign-in requires. */
export async function verifyHuman(token: string) {
  const ok = await verifyTurnstile(token);
  if (ok) await grantHuman();
  return { ok };
}

export async function register(input: { name: string; email: string; password: string; token: string; accountType?: string }) {
  if (!(await verifyTurnstile(input.token))) return { ok: false, message: "Please complete the security check again." };
  const name = input.name.trim().slice(0, 80);
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, message: "Please enter your name." };
  if (!EMAIL.test(email)) return { ok: false, message: "Please enter a valid email address." };
  if (input.password.length < 8) return { ok: false, message: "Password must be at least 8 characters." };
  if (isAdminEmail(email)) return { ok: false, message: "This email is reserved. Sign in with Google instead." };
  if (await db.user.findUnique({ where: { email } })) return { ok: false, message: "An account with this email already exists. Sign in instead." };

  const role = input.accountType === "DEALER" ? "DEALER" : "COLLECTOR";
  const user = await db.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(input.password, 12) } });
  const ip = await clientIp();
  const ev = await db.loginEvent.create({ data: { email, provider: "credentials", kind: "SIGN_UP", userId: user.id, ip, userAgent: (await headers()).get("user-agent") } });
  mirror("Logins", { id: ev.id, time: ev.createdAt, email, provider: "credentials", kind: "SIGN_UP", ip, userAgent: ev.userAgent });
  mirror("Users", { id: user.id, email, name, role: user.role, provider: "credentials", created: user.createdAt, lastLogin: "", logins: 0, banned: false }, "id");
  await grantHuman();
  return { ok: true, message: "Account created." };
}
