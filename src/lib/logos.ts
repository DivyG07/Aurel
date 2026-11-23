import { siAstonmartin, siBentley, siBugatti, siFerrari, siLamborghini, siMclaren, siPorsche, siRollsroyce } from "simple-icons";

// Monochrome brand marks from Simple Icons (CC0 icon data; the marks remain
// trademarks of their owners). Brands without an icon fall back to a wordmark.
const icons: Record<string, { path: string; title: string }> = {
  ferrari: siFerrari,
  lamborghini: siLamborghini,
  bugatti: siBugatti,
  "rolls-royce": siRollsroyce,
  bentley: siBentley,
  "aston-martin": siAstonmartin,
  mclaren: siMclaren,
  porsche: siPorsche,
};

export const logoPath = (slug: string | null | undefined) => (slug ? (icons[slug]?.path ?? null) : null);
