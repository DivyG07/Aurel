"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Car photo that never chops the car. Photos close to the box's shape fill it (cover, anchored a
 * little below centre where cars sit). Much wider photos are shown whole (contain) over a soft,
 * blurred copy of themselves, so the nose and tail stay in frame without ugly bars.
 */
export function CarPhoto({ src, alt, ratio, sizes, priority, className = "", loading }: { src: string; alt: string; ratio: number; sizes: string; priority?: boolean; className?: string; loading?: "eager" | "lazy" }) {
  const [wide, setWide] = useState(false);
  return (
    <>
      {wide && <Image src={src} alt="" aria-hidden fill sizes="64px" className="scale-110 object-cover opacity-60 blur-2xl" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : loading}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalWidth / img.naturalHeight > ratio * 1.14) setWide(true);
        }}
        className={`${wide ? "object-contain" : "object-cover object-[50%_58%]"} ${className}`}
      />
    </>
  );
}
