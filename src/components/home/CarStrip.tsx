import Link from "next/link";
import { CarPhoto } from "@/components/car/CarPhoto";
import type { CarView } from "@/lib/types";
import { formatPrice } from "@/lib/format";

/**
 * One endless, slow row of cars for the home page. Pure CSS animation (no JS), pauses on hover,
 * edges fade into the page. The list is rendered twice so the loop is seamless.
 */
export function CarStrip({ cars }: { cars: CarView[] }) {
  const list = cars.filter((c) => c.heroImage);
  const loop = [...list, ...list];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="car-strip flex w-max gap-6" style={{ ["--strip-duration" as string]: `${list.length * 6}s` }}>
        {loop.map((car, i) => (
          <Link
            key={`${car.id}-${i}`}
            href={`/cars/${car.slug}`}
            aria-hidden={i >= list.length || undefined}
            tabIndex={i >= list.length ? -1 : undefined}
            className="group block w-[78vw] shrink-0 sm:w-[380px]"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-graphite transition-opacity duration-500 group-hover:opacity-85" style={{ borderRadius: "var(--radius)" }}>
              <CarPhoto src={car.heroImage!} alt={`${car.brand.name} ${car.model}`} ratio={1.6} sizes="380px" loading={i < 4 ? "eager" : "lazy"} />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06] transition group-hover:ring-gold/40" style={{ borderRadius: "var(--radius)" }} />
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{car.brand.name}</p>
                <p className="mt-1 truncate font-display text-2xl leading-tight">{car.model}</p>
              </div>
              <p className="shrink-0 text-sm text-mist transition-colors group-hover:text-ivory">{formatPrice(car.priceFrom, { compact: true })}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
