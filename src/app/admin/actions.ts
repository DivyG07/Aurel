"use server";

import { revalidatePath as revalidatePathBase, revalidateTag } from "next/cache";

/** Layout-wide edits also drop the cached catalog shell (brands, montage) used by every page. */
function revalidatePath(path: string, type?: "layout" | "page") {
  if (type === "layout") revalidateTag("catalog");
  revalidatePathBase(path, type);
}
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { mirror, replaceSheet, sheetsConfigured } from "@/lib/sheets";
import { broadcast } from "@/lib/auctions";
import { caliperPalette, interiorPalette } from "@/data/catalog";
import { inr, refundPayment } from "@/lib/razorpay";

export type ActionState = { ok: boolean; message: string } | null;

async function audit(actorId: string, action: string, entity: string, entityId?: string, meta?: unknown) {
  await db.auditLog.create({ data: { actorId, action, entity, entityId, meta: meta ? JSON.stringify(meta).slice(0, 4000) : null } });
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string) => {
  const v = str(f, k);
  return v === "" ? null : Math.round(Number(v));
};
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  return v === "" ? null : Number(v);
};
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
const lines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

// ─── Cars ────────────────────────────────────────────────────────────────────

export async function saveCar(_prev: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const brandId = str(f, "brandId");
  const model = str(f, "model");
  if (!brandId || !model) return { ok: false, message: "Brand and model are required." };
  const brand = await db.brand.findUnique({ where: { id: brandId } });
  if (!brand) return { ok: false, message: "Unknown brand." };

  const required = { year: int(f, "year"), priceFrom: int(f, "priceFrom"), powerHp: int(f, "powerHp"), torqueNm: int(f, "torqueNm"), zeroToHundred: num(f, "zeroToHundred"), topSpeedKmh: int(f, "topSpeedKmh"), seats: int(f, "seats") };
  const missing = Object.entries(required).filter(([, v]) => v == null || Number.isNaN(v)).map(([k]) => k);
  if (missing.length) return { ok: false, message: `Please fill in: ${missing.join(", ")}.` };

  const photos = lines(str(f, "photos")).map((l) => {
    const [url, ...credit] = l.split("|").map((x) => x.trim());
    return { url, credit: credit.join(" | ") || null };
  });
  if (photos.some((p) => !/^https:\/\//.test(p.url))) return { ok: false, message: "Photo URLs must start with https://" };

  const data = {
    brandId,
    model,
    slug: str(f, "slug") || slugify(`${brand.name} ${model}`),
    tagline: str(f, "tagline") || model,
    description: str(f, "description") || "",
    bodyType: str(f, "bodyType") || "GT",
    engine: str(f, "engine") || "—",
    drivetrain: str(f, "drivetrain") || "—",
    transmission: str(f, "transmission") || "—",
    weightKg: int(f, "weightKg"),
    status: str(f, "status") || "AVAILABLE",
    featured: f.get("featured") === "on",
    heroImage: photos[0]?.url ?? null,
    heroCredit: photos[0]?.credit ?? null,
    sketchfabUid: str(f, "sketchfabUid").replace(/.*-([0-9a-f]{32}).*/i, "$1") || null,
    sketchfabCredit: str(f, "sketchfabCredit") || null,
    sketchfabPaint: str(f, "sketchfabPaint") || null,
    configuratorUrl: str(f, "configuratorUrl") || null,
    year: required.year!,
    priceFrom: required.priceFrom!,
    powerHp: required.powerHp!,
    torqueNm: required.torqueNm!,
    zeroToHundred: required.zeroToHundred!,
    topSpeedKmh: required.topSpeedKmh!,
    seats: required.seats!,
  };

  const clash = await db.car.findUnique({ where: { slug: data.slug } });
  if (clash && clash.id !== id) return { ok: false, message: `The URL slug "${data.slug}" is already used by another car.` };

  const colors = lines(str(f, "colors")).map((l, i) => {
    const [name, hex, finish, delta] = l.split("|").map((x) => x.trim());
    return { name, hex: /^#[0-9a-f]{6}$/i.test(hex ?? "") ? hex : "#888888", finish: ["GLOSS", "METALLIC", "MATTE", "PEARL"].includes((finish ?? "").toUpperCase()) ? finish.toUpperCase() : "GLOSS", priceDelta: Number(delta) || 0, kind: "EXTERIOR", sortOrder: i };
  });
  const variants = lines(str(f, "variants")).map((l, i) => {
    const [name, delta, hp, note] = l.split("|").map((x) => x.trim());
    return { name, priceDelta: Number(delta) || 0, powerHp: hp ? Number(hp) || null : null, note: note || null, sortOrder: i };
  });

  const car = await db.$transaction(async (tx) => {
    const car = id ? await tx.car.update({ where: { id }, data }) : await tx.car.create({ data });
    await tx.carColor.deleteMany({ where: { carId: car.id, kind: "EXTERIOR" } });
    await tx.carColor.createMany({ data: colors.map((c) => ({ ...c, carId: car.id })) });
    if (!id) {
      await tx.carColor.createMany({
        data: [
          ...interiorPalette.map((x, i) => ({ name: x.name, hex: x.hex, priceDelta: x.priceDelta ?? 0, kind: "INTERIOR", sortOrder: i, carId: car.id })),
          ...caliperPalette.map((x, i) => ({ name: x.name, hex: x.hex, priceDelta: x.priceDelta ?? 0, kind: "CALIPER", sortOrder: i, carId: car.id })),
        ],
      });
    }
    await tx.carVariant.deleteMany({ where: { carId: car.id } });
    await tx.carVariant.createMany({ data: (variants.length ? variants : [{ name: "Standard", priceDelta: 0, powerHp: null, note: null, sortOrder: 0 }]).map((v) => ({ ...v, carId: car.id })) });
    await tx.carMedia.deleteMany({ where: { carId: car.id, type: "IMAGE" } });
    await tx.carMedia.createMany({ data: photos.map((p, i) => ({ carId: car.id, type: "IMAGE", url: p.url, credit: p.credit, alt: `${brand.name} ${model}`, sortOrder: i })) });
    return car;
  });

  await audit(admin.id, id ? "car.update" : "car.create", "Car", car.id, { model: data.model, priceFrom: data.priceFrom, status: data.status });
  mirror("Listings", { id: car.id, slug: car.slug, brand: brand.name, model: car.model, year: car.year, priceUsd: car.priceFrom, status: car.status, featured: car.featured, updated: new Date() }, "id");
  revalidatePath("/", "layout");
  redirect(`/admin/cars?saved=${encodeURIComponent(car.model)}`);
}

export async function deleteCar(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const car = await db.car.findUnique({ where: { id }, include: { _count: { select: { auctions: true } } } });
  if (!car) return;
  if (car._count.auctions) {
    redirect(`/admin/cars?error=${encodeURIComponent(`${car.model} has auctions — delete those first.`)}`);
  }
  await db.$transaction([
    db.inquiry.updateMany({ where: { carId: id }, data: { carId: null } }),
    db.celebrityCar.updateMany({ where: { carId: id }, data: { carId: null } }),
    db.car.delete({ where: { id } }),
  ]);
  await audit(admin.id, "car.delete", "Car", id, { model: car.model });
  mirror("Listings", { id, slug: car.slug, model: car.model, status: "DELETED", updated: new Date() }, "id");
  revalidatePath("/", "layout");
  redirect("/admin/cars?saved=deleted");
}

// ─── Brands ──────────────────────────────────────────────────────────────────

export async function saveBrand(_prev: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const name = str(f, "name");
  if (!name) return { ok: false, message: "Name is required." };
  const data = {
    name,
    slug: str(f, "slug") || slugify(name),
    country: str(f, "country") || "—",
    founded: int(f, "founded") ?? new Date().getFullYear(),
    tagline: str(f, "tagline") || null,
    accentHex: /^#[0-9a-f]{6}$/i.test(str(f, "accentHex")) ? str(f, "accentHex") : "#c9a96e",
  };
  const clash = await db.brand.findUnique({ where: { slug: data.slug } });
  if (clash && clash.id !== id) return { ok: false, message: `Slug "${data.slug}" is taken.` };
  const b = id ? await db.brand.update({ where: { id }, data }) : await db.brand.create({ data });
  await audit(admin.id, id ? "brand.update" : "brand.create", "Brand", b.id, data);
  revalidatePath("/", "layout");
  return { ok: true, message: `${b.name} saved.` };
}

export async function deleteBrand(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const b = await db.brand.findUnique({ where: { id }, include: { _count: { select: { cars: true } } } });
  if (!b) return;
  if (b._count.cars) redirect(`/admin/brands?error=${encodeURIComponent(`${b.name} still has ${b._count.cars} cars.`)}`);
  await db.brand.delete({ where: { id } });
  await audit(admin.id, "brand.delete", "Brand", id, { name: b.name });
  revalidatePath("/", "layout");
  redirect("/admin/brands");
}

// ─── Auctions ────────────────────────────────────────────────────────────────

export async function saveAuction(_prev: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const carId = str(f, "carId");
  const startsAt = new Date(str(f, "startsAt"));
  const endsAt = new Date(str(f, "endsAt"));
  const startingBid = int(f, "startingBid");
  const bidIncrement = int(f, "bidIncrement") ?? 1000;
  if (!carId) return { ok: false, message: "Choose a car." };
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return { ok: false, message: "Set both start and end date/time." };
  if (endsAt <= startsAt) return { ok: false, message: "End time must be after the start time." };
  if (!startingBid || startingBid <= 0) return { ok: false, message: "Starting bid must be positive." };
  if (bidIncrement <= 0) return { ok: false, message: "Increment must be positive." };

  const car = await db.car.findUnique({ where: { id: carId }, include: { brand: true } });
  if (!car) return { ok: false, message: "Unknown car." };
  if (id) {
    const existing = await db.auction.findUnique({ where: { id }, include: { _count: { select: { bids: true } } } });
    if (existing?._count.bids && existing.startingBid !== startingBid) return { ok: false, message: "Starting bid can't change once bids exist." };
  }
  const data = {
    carId,
    title: str(f, "title") || `${car.year} ${car.brand.name} ${car.model}`,
    startingBid,
    reservePrice: int(f, "reservePrice"),
    bidIncrement,
    antiSnipeSecs: int(f, "antiSnipeSecs") ?? 120,
    startsAt,
    endsAt,
    status: "SCHEDULED",
  };
  const a = id ? await db.auction.update({ where: { id }, data }) : await db.auction.create({ data });
  if (car.status === "AVAILABLE") await db.car.update({ where: { id: carId }, data: { status: "AUCTION" } });
  await audit(admin.id, id ? "auction.update" : "auction.create", "Auction", a.id, { ...data, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
  mirror("Auctions", { id: a.id, title: a.title, car: `${car.brand.name} ${car.model}`, startsAt, endsAt, startingBid, reserve: a.reservePrice, increment: bidIncrement, status: a.status }, "id");
  await broadcast(a.id);
  revalidatePath("/auctions");
  redirect(`/admin/auctions?saved=${encodeURIComponent(a.title)}`);
}

export async function cancelAuction(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const a = await db.auction.update({ where: { id }, data: { status: "CANCELLED" } });
  await audit(admin.id, "auction.cancel", "Auction", id);
  mirror("Auctions", { id, title: a.title, status: "CANCELLED" }, "id");
  await broadcast(id);
  revalidatePath("/auctions");
  redirect("/admin/auctions");
}

export async function deleteAuction(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const a = await db.auction.delete({ where: { id } });
  await audit(admin.id, "auction.delete", "Auction", id, { title: a.title });
  mirror("Auctions", { id, title: a.title, status: "DELETED" }, "id");
  revalidatePath("/auctions");
  redirect("/admin/auctions");
}

// ─── Member-submitted lots ───────────────────────────────────────────────────

export async function reviewListing(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const decision = str(f, "decision");
  const note = str(f, "note").slice(0, 500) || null;
  const a = await db.auction.findUnique({ where: { id } });
  if (!a || a.status !== "PENDING_REVIEW") redirect("/admin/auctions");
  if (decision === "approve") {
    // If the requested start has already passed while waiting for review, open it now and keep the duration.
    const now = Date.now();
    const duration = a.endsAt.getTime() - a.startsAt.getTime();
    const startsAt = a.startsAt.getTime() < now ? new Date(now) : a.startsAt;
    const endsAt = new Date(startsAt.getTime() + duration);
    await db.auction.update({ where: { id }, data: { status: "SCHEDULED", reviewNote: note, startsAt, endsAt } });
    if (a.sellerId) await db.notification.create({ data: { userId: a.sellerId, type: "SYSTEM", title: "Your car was approved for auction", body: `${a.title} goes live ${startsAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.`, href: `/auctions/${id}` } });
  } else {
    await db.auction.update({ where: { id }, data: { status: "REJECTED", reviewNote: note ?? "Not approved." } });
    if (a.sellerId) await db.notification.create({ data: { userId: a.sellerId, type: "SYSTEM", title: "Your auction listing wasn't approved", body: note ?? "See your account for details.", href: "/account#listings" } });
  }
  await audit(admin.id, decision === "approve" ? "listing.approve" : "listing.reject", "Auction", id, { note });
  mirror("Auctions", { id, title: a.title, type: a.listingType, status: decision === "approve" ? "SCHEDULED" : "REJECTED" }, "id");
  revalidatePath("/auctions");
  revalidatePath("/admin/auctions");
  redirect("/admin/auctions");
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function refundPaymentAction(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const p = await db.payment.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
  if (!p || p.status !== "PAID" || !p.razorpayPaymentId) redirect("/admin/payments?error=" + encodeURIComponent("Only paid payments can be refunded."));
  let refundId: string;
  try {
    refundId = (await refundPayment(p.razorpayPaymentId)).id;
  } catch (e) {
    redirect("/admin/payments?error=" + encodeURIComponent(`Razorpay refused the refund: ${(e as Error).message}`));
  }
  await db.payment.update({ where: { id }, data: { status: "REFUNDED", refundId, refundedAt: new Date() } });
  if (p.purpose === "BIDDER_DEPOSIT") {
    const stillPaid = await db.payment.count({ where: { userId: p.userId, purpose: "BIDDER_DEPOSIT", status: "PAID" } });
    if (!stillPaid) await db.user.update({ where: { id: p.userId }, data: { verifiedBidder: false } });
  } else if (p.purpose === "CAR_RESERVATION" && p.carId) {
    await db.car.updateMany({ where: { id: p.carId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
  }
  await db.notification.create({ data: { userId: p.userId, type: "SYSTEM", title: "Refund issued", body: `${inr(p.amountPaise)} is on its way back to your original payment method (5–7 working days).`, href: "/account#payments" } });
  await audit(admin.id, "payment.refund", "Payment", id, { amountPaise: p.amountPaise, refundId });
  mirror("Payments", { id, status: "REFUNDED", refundId, refundedAt: new Date() }, "id");
  revalidatePath("/", "layout");
  redirect("/admin/payments?saved=" + encodeURIComponent("Refund issued"));
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function setBanned(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  if (id === admin.id) return;
  const banned = str(f, "banned") === "1";
  const u = await db.user.update({ where: { id }, data: { banned } });
  await audit(admin.id, banned ? "user.ban" : "user.unban", "User", id, { email: u.email });
  mirror("Users", { id, email: u.email, banned }, "id");
  revalidatePath("/admin/users");
}

export async function setRole(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const role = str(f, "role");
  if (!["COLLECTOR", "DEALER"].includes(role) || id === admin.id) return;
  const u = await db.user.update({ where: { id }, data: { role } });
  await audit(admin.id, "user.role", "User", id, { email: u.email, role });
  mirror("Users", { id, email: u.email, role }, "id");
  revalidatePath("/admin/users");
}

export async function deleteUser(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  if (id === admin.id) return;
  const bids = await db.bid.count({ where: { userId: id } });
  if (bids) redirect(`/admin/users?error=${encodeURIComponent("This user has bids on record — ban instead of deleting.")}`);
  const u = await db.user.delete({ where: { id } });
  await audit(admin.id, "user.delete", "User", id, { email: u.email });
  mirror("Users", { id, email: u.email, deleted: true }, "id");
  revalidatePath("/admin/users");
}

// ─── Inquiries ───────────────────────────────────────────────────────────────

export async function setInquiryStatus(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const status = str(f, "status");
  if (!["NEW", "CONTACTED", "SCHEDULED", "WON", "LOST"].includes(status)) return;
  const inq = await db.inquiry.update({ where: { id }, data: { status } });
  mirror("Inquiries", { id, status: inq.status }, "id");
  await audit(admin.id, "inquiry.status", "Inquiry", id, { status });
  revalidatePath("/admin/inquiries");
}

// ─── Icons (famous owners) ───────────────────────────────────────────────────

export async function saveIcon(_prev: ActionState, f: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const name = str(f, "name");
  if (!name) return { ok: false, message: "Name is required." };
  const cars = lines(str(f, "cars")).map((l, i) => {
    const [make, model, year, catalogSlug, sourceUrl, sourceName, ...story] = l.split("|").map((x) => x.trim());
    return { make, model, year: Number(year) || null, catalogSlug: catalogSlug || null, sourceUrl, sourceName: sourceName || null, story: story.join(" | ") || null, sortOrder: i };
  });
  const bad = cars.find((c) => !c.make || !c.model || !/^https?:\/\//.test(c.sourceUrl ?? ""));
  if (bad) return { ok: false, message: `Every car needs make, model and a source URL (problem: "${bad.make ?? ""} ${bad.model ?? ""}").` };
  const catalog = await db.car.findMany({ where: { slug: { in: cars.map((c) => c.catalogSlug).filter(Boolean) as string[] } }, select: { id: true, slug: true } });
  const data = { name, slug: str(f, "slug") || slugify(name), profession: str(f, "profession") || "—", country: str(f, "country") || null, bio: str(f, "bio") || null };
  const clash = await db.celebrity.findUnique({ where: { slug: data.slug } });
  if (clash && clash.id !== id) return { ok: false, message: `Slug "${data.slug}" is taken.` };

  const icon = await db.$transaction(async (tx) => {
    const icon = id ? await tx.celebrity.update({ where: { id }, data }) : await tx.celebrity.create({ data });
    await tx.celebrityCar.deleteMany({ where: { celebrityId: icon.id } });
    await tx.celebrityCar.createMany({
      data: cars.map(({ catalogSlug, ...c }) => ({ ...c, celebrityId: icon.id, carId: catalog.find((x) => x.slug === catalogSlug)?.id ?? null })),
    });
    return icon;
  });
  await audit(admin.id, id ? "icon.update" : "icon.create", "Celebrity", icon.id, { name, cars: cars.length });
  revalidatePath("/icons");
  return { ok: true, message: `${name} saved with ${cars.length} car(s).` };
}

export async function deleteIcon(f: FormData) {
  const admin = await requireAdmin();
  const id = str(f, "id");
  const c = await db.celebrity.delete({ where: { id } });
  await audit(admin.id, "icon.delete", "Celebrity", id, { name: c.name });
  revalidatePath("/icons");
  redirect("/admin/icons");
}

// ─── Google Sheets ───────────────────────────────────────────────────────────

export async function syncSheets(): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!sheetsConfigured()) return { ok: false, message: "Set GOOGLE_SHEETS_WEBHOOK_URL in .env first (see docs/GOOGLE_SHEETS.md)." };
  const [users, logins, cars, auctions, bids, inquiries, subscribers] = await Promise.all([
    db.user.findMany({ include: { accounts: { select: { provider: true } } }, orderBy: { createdAt: "asc" } }),
    db.loginEvent.findMany({ orderBy: { createdAt: "asc" }, take: 5000 }),
    db.car.findMany({ include: { brand: true }, orderBy: { createdAt: "asc" } }),
    db.auction.findMany({ include: { car: { include: { brand: true } } }, orderBy: { startsAt: "asc" } }),
    db.bid.findMany({ include: { user: { select: { email: true } }, auction: { select: { title: true } } }, orderBy: { createdAt: "asc" }, take: 10000 }),
    db.inquiry.findMany({ include: { car: { select: { model: true } } }, orderBy: { createdAt: "asc" } }),
    db.subscriber.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  const results = await Promise.all([
    replaceSheet("Users", users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, provider: u.accounts.map((a) => a.provider).join(", ") || (u.passwordHash ? "credentials" : ""), created: u.createdAt, lastLogin: u.lastLoginAt, logins: u.loginCount, banned: u.banned }))),
    replaceSheet("Logins", logins.map((l) => ({ id: l.id, time: l.createdAt, email: l.email, provider: l.provider, kind: l.kind, ip: l.ip, userAgent: l.userAgent }))),
    replaceSheet("Listings", cars.map((c) => ({ id: c.id, slug: c.slug, brand: c.brand.name, model: c.model, year: c.year, priceUsd: c.priceFrom, status: c.status, featured: c.featured, updated: c.updatedAt }))),
    replaceSheet("Auctions", auctions.map((a) => ({ id: a.id, title: a.title, car: a.car ? `${a.car.brand.name} ${a.car.model}` : `${a.make ?? ""} ${a.model ?? ""}`.trim(), type: a.listingType, startsAt: a.startsAt, endsAt: a.endsAt, startingBid: a.startingBid, reserve: a.reservePrice, increment: a.bidIncrement, status: a.status }))),
    replaceSheet("Bids", bids.map((b) => ({ id: b.id, time: b.createdAt, auctionId: b.auctionId, auction: b.auction.title, bidder: b.user.email, amount: b.amount }))),
    replaceSheet("Inquiries", inquiries.map((i) => ({ id: i.id, time: i.createdAt, type: i.type, status: i.status, name: i.name, email: i.email, phone: i.phone, car: i.car?.model, message: i.message }))),
    replaceSheet("Subscribers", subscribers.map((s) => ({ id: s.id, time: s.createdAt, email: s.email }))),
  ]);
  await audit(admin.id, "sheets.sync", "Sheets");
  const failed = results.filter((r) => !r.ok);
  return failed.length ? { ok: false, message: failed.length === results.length ? (failed[0].text ?? `Sync failed (HTTP ${failed[0].status}).`) : `Sync reached the sheet but ${failed.length} tab(s) failed: ${failed[0].text ?? failed[0].status}` } : { ok: true, message: `Synced ${users.length} users, ${logins.length} logins, ${cars.length} listings, ${auctions.length} auctions, ${bids.length} bids.` };
}
