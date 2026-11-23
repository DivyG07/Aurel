"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { signOut } from "next-auth/react";
import { site } from "@/lib/site";
import { themeFor } from "@/lib/themes";
import { useCompare } from "@/lib/stores";
import { useWishlist } from "@/lib/wishlist";
import { HeartIcon } from "./WishlistButton";
import { useBrandWorld } from "./useBrandWorld";
import { BrandMark } from "./BrandMark";
import { WorldLoader } from "./WorldLoader";

export interface HeaderBrand {
  slug: string;
  name: string;
  accentHex: string;
  country: string;
  image: string | null;
}
interface Props {
  user: { name: string | null; email: string | null; image: string | null; role: string } | null;
  brands: HeaderBrand[];
  activeBrand: { slug: string; name: string } | null;
  montage: string[];
}

export function Header({ user, brands, activeBrand, montage }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [worlds, setWorlds] = useState(false);
  const [account, setAccount] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wishCount = useWishlist((s) => s.slugs.length);
  const compareCount = useCompare((s) => s.items.length);
  const pathname = usePathname();
  const { exit } = useBrandWorld();
  // Only the full-bleed heroes get a transparent header; everywhere else it's solid so it never sits on content.
  const overHero = pathname === "/" || pathname.startsWith("/brands/");

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setMenu(false);
    setWorlds(false);
    setAccount(false);
  }, [pathname]);

  const nav = [
    { label: "Collection", href: "/cars" },
    { label: "Marques", onClick: () => setWorlds(true) },
    { label: "Auctions", href: "/auctions", live: true },
    { label: "Forum", href: "/forum" },
    { label: "Icons", href: "/icons" },
    { label: "Compare", href: "/compare", count: mounted ? compareCount : 0 },
    { label: "Concierge", href: "/concierge" },
  ];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 flex h-[72px] items-center transition-colors duration-500 ${
          scrolled || !overHero ? "border-b border-white/[0.06] bg-ink/90 backdrop-blur-xl" : "bg-gradient-to-b from-black/60 to-transparent"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 px-5 md:px-10">
          <div className="flex items-center gap-4">
            <Link href={activeBrand ? `/brands/${activeBrand.slug}` : "/"} className="flex items-center gap-3 font-display text-2xl tracking-[0.35em] text-ivory">
              {activeBrand && <BrandMark slug={activeBrand.slug} name={activeBrand.name} className="h-7 w-7 text-[2.6rem] text-gold" />}
              {site.name}
            </Link>
            {activeBrand && (
              <button
                onClick={() => exit("/")}
                className="hidden items-center gap-2 rounded-full border border-gold/50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-ink sm:flex"
                title="Leave this brand world"
              >
                {activeBrand.name} world <span aria-hidden>×</span>
              </button>
            )}
          </div>

          <nav className="hidden items-center gap-5 xl:gap-8 lg:flex">
            {nav.map((n) => {
              const inner = (
                <>
                  {n.live && <span aria-hidden className="mr-2 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-500" />}
                  {n.label}
                  {!!n.count && <sup className="ml-1 text-[9px] text-gold">{n.count}</sup>}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-all duration-500 ease-lux group-hover:w-full" />
                </>
              );
              const cls = `group relative inline-flex items-center whitespace-nowrap text-[11px] uppercase tracking-[0.22em] xl:tracking-[0.28em] transition hover:text-ivory ${n.href && pathname.startsWith(n.href) ? "text-gold" : "text-ivory/75"}`;
              return n.href ? (
                <Link key={n.label} href={n.href} className={cls}>{inner}</Link>
              ) : (
                <button key={n.label} onClick={n.onClick} className={cls}>{inner}</button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/wishlist" className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 transition hover:border-gold hover:text-gold" aria-label="Wishlist">
              <HeartIcon />
              {mounted && wishCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-semibold text-ink">{wishCount}</span>}
            </Link>

            {user ? (
              <div className="relative">
                <button onClick={() => setAccount((a) => !a)} className="flex items-center gap-2 rounded-full border border-white/10 p-1 pr-3 transition hover:border-gold" aria-expanded={account}>
                  {user.image ? (
                    <Image src={user.image} alt="" width={30} height={30} className="rounded-full" />
                  ) : (
                    <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-gold text-xs font-semibold text-ink">{(user.name ?? user.email ?? "?")[0]?.toUpperCase()}</span>
                  )}
                  <span className="hidden max-w-[110px] truncate text-xs md:inline">{user.name ?? user.email}</span>
                </button>
                <AnimatePresence>
                  {account && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 mt-2 w-56 border border-white/10 bg-onyx p-2 shadow-2xl" style={{ borderRadius: "var(--radius)" }}>
                      <p className="truncate px-3 py-2 text-xs text-mist">{user.email}</p>
                      {user.role === "ADMIN" && <MenuLink href="/admin" label="Admin console" accent />}
                      <MenuLink href="/account" label="My account" />
                      <MenuLink href="/account#profile" label="Change profile photo" />
                      <MenuLink href="/garage" label="My garage" />
                      <MenuLink href="/auctions/sell" label="Sell a car" />
                      <MenuLink href="/forum/new" label="New forum post" />
                      <MenuLink href="/wishlist" label="Wishlist" />
                      <MenuLink href="/compare" label="Compare" />
                      <MenuLink href="/account#danger" label="Delete account" />
                      <button onClick={() => signOut({ redirectTo: "/" })} className="w-full px-3 py-2 text-left text-sm text-ivory/80 hover:bg-white/5 hover:text-ivory">
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-ghost hidden !px-5 !py-2.5 md:inline-flex">
                Sign in
              </Link>
            )}

            <button className="grid h-10 w-10 place-items-center lg:hidden" onClick={() => setMenu((o) => !o)} aria-label="Menu" aria-expanded={menu}>
              <span className="flex w-6 flex-col gap-1.5">
                <span className={`h-px bg-ivory transition ${menu ? "translate-y-[3.5px] rotate-45" : ""}`} />
                <span className={`h-px bg-ivory transition ${menu ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-40 flex flex-col justify-center bg-ink/95 px-8 backdrop-blur-xl lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {nav.map((n, i) => (
              <motion.div key={n.label} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 * i }}>
                {n.href ? (
                  <Link href={n.href} className="block py-3 font-display text-5xl text-ivory">{n.label}</Link>
                ) : (
                  <button onClick={() => { setMenu(false); n.onClick?.(); }} className="block py-3 font-display text-5xl text-ivory">{n.label}</button>
                )}
              </motion.div>
            ))}
            {!user && <Link href="/login" className="btn btn-primary mt-8 w-fit">Sign in</Link>}
            {activeBrand && <button onClick={() => exit("/")} className="btn btn-ghost mt-3 w-fit">Leave {activeBrand.name} world</button>}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{worlds && <BrandWorlds brands={brands} active={activeBrand?.slug ?? null} onClose={() => setWorlds(false)} />}</AnimatePresence>
      <WorldLoader montage={montage} />
    </>
  );
}

function MenuLink({ href, label, accent }: { href: string; label: string; accent?: boolean }) {
  return (
    <Link href={href} className={`block px-3 py-2 text-sm hover:bg-white/5 ${accent ? "text-gold" : "text-ivory/80 hover:text-ivory"}`}>
      {label}
    </Link>
  );
}

function BrandWorlds({ brands, active, onClose }: { brands: HeaderBrand[]; active: string | null; onClose: () => void }) {
  const [q, setQ] = useState("");
  const { enter, exit } = useBrandWorld();
  const list = useMemo(() => brands.filter((b) => `${b.name} ${b.country}`.toLowerCase().includes(q.trim().toLowerCase())), [brands, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[55] overflow-y-auto bg-ink/95 backdrop-blur-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-lenis-prevent>
      <div className="mx-auto max-w-[1480px] px-5 pb-20 pt-8 md:px-10">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Enter a brand world</p>
          <button onClick={onClose} className="text-3xl text-mist hover:text-ivory" aria-label="Close">×</button>
        </div>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search marques…"
          className="mt-8 w-full border-b border-white/15 bg-transparent pb-4 font-display text-4xl outline-none placeholder:text-white/20 focus:border-gold md:text-6xl"
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b, i) => {
            const th = themeFor(b.slug, b.accentHex, b.name);
            return (
              <motion.button
                key={b.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => {
                  onClose();
                  enter(b.slug, b.accentHex, b.name);
                }}
                className="group relative h-52 overflow-hidden border text-left"
                style={{ borderColor: b.slug === active ? th.accent : "rgba(255,255,255,0.08)", background: th.bg }}
              >
                {b.image && <Image src={b.image} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover opacity-45 transition-opacity duration-700 group-hover:opacity-70" />}
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${th.bg} 10%, transparent 70%)` }} />
                <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: th.accent }} />
                <BrandMark slug={b.slug} name={b.name} color={th.accent} className="absolute right-5 top-5 h-10 w-10 text-[3.5rem] opacity-90 transition duration-500 group-hover:scale-110" />
                <div className="absolute bottom-5 left-5">
                  <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: th.accent }}>{b.country}</p>
                  <p
                    className="mt-1 text-4xl"
                    style={{
                      color: th.text,
                      fontFamily: `var(--font-${{ serif: "cormorant", condensed: "barlow", extended: "michroma", geometric: "jost", grotesk: "archivo", tech: "sora" }[th.display]})`,
                      textTransform: th.upper ? "uppercase" : "none",
                      letterSpacing: th.tracking,
                      fontStyle: th.italic ? "italic" : "normal",
                      fontWeight: th.weight,
                      fontSize: th.display === "extended" ? "1.6rem" : undefined,
                    }}
                  >
                    {b.name}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
        {active && (
          <button onClick={() => { onClose(); exit("/"); }} className="btn btn-ghost mt-10">
            Return to AUREL
          </button>
        )}
      </div>
    </motion.div>
  );
}
