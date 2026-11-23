/** Shown instantly on navigation while the next page renders, so a click always gets feedback. */
export default function Loading() {
  return (
    <div className="min-h-[100svh]" aria-busy="true" aria-live="polite">
      <div className="fixed inset-x-0 top-0 z-[80] h-[2px] overflow-hidden">
        <div className="page-progress h-full w-1/3 bg-gold" />
      </div>
      <div className="mx-auto max-w-[1480px] px-5 pt-40 md:px-10">
        <div className="h-3 w-32 animate-pulse bg-white/[0.06]" />
        <div className="mt-6 h-14 w-2/3 max-w-xl animate-pulse bg-white/[0.05]" />
        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse bg-white/[0.04]" style={{ borderRadius: "var(--radius)", animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
