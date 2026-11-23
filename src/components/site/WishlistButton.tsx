"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useWishlist } from "@/lib/wishlist";
import { toast } from "@/lib/stores";

export function HeartIcon({ filled, className = "h-4 w-4" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.4}>
      <path d="M12 20.5s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.2-7.5 10.2Z" />
    </svg>
  );
}

export function WishlistButton({ slug, name, variant = "icon" }: { slug: string; name?: string; variant?: "icon" | "full" }) {
  const toggle = useWishlist((s) => s.toggle);
  const saved = useWishlist((s) => s.slugs.includes(slug));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const on = mounted && saved;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle(slug);
        toast(added ? `${name ?? "Car"} saved to your wishlist` : `${name ?? "Car"} removed from your wishlist`, added ? "success" : "info");
      }}
      aria-pressed={on}
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      className={variant === "icon" ? "grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/40 text-ivory backdrop-blur transition hover:border-gold hover:text-gold" : "btn btn-ghost"}
    >
      <motion.span key={String(on)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} className={on ? "text-gold" : ""}>
        <HeartIcon filled={on} />
      </motion.span>
      {variant === "full" && (on ? "Saved" : "Wishlist")}
    </button>
  );
}
