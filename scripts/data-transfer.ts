// Moves all rows between databases via a JSON file (e.g. local SQLite → hosted Postgres).
//   npx tsx scripts/data-transfer.ts export   → writes prisma/data-export.json from DATABASE_URL
//   npx tsx scripts/data-transfer.ts import   → loads it into DATABASE_URL (schema must exist; run `prisma db push` first)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const FILE = "prisma/data-export.json";
// Parents before children so foreign keys resolve on import.
const MODELS = [
  "user", "account", "session", "verificationToken", "loginEvent",
  "brand", "car", "carVariant", "carColor", "carMedia", "priceHistory", "provenanceEvent",
  "wishlistItem", "comparison", "savedConfiguration", "garageCar",
  "auction", "bid", "celebrity", "celebrityCar",
  "inquiry", "chatConversation", "chatMessage", "notification", "subscriber", "event", "auditLog", "siteSetting",
] as const;

const DATE_KEYS = /(At|^expires|^emailVerified|^date|^recordedAt|^startsAt|^endsAt|^preferredAt|^lastLoginAt)$/;
type Delegate = { findMany: () => Promise<Record<string, unknown>[]>; createMany: (a: { data: unknown[] }) => Promise<{ count: number }>; count: () => Promise<number> };

async function main() {
  const mode = process.argv[2];
  const db = new PrismaClient();
  const model = (m: string) => (db as unknown as Record<string, Delegate>)[m];

  if (mode === "export") {
    const out: Record<string, unknown[]> = {};
    for (const m of MODELS) out[m] = await model(m).findMany();
    writeFileSync(FILE, JSON.stringify(out, null, 1));
    console.log(`Exported ${Object.entries(out).map(([k, v]) => `${v.length} ${k}`).filter((s) => !s.startsWith("0 ")).join(", ")} → ${FILE}`);
  } else if (mode === "import") {
    if (!existsSync(FILE)) throw new Error(`${FILE} not found — run export first.`);
    const data = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, Record<string, unknown>[]>;
    for (const m of MODELS) {
      const rows = (data[m] ?? []).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" && DATE_KEYS.test(k) ? new Date(v) : v])));
      if (!rows.length) continue;
      if ((await model(m).count()) > 0) {
        console.log(`skip ${m}: target already has rows`);
        continue;
      }
      const { count } = await model(m).createMany({ data: rows });
      console.log(`imported ${count} ${m}`);
    }
  } else {
    console.log("Usage: tsx scripts/data-transfer.ts export|import");
  }
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
