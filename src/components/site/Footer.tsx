import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-onyx">
      <div className="mx-auto grid max-w-[1480px] gap-12 px-5 py-20 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-10">
        <div>
          <p className="font-display text-4xl tracking-[0.35em]">{site.name}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">{site.description}</p>
        </div>
        <div>
          <p className="eyebrow mb-5">Showroom</p>
          <ul className="space-y-3 text-sm text-ivory/70">
            <li><Link href="/cars" className="hover:text-gold">The Collection</Link></li>
            <li><Link href="/#marques" className="hover:text-gold">Brand worlds</Link></li>
            <li><Link href="/compare" className="hover:text-gold">Compare</Link></li>
            <li><Link href="/wishlist" className="hover:text-gold">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-5">Members</p>
          <ul className="space-y-3 text-sm text-ivory/70">
            <li><Link href="/auctions" className="hover:text-gold">Live auctions</Link></li>
            <li><Link href="/account" className="hover:text-gold">My bids</Link></li>
            <li><Link href="/login" className="hover:text-gold">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-5">Concierge</p>
          <p className="text-sm text-ivory/70">{site.email}</p>
          <Link href="/concierge" className="mt-3 inline-block text-sm text-gold hover:text-gold-soft">Book a private viewing →</Link>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-2 px-5 py-6 text-[11px] text-mist md:flex-row md:px-10">
          <p>© {new Date().getFullYear()} {site.name}. All marques are trademarks of their respective owners. Photos via Wikimedia Commons; 3D models via Sketchfab — credited on each page.</p>
          <p>Specifications and prices are indicative.</p>
        </div>
      </div>
    </footer>
  );
}
