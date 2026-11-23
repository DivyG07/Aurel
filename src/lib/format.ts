export function formatPrice(usd: number, opts: { compact?: boolean } = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: opts.compact ? 1 : 0,
    notation: opts.compact ? "compact" : "standard",
  }).format(usd);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}
