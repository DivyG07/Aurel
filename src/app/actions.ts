"use server";

import { db } from "@/lib/db";
import { mirror } from "@/lib/sheets";

export type FormState = { ok: boolean; message: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribe(_prev: FormState, data: FormData): Promise<FormState> {
  if (data.get("company")) return { ok: true, message: "Thank you." }; // honeypot
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { ok: false, message: "Please enter a valid email address." };
  const sub = await db.subscriber.upsert({ where: { email }, update: {}, create: { email } });
  mirror("Subscribers", { id: sub.id, time: sub.createdAt, email }, "id");
  return { ok: true, message: "You're on the list. Private previews will reach you first." };
}

export async function requestViewing(_prev: FormState, data: FormData): Promise<FormState> {
  if (data.get("company")) return { ok: true, message: "Request received." };
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const phone = String(data.get("phone") ?? "").trim() || null;
  const message = String(data.get("message") ?? "").trim().slice(0, 2000) || null;
  const type = String(data.get("type") ?? "VIEWING");
  const slug = String(data.get("slug") ?? "");
  const config = String(data.get("config") ?? "");

  if (name.length < 2) return { ok: false, message: "Please tell us your name." };
  if (!EMAIL.test(email)) return { ok: false, message: "Please enter a valid email address." };
  if (!["VIEWING", "TEST_DRIVE", "PURCHASE", "GENERAL", "TRADE_IN", "FINANCE"].includes(type)) return { ok: false, message: "Unknown request type." };

  const car = slug ? await db.car.findUnique({ where: { slug }, select: { id: true, model: true } }) : null;
  const inquiry = await db.inquiry.create({
    data: {
      type,
      name,
      email,
      phone,
      carId: car?.id,
      message: [message, config && `Configuration: ${config}`].filter(Boolean).join("\n\n") || null,
    },
  });
  mirror("Inquiries", { id: inquiry.id, time: inquiry.createdAt, type, status: inquiry.status, name, email, phone, car: car?.model ?? "", message: inquiry.message }, "id");
  return { ok: true, message: "Thank you. A private client advisor will contact you within one business day." };
}
