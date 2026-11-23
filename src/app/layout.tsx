import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Archivo, Barlow_Condensed, Cormorant_Garamond, Jost, Manrope, Michroma, Sora } from "next/font/google";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { Cursor } from "@/components/site/Cursor";
import { IntroLoader } from "@/components/site/IntroLoader";
import { CompareTray } from "@/components/compare/CompareTray";
import { Toaster } from "@/components/ui/Toaster";
import { BrandMark } from "@/components/site/BrandMark";
import { OnboardingGate } from "@/components/site/OnboardingGate";
import { ZapierChatbot } from "@/components/site/ZapierChatbot";
import { site } from "@/lib/site";
import { COOKIE, themeFor, themeVars } from "@/lib/themes";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "600", "700"], style: ["normal", "italic"], variable: "--font-barlow", preload: false });
const michroma = Michroma({ subsets: ["latin"], weight: "400", variable: "--font-michroma", preload: false });
const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-jost", preload: false });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "700", "800"], variable: "--font-archivo", preload: false });
const sora = Sora({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-sora", preload: false });
const fontVars = [cormorant, manrope, barlow, michroma, jost, archivo, sora].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
};

export const viewport: Viewport = { themeColor: "#070708" };

/** Brand-world atmosphere behind every page: accent glow plus an oversized logo watermark. */
function BrandBackdrop({ slug, name }: { slug: string; name: string }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(70% 55% at 85% 0%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%), radial-gradient(50% 40% at 0% 100%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)" }} />
      <BrandMark slug={slug} name={name} color="var(--accent)" className="absolute -bottom-[10vw] -right-[8vw] h-[55vw] w-[55vw] text-[40vw] opacity-[0.05]" />
    </div>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brandSlug = (await cookies()).get(COOKIE)?.value ?? null;
  const [user, brands, montage] = await Promise.all([
    currentUser(),
    db.brand.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true, accentHex: true, country: true, cars: { select: { heroImage: true }, where: { heroImage: { not: null } }, orderBy: { featured: "desc" }, take: 1 } },
    }),
    db.car.findMany({ where: { heroImage: { not: null } }, select: { heroImage: true }, take: 18 }).then((r) => r.map((c) => c.heroImage!)),
  ]);
  const active = brands.find((b) => b.slug === brandSlug);
  const theme = themeFor(active?.slug, active?.accentHex, active?.name);

  return (
    <html lang="en" className={fontVars} data-brand={theme.slug} style={themeVars(theme) as React.CSSProperties}>
      <body>
        <SmoothScroll>
          <IntroLoader />
          <Cursor />
          <Header
            user={user ? { name: user.name ?? null, email: user.email ?? null, image: user.image ?? null, role: user.role } : null}
            brands={brands.map((b) => ({ slug: b.slug, name: b.name, accentHex: b.accentHex, country: b.country, image: b.cars[0]?.heroImage ?? null }))}
            activeBrand={active ? { slug: active.slug, name: active.name } : null}
            montage={montage}
          />
          {active && <BrandBackdrop slug={active.slug} name={active.name} />}
          <main>{children}</main>
          <Footer />
          <CompareTray />
          <OnboardingGate needed={!!user && !user.onboarded} />
          <ZapierChatbot />
          <Toaster />
        </SmoothScroll>
      </body>
    </html>
  );
}
