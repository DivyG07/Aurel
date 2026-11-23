"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { deleteAccount, updateProfile } from "./actions";
import { withdrawListing } from "@/app/auctions/actions";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { toast } from "@/lib/stores";
import { formatPrice } from "@/lib/format";
import { listingTypeLabel, type AuctionView } from "@/lib/types";

export function ProfileForm({ initial }: { initial: { name: string; bio: string; phone: string; country: string; image: string | null } }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  const [reset, setReset] = useState(0);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) {
      toast(state.message, "success");
      setReset((r) => r + 1);
      router.refresh();
    } else if (state) toast(state.message, "error");
  }, [state, router]);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center gap-5 sm:col-span-2">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-gold/15 text-2xl text-gold">
          {initial.image && !removeAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={initial.image} alt="" className="h-full w-full object-cover" />
          ) : (
            initial.name[0]?.toUpperCase() ?? "?"
          )}
        </div>
        <div>
          <ImagePicker name="avatar" max={1} label="Photo" resetKey={reset} />
          {initial.image && (
            <label className="mt-2 flex items-center gap-2 text-xs text-mist">
              <input type="checkbox" name="removeAvatar" checked={removeAvatar} onChange={(e) => setRemoveAvatar(e.target.checked)} className="accent-[var(--accent)]" /> Remove current photo
            </label>
          )}
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Name</span>
        <input name="name" defaultValue={initial.name} required minLength={2} maxLength={60} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Country</span>
        <input name="country" defaultValue={initial.country} maxLength={60} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Phone (private)</span>
        <input name="phone" type="tel" defaultValue={initial.phone} maxLength={30} className="field" />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Bio (shown on your forum posts)</span>
        <textarea name="bio" defaultValue={initial.bio} maxLength={280} rows={3} className="field" placeholder="Collector of 90s V12s, track-day regular…" />
      </label>
      <div className="sm:col-span-2">
        <button disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save profile"}</button>
      </div>
    </form>
  );
}

type Listing = {
  id: string;
  title: string;
  status: string;
  phase: AuctionView["phase"];
  reviewNote: string | null;
  listingType: AuctionView["listingType"];
  image: string | null;
  startsAt: string;
  endsAt: string;
  bidCount: number;
  currentBid: number | null;
  startingBid: number;
};

const statusText: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "In review", cls: "text-sky-200" },
  REJECTED: { label: "Not approved", cls: "text-red-300" },
  UPCOMING: { label: "Approved · upcoming", cls: "text-gold" },
  LIVE: { label: "Live now", cls: "text-red-300" },
  ENDED: { label: "Closed", cls: "text-mist" },
  CANCELLED: { label: "Cancelled", cls: "text-mist" },
};

export function MyListings({ listings }: { listings: Listing[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!listings.length) return <p className="text-sm text-mist">You haven&apos;t listed a car yet. Dealers and collectors can put cars up for auction.</p>;
  return (
    <ul className="space-y-3">
      {listings.map((l) => {
        const s = statusText[l.phase] ?? statusText.ENDED;
        const editable = l.bidCount === 0 && (l.phase === "PENDING" || l.phase === "REJECTED" || l.phase === "UPCOMING");
        return (
          <li key={l.id} className="flex flex-col gap-4 border border-white/[0.07] bg-onyx p-4 sm:flex-row sm:items-center">
            <div className="h-20 w-32 shrink-0 overflow-hidden bg-graphite">
              {l.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.image} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-mist">{listingTypeLabel[l.listingType]}</p>
              <p className="truncate font-display text-xl">{l.title}</p>
              <p className="mt-1 text-xs">
                <span className={s.cls}>{s.label}</span>
                <span className="text-mist"> · {l.bidCount} bids · {l.currentBid ? `high ${formatPrice(l.currentBid)}` : `from ${formatPrice(l.startingBid)}`}</span>
              </p>
              {l.reviewNote && <p className="mt-1 text-xs text-gold">Reviewer: {l.reviewNote}</p>}
            </div>
            <div className="flex shrink-0 gap-3 text-[11px] uppercase tracking-[0.15em]">
              {l.phase !== "PENDING" && l.phase !== "REJECTED" && <Link href={`/auctions/${l.id}`} className="text-mist hover:text-ivory">View</Link>}
              {editable && <Link href={`/auctions/sell?edit=${l.id}`} className="text-gold hover:text-gold-soft">Edit</Link>}
              {l.bidCount === 0 && (
                <button
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Withdraw “${l.title}”? This removes the listing and its photos.`)) return;
                    start(async () => {
                      const r = await withdrawListing(l.id);
                      toast(r.message, r.ok ? "success" : "error");
                      router.refresh();
                    });
                  }}
                  className="text-red-300/80 hover:text-red-300"
                >
                  Withdraw
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DeleteAccount({ email }: { email: string }) {
  const [state, action, pending] = useActionState(deleteAccount, null);
  const [typed, setTyped] = useState("");
  return (
    <form action={action} className="max-w-lg space-y-3 border border-red-400/20 bg-red-400/[0.03] p-5">
      <p className="text-sm text-ivory/80">This permanently deletes your profile, wishlist, forum posts and replies, and any listings without bids. It can&apos;t be undone.</p>
      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-mist">Type {email} to confirm</span>
        <input name="confirm" value={typed} onChange={(e) => setTyped(e.target.value)} className="field" autoComplete="off" />
      </label>
      {state && !state.ok && <p className="text-sm text-red-300">{state.message}</p>}
      <button disabled={pending || typed.toLowerCase() !== email.toLowerCase()} className="btn border border-red-400/50 text-red-300 hover:bg-red-400/10">{pending ? "Deleting…" : "Delete my account"}</button>
    </form>
  );
}
