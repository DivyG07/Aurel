import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[80svh] place-items-center px-5 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-4 font-display text-6xl md:text-8xl">This bay is empty.</h1>
        <p className="mt-4 text-mist">The automobile you&apos;re looking for has left the showroom.</p>
        <Link href="/cars" className="mt-10 inline-block bg-gold px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-ink">
          Browse the collection
        </Link>
      </div>
    </div>
  );
}
