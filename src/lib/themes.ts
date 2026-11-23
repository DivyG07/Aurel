// Brand worlds. Selecting a marque re-skins the whole site with its own palette,
// typography and shape language. Brands added in the admin without a preset get
// a theme derived from their accent colour.

export type DisplayFont = "serif" | "condensed" | "extended" | "geometric" | "grotesk" | "tech";

export interface Theme {
  slug: string;
  name: string;
  accent: string;
  accentSoft: string;
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  display: DisplayFont;
  upper: boolean;
  tracking: string; // display letter-spacing
  italic: boolean;
  weight: number;
  radius: string;
  motto: string;
}

export const COOKIE = "aurel-brand";

export const baseTheme: Theme = {
  slug: "aurel",
  name: "AUREL",
  accent: "#c9a96e",
  accentSoft: "#e6d3a8",
  bg: "#070708",
  surface: "#0f0f11",
  surface2: "#19191c",
  text: "#f3eee5",
  muted: "#8f8b84",
  display: "serif",
  upper: false,
  tracking: "-0.01em",
  italic: false,
  weight: 300,
  radius: "0px",
  motto: "The Collector's Showroom",
};

const t = (p: Partial<Theme> & Pick<Theme, "slug" | "name">): Theme => ({ ...baseTheme, ...p });

export const themes: Record<string, Theme> = {
  ferrari: t({ slug: "ferrari", name: "Ferrari", accent: "#ffcc00", accentSoft: "#ffe680", bg: "#2a0606", surface: "#380a0a", surface2: "#4a0e0e", text: "#fff4ef", muted: "#d3a59f", display: "condensed", upper: true, italic: true, tracking: "0.01em", weight: 600, motto: "Born in Maranello, raised on the circuit" }),
  lamborghini: t({ slug: "lamborghini", name: "Lamborghini", accent: "#ffc400", accentSoft: "#ffe066", bg: "#16130a", surface: "#221d0c", surface2: "#2e2710", text: "#fbf7e8", muted: "#b3aa86", display: "extended", upper: true, tracking: "0.06em", weight: 400, motto: "Expect the unexpected" }),
  bugatti: t({ slug: "bugatti", name: "Bugatti", accent: "#8fb8ff", accentSoft: "#c4d9ff", bg: "#071633", surface: "#0c2148", surface2: "#12295a", text: "#eef4ff", muted: "#93a6c9", display: "geometric", upper: true, tracking: "0.28em", weight: 300, motto: "Art, Forme, Technique" }),
  "rolls-royce": t({ slug: "rolls-royce", name: "Rolls-Royce", accent: "#e0d8f2", accentSoft: "#f3eefc", bg: "#1b1230", surface: "#251a3f", surface2: "#30224f", text: "#f6f3fc", muted: "#a99cc6", display: "serif", tracking: "0.01em", weight: 300, motto: "Strive for perfection in everything" }),
  bentley: t({ slug: "bentley", name: "Bentley", accent: "#d6b479", accentSoft: "#efd6a8", bg: "#0a2418", surface: "#0f3122", surface2: "#153d2b", text: "#f3f0e4", muted: "#9db5a2", display: "serif", italic: true, weight: 400, motto: "Extraordinary journeys, handcrafted in Crewe" }),
  "aston-martin": t({ slug: "aston-martin", name: "Aston Martin", accent: "#9fe3c9", accentSoft: "#cff5e6", bg: "#032a25", surface: "#06392f", surface2: "#0a4638", text: "#effaf6", muted: "#8fb8ab", display: "geometric", upper: true, tracking: "0.22em", weight: 300, motto: "Intensity. Driven by soul" }),
  mclaren: t({ slug: "mclaren", name: "McLaren", accent: "#ff8a1f", accentSoft: "#ffbb75", bg: "#2a1300", surface: "#381a02", surface2: "#46220a", text: "#fff6ec", muted: "#c9a07a", display: "grotesk", upper: true, tracking: "-0.01em", weight: 700, radius: "2px", motto: "Fearlessly forward" }),
  porsche: t({ slug: "porsche", name: "Porsche", accent: "#e0102f", accentSoft: "#ff6276", bg: "#1b1c21", surface: "#25262c", surface2: "#303139", text: "#f5f5f7", muted: "#9b9ca8", display: "grotesk", tracking: "-0.03em", weight: 500, radius: "4px", motto: "There is no substitute" }),
  maybach: t({ slug: "maybach", name: "Mercedes-Maybach", accent: "#e6bca4", accentSoft: "#f5dccd", bg: "#24170f", surface: "#2f2015", surface2: "#3b291c", text: "#fbf3ee", muted: "#b9a090", display: "serif", upper: true, tracking: "0.18em", weight: 300, motto: "Exclusive by nature" }),
  byd: t({ slug: "byd", name: "BYD", accent: "#5ee6ff", accentSoft: "#a6f2ff", bg: "#061a40", surface: "#0b2454", surface2: "#112e66", text: "#eef6ff", muted: "#8ea6cf", display: "tech", tracking: "-0.02em", weight: 600, radius: "12px", motto: "Build your dreams" }),
};

export function themeFor(slug: string | null | undefined, accentHex?: string, name?: string): Theme {
  if (!slug || slug === "aurel") return baseTheme;
  if (themes[slug]) return themes[slug];
  if (accentHex) return t({ slug, name: name ?? slug, accent: accentHex, accentSoft: accentHex, motto: name ?? "" });
  return baseTheme;
}

const fontVar: Record<DisplayFont, string> = {
  serif: "var(--font-cormorant)",
  condensed: "var(--font-barlow)",
  extended: "var(--font-michroma)",
  geometric: "var(--font-jost)",
  grotesk: "var(--font-archivo)",
  tech: "var(--font-sora)",
};

/** Inline style for rendering a brand's display type outside its own world (pickers, loading screen). */
export function displayStyle(th: Theme): React.CSSProperties {
  return {
    fontFamily: fontVar[th.display],
    textTransform: th.upper ? "uppercase" : "none",
    letterSpacing: th.tracking,
    fontStyle: th.italic ? "italic" : "normal",
    fontWeight: th.weight,
  };
}

/** CSS custom properties consumed by globals.css. */
export function themeVars(th: Theme): Record<string, string> {
  return {
    "--accent": th.accent,
    "--accent-soft": th.accentSoft,
    "--bg": th.bg,
    "--surface": th.surface,
    "--surface-2": th.surface2,
    "--text": th.text,
    "--muted": th.muted,
    "--display-font": fontVar[th.display],
    "--display-case": th.upper ? "uppercase" : "none",
    "--display-tracking": th.tracking,
    "--display-style": th.italic ? "italic" : "normal",
    "--display-weight": String(th.weight),
    "--radius": th.radius,
  };
}
