// Generates docs/chatbot-knowledge.txt from the live database — upload it to your Zapier chatbot
// as a knowledge source. Re-run after catalogue changes:  npx tsx scripts/chatbot-knowledge.ts
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const SITE = "https://aurel-showroom-divy.netlify.app";
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

async function main() {
  const db = new PrismaClient();
  const [brands, cars, auctions, icons] = await Promise.all([
    db.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { cars: true } } } }),
    db.car.findMany({ include: { brand: true, variants: { orderBy: { sortOrder: "asc" } }, colors: { where: { kind: "EXTERIOR" }, orderBy: { sortOrder: "asc" } } }, orderBy: [{ brand: { name: "asc" } }, { model: "asc" }] }),
    db.auction.findMany({ where: { status: { in: ["SCHEDULED", "LIVE"] }, endsAt: { gt: new Date() } }, include: { car: { include: { brand: true } } }, orderBy: { startsAt: "asc" } }),
    db.celebrity.findMany({ include: { cars: true }, orderBy: { name: "asc" } }),
  ]);

  const L: string[] = [];
  L.push(`# AUREL — The Collector's Showroom: knowledge base`, ``, `Generated ${new Date().toISOString().slice(0, 10)}. Website: ${SITE}`, ``);
  L.push(`## About AUREL`, `AUREL is a private virtual showroom and auction house for luxury and exotic cars. Visitors can explore real cars in 360°, compare up to three cars side by side, enter brand "worlds", bid in live auctions, sell their own car at auction, join the community forum ("The Paddock"), keep a garage of cars they own, and book private viewings with a concierge. Prices on the site are indicative, in US dollars, and exclude taxes, duties and delivery.`, ``);

  L.push(`## How things work`);
  L.push(`- **Sign in / accounts:** Sign in with Google or email and password at ${SITE}/login (protected by a Cloudflare CAPTCHA). New members choose Collector or Dealer and answer four quick questions (account type, top 3 favourite brands, budget and collection size, interests).`);
  L.push(`- **360° view:** Each car page has Photos and a 360° view. Drag to orbit, scroll to zoom. Choosing an exterior colour repaints the 360° model where the model supports it.`);
  L.push(`- **Compare:** Add up to 3 cars with the compare button on any card, then open ${SITE}/compare. The best figure in each row is highlighted.`);
  L.push(`- **Brand worlds:** Choose a marque from "Marques" in the menu to re-skin the whole site in that brand's colours and style. Leave with the "× world" chip.`);
  L.push(`- **Spec sheet PDF:** "Download spec sheet (PDF)" on a car page gives an A4 sheet of the exact configuration and price.`);
  L.push(`- **Auctions:** ${SITE}/auctions. Three kinds of sale: AUREL House sales, Dealers (first-hand / new cars) and Collectors (second-hand / pre-owned). Bids in the final 2 minutes extend the clock (anti-sniping). Some lots have a hidden reserve price. To bid, a member pays a one-time refundable bidder deposit of ₹5,000 (via Razorpay) and becomes a verified bidder.`);
  L.push(`- **Selling a car:** Any signed-in member can list a car at ${SITE}/auctions/sell with photos, starting bid, optional reserve, auction length (1, 3, 5 or 7 days) and start time. Every listing is reviewed by the AUREL team before going live. Sellers can edit or withdraw until bidding opens and cannot bid on their own car.`);
  L.push(`- **Reserving a car:** On an available car's page, "Reserve this car" takes a refundable ₹1,00,000 deposit via Razorpay; the car is held and an advisor calls within one business day.`);
  L.push(`- **Refunds:** Deposits are refundable on request; refunds go back to the original payment method in 5–7 working days.`);
  L.push(`- **Forum ("The Paddock"):** ${SITE}/forum — posts with categories (Discussion, Comparison, Question, Review, Spotted, News), up to 4 photos, threaded replies with photos, up/down votes, sorting by Hot/New/Top. Members can edit or delete their own posts.`);
  L.push(`- **My Garage:** ${SITE}/garage — members record cars they own (from the catalogue or any make), with photos, mileage and value, and can show them publicly in Collectors' Garages (${SITE}/garages).`);
  L.push(`- **Icons:** ${SITE}/icons — famous people and the cars they're publicly reported to own, each with a source.`);
  L.push(`- **Concierge / private viewings:** ${SITE}/concierge or "Request private viewing" on any car page. An advisor replies within one business day. Email: concierge@aurel.example.`);
  L.push(`- **Account:** ${SITE}/account — profile photo, preferences, listings, bids, payments, posts, notifications and account deletion.`, ``);

  L.push(`## Brands (${brands.length})`);
  for (const b of brands) L.push(`- **${b.name}** (${b.country}, founded ${b.founded}) — ${b.tagline ?? ""} · ${b._count.cars} car(s) in the collection · ${SITE}/brands/${b.slug}`);
  L.push(``);

  L.push(`## Cars in the collection (${cars.length})`);
  for (const c of cars) {
    L.push(``, `### ${c.brand.name} ${c.model} (${c.year})`);
    L.push(`${c.tagline}. ${c.description}`);
    L.push(`- Price from: ${usd(c.priceFrom)} (indicative) · Status: ${c.status.replace("_", " ").toLowerCase()}`);
    L.push(`- Engine: ${c.engine} · Power: ${c.powerHp} hp · Torque: ${c.torqueNm} Nm · 0–100 km/h: ${c.zeroToHundred} s · Top speed: ${c.topSpeedKmh} km/h`);
    L.push(`- Drivetrain: ${c.drivetrain} · Transmission: ${c.transmission} · Seats: ${c.seats}${c.weightKg ? ` · Weight: ${c.weightKg.toLocaleString()} kg` : ""}`);
    if (c.variants.length > 1) L.push(`- Variants: ${c.variants.map((v) => `${v.name}${v.priceDelta ? ` (${v.priceDelta > 0 ? "+" : "−"}${usd(Math.abs(v.priceDelta))})` : ""}`).join(", ")}`);
    L.push(`- Exterior colours: ${c.colors.map((x) => x.name).join(", ")}`);
    L.push(`- 360° view: ${c.sketchfabUid ? "yes" : "no"} · Page: ${SITE}/cars/${c.slug}`);
  }
  L.push(``);

  L.push(`## Auctions open or upcoming (${auctions.length})`);
  if (!auctions.length) L.push(`No auctions are scheduled right now — check ${SITE}/auctions for new lots.`);
  for (const a of auctions) L.push(`- **${a.title}** — ${a.listingType === "DEALER" ? "Dealer (first-hand)" : a.listingType === "COLLECTOR" ? "Collector (pre-owned)" : "AUREL House"} · starting bid ${usd(a.startingBid)} · ${a.startsAt.toUTCString()} → ${a.endsAt.toUTCString()} · ${SITE}/auctions/${a.id}`);
  L.push(``);

  L.push(`## Icons and their cars`);
  for (const p of icons) L.push(`- **${p.name}** (${p.profession}): ${p.cars.map((c) => `${c.make} ${c.model}`).join(", ")}`);
  L.push(``, `## Guidance for the assistant`, `Answer only from this knowledge base and general automotive knowledge. Give prices as indicative USD figures. Never promise availability, discounts or delivery dates — offer a private viewing via the concierge instead. For payments, refunds or account problems, direct people to concierge@aurel.example. Keep answers short, warm and refined.`);

  writeFileSync("docs/chatbot-knowledge.txt", L.join("\r\n"));
  console.log(`Wrote docs/chatbot-knowledge.txt — ${cars.length} cars, ${brands.length} brands, ${auctions.length} open auctions, ${icons.length} icons.`);
  await db.$disconnect();
}
main();
