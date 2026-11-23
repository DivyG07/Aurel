"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BidError, placeBid } from "@/lib/auctions";
import { mirror } from "@/lib/sheets";
import { deleteUploads, parseIds, saveImages, UploadError } from "@/lib/uploads";

export async function bid(auctionId: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, message: "Sign in to bid.", needsLogin: true };
  try {
    const { extended } = await placeBid(auctionId, session.user.id, Math.round(amount));
    return { ok: true as const, message: extended ? "Bid placed. Clock extended — anti-snipe protection." : "Bid placed. You're the highest bidder." };
  } catch (e) {
    if (e instanceof BidError) return { ok: false as const, message: e.message };
    console.error(e);
    return { ok: false as const, message: "Something went wrong placing your bid. Please try again." };
  }
}

// ─── Member listings ─────────────────────────────────────────────────────────

export type ListingState = { ok: boolean; message: string } | null;

const CONDITIONS = ["NEW", "EXCELLENT", "VERY_GOOD", "GOOD", "PROJECT"];
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string) => {
  const v = str(f, k).replace(/[,\s]/g, "");
  return v === "" ? null : Math.round(Number(v));
};

function readListing(f: FormData) {
  const make = str(f, "make").slice(0, 60);
  const model = str(f, "model").slice(0, 80);
  const year = int(f, "year");
  const mileageKm = int(f, "mileageKm");
  const condition = str(f, "condition");
  const listingType = str(f, "listingType") === "DEALER" ? "DEALER" : "COLLECTOR";
  const startingBid = int(f, "startingBid");
  const reservePrice = int(f, "reservePrice");
  const durationDays = int(f, "durationDays") ?? 3;

  const thisYear = new Date().getFullYear();
  if (!make || !model) return { error: "Tell us the make and model." };
  if (!year || year < 1900 || year > thisYear + 1) return { error: `Year must be between 1900 and ${thisYear + 1}.` };
  if (mileageKm == null || mileageKm < 0 || Number.isNaN(mileageKm)) return { error: "Enter the mileage in km (0 for a new car)." };
  if (!CONDITIONS.includes(condition)) return { error: "Choose the car's condition." };
  if (!startingBid || startingBid < 1000) return { error: "The starting bid must be at least $1,000." };
  if (reservePrice != null && reservePrice < startingBid) return { error: "The reserve can't be lower than the starting bid." };
  if (![1, 3, 5, 7].includes(durationDays)) return { error: "Choose an auction length." };

  // No scheduling: bidding opens the moment an admin approves (approval resets these to "now").
  // Stored now only so the requested length (endsAt − startsAt) travels with the listing.
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + durationDays * 864e5);
  const bidIncrement = Math.max(500, Math.round(startingBid * 0.01 / 500) * 500);
  return {
    data: {
      make, model, year, mileageKm, condition, listingType, startingBid, reservePrice, bidIncrement, startsAt, endsAt,
      location: str(f, "location").slice(0, 80) || null,
      description: str(f, "description").slice(0, 4000) || null,
      title: (str(f, "title").slice(0, 120) || `${year} ${make} ${model}`),
    },
  };
}

export async function createListing(_prev: ListingState, f: FormData): Promise<ListingState> {
  const s = await auth();
  if (!s?.user?.id) return { ok: false, message: "Please sign in to list a car." };
  const parsed = readListing(f);
  if ("error" in parsed) return { ok: false, message: parsed.error! };
  let imageIds: string[];
  try {
    imageIds = await saveImages(s.user.id, f, "images", 6);
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Upload failed." };
  }
  if (!imageIds.length) return { ok: false, message: "Add at least one photo of the car." };
  const a = await db.auction.create({ data: { ...parsed.data, sellerId: s.user.id, imageIds: JSON.stringify(imageIds), status: "PENDING_REVIEW", antiSnipeSecs: 120 } });
  mirror("Auctions", { id: a.id, title: a.title, car: `${a.make} ${a.model}`, type: a.listingType, seller: s.user.email, startingBid: a.startingBid, reserve: a.reservePrice, status: a.status, startsAt: a.startsAt, endsAt: a.endsAt }, "id");
  revalidatePath("/admin/auctions");
  redirect("/account?listed=1#listings");
}

/** Sellers can edit until bidding opens; any edit goes back to review. */
export async function updateListing(_prev: ListingState, f: FormData): Promise<ListingState> {
  const s = await auth();
  if (!s?.user?.id) return { ok: false, message: "Please sign in." };
  const id = str(f, "id");
  const a = await db.auction.findUnique({ where: { id }, include: { _count: { select: { bids: true } } } });
  if (!a || a.sellerId !== s.user.id) return { ok: false, message: "Listing not found." };
  if (a._count.bids || (a.status === "SCHEDULED" && a.startsAt.getTime() <= Date.now()) || !["PENDING_REVIEW", "REJECTED", "SCHEDULED"].includes(a.status)) {
    return { ok: false, message: "This listing can't be edited once bidding has opened." };
  }
  const parsed = readListing(f);
  if ("error" in parsed) return { ok: false, message: parsed.error! };
  const current = parseIds(a.imageIds);
  const keep = f.getAll("keep").map(String).filter((k) => current.includes(k));
  let added: string[];
  try {
    added = await saveImages(s.user.id, f, "images", Math.max(0, 6 - keep.length));
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Upload failed." };
  }
  if (!keep.length && !added.length) return { ok: false, message: "Keep or add at least one photo." };
  await deleteUploads(s.user.id, current.filter((c) => !keep.includes(c)));
  await db.auction.update({ where: { id }, data: { ...parsed.data, imageIds: JSON.stringify([...keep, ...added]), status: "PENDING_REVIEW", reviewNote: null } });
  revalidatePath("/account");
  revalidatePath("/auctions");
  revalidatePath("/admin/auctions");
  return { ok: true, message: "Changes saved — your listing is back in review." };
}

/** Withdraw: delete if nobody has bid yet; refuse once bids exist on a live lot. */
export async function withdrawListing(id: string) {
  const s = await auth();
  if (!s?.user?.id) return { ok: false, message: "Please sign in." };
  const a = await db.auction.findUnique({ where: { id }, include: { _count: { select: { bids: true } } } });
  if (!a || a.sellerId !== s.user.id) return { ok: false, message: "Listing not found." };
  if (a._count.bids) return { ok: false, message: "Bids have been placed — contact the concierge to withdraw." };
  await deleteUploads(s.user.id, parseIds(a.imageIds));
  await db.auction.delete({ where: { id } });
  mirror("Auctions", { id, title: a.title, status: "WITHDRAWN" }, "id");
  revalidatePath("/account");
  revalidatePath("/auctions");
  revalidatePath("/admin/auctions");
  return { ok: true, message: "Listing withdrawn." };
}
