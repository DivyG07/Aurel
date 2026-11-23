"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Wishlist kept per browser (localStorage).
interface WishlistState {
  slugs: string[];
  toggle: (slug: string) => boolean; // returns true when added
}

const safeStorage = createJSONStorage(() => {
  try {
    return window.localStorage;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
  }
});

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) => {
        const has = get().slugs.includes(slug);
        set({ slugs: has ? get().slugs.filter((x) => x !== slug) : [...get().slugs, slug] });
        return !has;
      },
    }),
    { name: "aurel-wishlist", storage: safeStorage },
  ),
);
