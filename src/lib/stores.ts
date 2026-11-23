"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const safeStorage = createJSONStorage(() => {
  try {
    return window.localStorage;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
  }
});

// ─── Compare (max 3) ─────────────────────────────────────────────────────────
export interface CompareItem {
  slug: string;
  name: string;
  image: string | null;
}
interface CompareState {
  items: CompareItem[];
  toggle: (item: CompareItem) => "added" | "removed" | "full";
  remove: (slug: string) => void;
  clear: () => void;
}
export const MAX_COMPARE = 3;
export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const items = get().items;
        if (items.some((i) => i.slug === item.slug)) {
          set({ items: items.filter((i) => i.slug !== item.slug) });
          return "removed";
        }
        if (items.length >= MAX_COMPARE) return "full";
        set({ items: [...items, item] });
        return "added";
      },
      remove: (slug) => set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
      clear: () => set({ items: [] }),
    }),
    { name: "aurel-compare", storage: safeStorage },
  ),
);

// ─── Toasts ──────────────────────────────────────────────────────────────────
export interface Toast {
  id: number;
  message: string;
  tone: "info" | "success" | "error";
}
interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
}
export const useToasts = create<ToastState>()((set) => ({
  toasts: [],
  push: (message, tone = "info") => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
export const toast = (message: string, tone?: Toast["tone"]) => useToasts.getState().push(message, tone);

// ─── Brand-world transition curtain ─────────────────────────────────────────
export interface CurtainInfo {
  slug: string | null; // null = returning to AUREL
  label: string;
  motto: string;
  color: string;
  key: number;
}
interface CurtainState {
  curtain: CurtainInfo | null;
  show: (info: Omit<CurtainInfo, "key">) => void;
  hide: () => void;
}
export const useCurtain = create<CurtainState>()((set) => ({
  curtain: null,
  show: (info) => set({ curtain: { ...info, key: Date.now() } }),
  hide: () => set({ curtain: null }),
}));
