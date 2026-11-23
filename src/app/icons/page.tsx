import type { Metadata } from "next";
import { getIcons } from "@/lib/icons";
import { IconsClient } from "./IconsClient";

export const metadata: Metadata = { title: "Icons & Their Cars" };
export const dynamic = "force-dynamic";

export default async function IconsPage() {
  const icons = await getIcons();
  return (
    <div className="mx-auto max-w-[1480px] px-5 pb-28 pt-32 md:px-10">
      <p className="eyebrow">Icons & their cars</p>
      <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.02] md:text-7xl">
        Who drives <span className="text-gilded">what.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-mist">
        The publicly reported garages of {icons.length} footballers, drivers, musicians, actors and cricketers. Every entry links to the article it comes from.
      </p>
      <IconsClient icons={icons} />
      <p className="mt-16 max-w-3xl text-xs leading-relaxed text-mist">
        Ownership details are compiled from published press reports and may be out of date. Some cars have since been sold, and the stories say so where reported. No person listed is affiliated with, or endorses, this showroom. If something is wrong, contact the concierge and we&apos;ll correct it.
      </p>
    </div>
  );
}
