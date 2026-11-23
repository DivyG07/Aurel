import { logoPath } from "@/lib/logos";
import { displayStyle, themeFor } from "@/lib/themes";

/** Brand logo (24×24 icon path) or, when no icon exists, a wordmark in the brand's typeface. */
export function BrandMark({ slug, name, className, color = "currentColor" }: { slug: string; name: string; className?: string; color?: string }) {
  const path = logoPath(slug);
  if (path) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={color} role="img" aria-label={name}>
        <path d={path} />
      </svg>
    );
  }
  const th = themeFor(slug, undefined, name);
  const short = name.replace("Mercedes-", "");
  return (
    <span className={`inline-grid place-items-center leading-none ${className ?? ""}`} style={{ ...displayStyle(th), color }} aria-label={name}>
      <span style={{ fontSize: "0.42em", whiteSpace: "nowrap" }}>{short}</span>
    </span>
  );
}
