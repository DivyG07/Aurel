"use server";

import { revalidatePath } from "next/cache";
import { auth, isAdminEmail, signOut } from "@/auth";
import { db } from "@/lib/db";
import { mirror } from "@/lib/sheets";
import { imageUrl, saveImages, UploadError } from "@/lib/uploads";
import { BUDGETS, INTERESTS, keys, OWNED } from "@/lib/prefs";

export type AccountState = { ok: boolean; message: string } | null;


const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Onboarding + preferences: account type, top-3 marques, budget, interests, collection size. */
export async function savePreferences(_prev: AccountState, f: FormData): Promise<AccountState> {
  const s = await auth();
  if (!s?.user?.id) return { ok: false, message: "Please sign in." };
  const accountType = str(f, "accountType");
  const brands = f.getAll("brands").map(String).slice(0, 3);
  const budget = str(f, "budget");
  const interests = f.getAll("interests").map(String).filter((i) => keys(INTERESTS).includes(i));
  const carsOwned = str(f, "carsOwned");
  const known = await db.brand.findMany({ where: { slug: { in: brands } }, select: { slug: true } });
  const data: Record<string, unknown> = {
    favoriteBrands: JSON.stringify(known.map((b) => b.slug)),
    budget: keys(BUDGETS).includes(budget) ? budget : null,
    interests: JSON.stringify(interests),
    carsOwned: keys(OWNED).includes(carsOwned) ? carsOwned : null,
    onboardedAt: new Date(),
  };
  if (!isAdminEmail(s.user.email) && (accountType === "COLLECTOR" || accountType === "DEALER")) data.role = accountType;
  const u = await db.user.update({ where: { id: s.user.id }, data });
  mirror("Users", { id: u.id, email: u.email, role: u.role, favoriteBrands: known.map((b) => b.slug).join(", "), budget: u.budget, interests: interests.join(", "), carsOwned: u.carsOwned }, "id");
  revalidatePath("/", "layout");
  return { ok: true, message: "Preferences saved." };
}

export async function skipOnboarding() {
  const s = await auth();
  if (s?.user?.id) await db.user.update({ where: { id: s.user.id }, data: { onboardedAt: new Date() } });
  revalidatePath("/", "layout");
}

export async function updateProfile(_prev: AccountState, f: FormData): Promise<AccountState> {
  const s = await auth();
  if (!s?.user?.id) return { ok: false, message: "Please sign in." };
  const name = str(f, "name").slice(0, 60);
  const bio = str(f, "bio").slice(0, 280) || null;
  const phone = str(f, "phone").slice(0, 30) || null;
  const country = str(f, "country").slice(0, 60) || null;
  if (name.length < 2) return { ok: false, message: "Your name needs at least 2 characters." };
  let image: string | undefined;
  try {
    const [id] = await saveImages(s.user.id, f, "avatar", 1);
    if (id) image = imageUrl(id);
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Upload failed." };
  }
  const u = await db.user.update({ where: { id: s.user.id }, data: { name, bio, phone, country, ...(image ? { image } : {}), ...(f.get("removeAvatar") ? { image: null } : {}) } });
  mirror("Users", { id: u.id, email: u.email, name: u.name }, "id");
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile updated." };
}

/** Permanently delete your own account. Blocked while you have bids or listings on record (auction integrity). */
export async function deleteAccount(_prev: AccountState, f: FormData): Promise<AccountState> {
  const s = await auth();
  if (!s?.user?.id || !s.user.email) return { ok: false, message: "Please sign in." };
  if (isAdminEmail(s.user.email)) return { ok: false, message: "Admin accounts can't be deleted here." };
  if (str(f, "confirm").toLowerCase() !== s.user.email.toLowerCase()) return { ok: false, message: "Type your email exactly to confirm." };
  const [bids, listings] = await Promise.all([db.bid.count({ where: { userId: s.user.id } }), db.auction.count({ where: { sellerId: s.user.id, bids: { some: {} } } })]);
  if (bids || listings) return { ok: false, message: "You have auction bids or sales on record, which we must keep. Contact the concierge to close your account." };
  if (await db.payment.count({ where: { userId: s.user.id, status: { in: ["PAID", "REFUNDED"] } } })) {
    return { ok: false, message: "You have payments on record, which we must keep for accounting. Contact the concierge to close your account." };
  }
  await db.payment.deleteMany({ where: { userId: s.user.id } }); // only abandoned/failed attempts remain
  await db.loginEvent.updateMany({ where: { userId: s.user.id }, data: { userId: null } });
  await db.inquiry.updateMany({ where: { userId: s.user.id }, data: { userId: null } });
  await db.auditLog.updateMany({ where: { actorId: s.user.id }, data: { actorId: null } });
  await db.auction.deleteMany({ where: { sellerId: s.user.id } });
  await db.user.delete({ where: { id: s.user.id } });
  mirror("Users", { id: s.user.id, email: s.user.email, deleted: true }, "id");
  await signOut({ redirectTo: "/?goodbye=1" });
  return { ok: true, message: "Account deleted." };
}
