"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { formatPrice } from "@/lib/format";

const W = 1000;
const H = 260;
const PAD = 24;

/** Area chart of indicative market value, with a hover crosshair. */
export function PriceChart({ points }: { points: { date: string; priceUsd: number }[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { xy, line, area, min, max } = useMemo(() => {
    const vals = points.map((p) => p.priceUsd);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const xy = points.map((p, i) => [PAD + (i / (points.length - 1)) * (W - PAD * 2), PAD + (1 - (p.priceUsd - min) / span) * (H - PAD * 2)]);
    const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    return { xy, line, area: `${line} L${W - PAD} ${H} L${PAD} ${H} Z`, min, max };
  }, [points]);

  const first = points[0].priceUsd;
  const last = points[points.length - 1].priceUsd;
  const change = ((last - first) / first) * 100;
  const active = hover ?? points.length - 1;
  const month = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

  return (
    <div className="mt-8 border border-white/[0.07] bg-onyx p-6">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="font-display text-3xl">{formatPrice(points[active].priceUsd)}</p>
        <p className="text-xs text-mist">{month(points[active].date)}</p>
        <p className={`text-xs ${change >= 0 ? "text-emerald-300/90" : "text-red-300"}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% over 12 months
        </p>
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 h-56 w-full touch-none"
        preserveAspectRatio="none"
        onPointerMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          let best = 0;
          xy.forEach(([px], i) => Math.abs(px - x) < Math.abs(xy[best][0] - x) && (best = i));
          setHover(best);
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a96e" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#c9a96e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={PAD} x2={W - PAD} y1={PAD + t * (H - PAD * 2)} y2={PAD + t * (H - PAD * 2)} stroke="#ffffff10" vectorEffect="non-scaling-stroke" />
        ))}
        <motion.path d={area} fill="url(#pc-fill)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4 }} />
        <motion.path
          d={line}
          fill="none"
          stroke="#c9a96e"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <line x1={xy[active][0]} x2={xy[active][0]} y1={PAD / 2} y2={H} stroke="#c9a96e55" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        <circle cx={xy[active][0]} cy={xy[active][1]} r={5} fill="#070708" stroke="#c9a96e" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.2em] text-mist">
        <span>{month(points[0].date)}</span>
        <span>
          Range {formatPrice(min, { compact: true })} – {formatPrice(max, { compact: true })}
        </span>
        <span>{month(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
