import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getCarBySlug } from "@/lib/cars";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Standard PDF fonts only cover WinAnsi; replace anything outside it.
const safe = (s: string) =>
  s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E -ÿ–—•…€]/g, "");
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const hex = (h: string) => {
  const n = parseInt(h.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = safe(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > width && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return new Response("Not found", { status: 404 });

  const q = new URL(req.url).searchParams;
  const variant = car.variants.find((v) => v.id === q.get("variant")) ?? car.variants[0];
  const pick = (kind: string, id: string | null) => car.colors.find((c) => c.kind === kind && c.id === id) ?? car.colors.find((c) => c.kind === kind);
  const ext = pick("EXTERIOR", q.get("color"));
  const int = pick("INTERIOR", q.get("interior"));
  const cal = pick("CALIPER", q.get("caliper"));
  const specs = {
    ...car.specs,
    powerHp: variant?.powerHp ?? car.specs.powerHp,
    torqueNm: variant?.torqueNm ?? car.specs.torqueNm,
    zeroToHundred: variant?.zeroToHundred ?? car.specs.zeroToHundred,
    topSpeedKmh: variant?.topSpeedKmh ?? car.specs.topSpeedKmh,
  };
  const lines: [string, number][] = [
    [`${car.brand.name} ${car.model} — base price`, car.priceFrom],
    ...(variant && variant.priceDelta ? [[`Model: ${variant.name}`, variant.priceDelta] as [string, number]] : []),
    ...(ext ? [[`Exterior: ${ext.name}${ext.finish !== "GLOSS" ? ` (${ext.finish.toLowerCase()})` : ""}`, ext.priceDelta] as [string, number]] : []),
    ...(int ? [[`Interior: ${int.name}`, int.priceDelta] as [string, number]] : []),
    ...(cal ? [[`Brake calipers: ${cal.name}`, cal.priceDelta] as [string, number]] : []),
  ];
  const total = lines.reduce((s, [, n]) => s + n, 0);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${car.brand.name} ${car.model} — Specification`);
  pdf.setAuthor(site.name);
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const gold = rgb(0.72, 0.58, 0.33);
  const ink = rgb(0.1, 0.1, 0.11);
  const grey = rgb(0.45, 0.45, 0.47);
  const M = 44;

  const text = (p: PDFPage, s: string, x: number, y: number, size: number, font: PDFFont, color = ink) => p.drawText(safe(s), { x, y, size, font, color });

  // Header band
  page.drawRectangle({ x: 0, y: height - 74, width, height: 74, color: rgb(0.04, 0.04, 0.05) });
  text(page, site.name.split("").join(" "), M, height - 46, 18, serif, rgb(0.95, 0.93, 0.9));
  text(page, "SPECIFICATION & PRICE SHEET", width - M - sans.widthOfTextAtSize("SPECIFICATION & PRICE SHEET", 8), height - 44, 8, sans, gold);

  let y = height - 112;
  text(page, `${car.brand.name.toUpperCase()}  ·  ${car.year}`, M, y, 9, bold, gold);
  y -= 30;
  text(page, car.model, M, y, 28, serif);
  y -= 18;
  for (const l of wrap(car.tagline, sans, 10, width - 2 * M)) {
    text(page, l, M, y, 10, sans, grey);
    y -= 13;
  }

  // Hero photo
  y -= 8;
  const imgH = 220;
  if (car.heroImage) {
    try {
      const res = await fetch(car.heroImage, { headers: { "User-Agent": "AurelShowroom/1.0 (spec sheet)" } });
      const bytes = new Uint8Array(await res.arrayBuffer());
      const img = res.headers.get("content-type")?.includes("png") ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      // Fit the whole photo inside the box on a dark panel — never cropped.
      const boxW = width - 2 * M;
      const scale = Math.min(boxW / img.width, imgH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawRectangle({ x: M, y: y - imgH, width: boxW, height: imgH, color: rgb(0.07, 0.07, 0.08) });
      page.drawImage(img, { x: M + (boxW - w) / 2, y: y - imgH + (imgH - h) / 2, width: w, height: h });
      y -= imgH + 6;
      if (car.heroCredit) text(page, `Photo: ${car.heroCredit.split(" · http")[0]}`.slice(0, 120), M, y - 6, 6.5, sans, grey);
      y -= 30;
    } catch {
      y -= 4;
    }
  }

  // Two columns: price breakdown | performance
  const colW = (width - 2 * M - 24) / 2;
  const top = y;
  const heading = (s: string, x: number, yy: number) => {
    text(page, s.toUpperCase(), x, yy, 8, bold, gold);
    page.drawLine({ start: { x, y: yy - 6 }, end: { x: x + colW, y: yy - 6 }, thickness: 0.6, color: gold });
  };

  heading("Price as configured", M, y);
  y -= 24;
  for (const [label, amount] of lines) {
    const ls = wrap(label, sans, 9, colW - 80);
    ls.forEach((l, i) => text(page, l, M, y - i * 11, 9, sans));
    const a = amount === 0 && label !== lines[0][0] ? "Included" : (amount > 0 && label !== lines[0][0] ? "+" : "") + usd(amount);
    text(page, a, M + colW - sans.widthOfTextAtSize(a, 9), y, 9, sans, amount === 0 ? grey : ink);
    y -= 11 * ls.length + 7;
  }
  page.drawLine({ start: { x: M, y: y + 2 }, end: { x: M + colW, y: y + 2 }, thickness: 0.6, color: rgb(0.8, 0.8, 0.8) });
  y -= 16;
  text(page, "TOTAL (indicative)", M, y, 9, bold);
  text(page, usd(total), M + colW - serif.widthOfTextAtSize(usd(total), 18), y - 3, 18, serif, gold);
  if (ext) {
    y -= 30;
    page.drawCircle({ x: M + 7, y: y + 3, size: 7, color: hex(ext.hex), borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5 });
    text(page, `${ext.name} ${ext.hex.toUpperCase()}`, M + 22, y, 8.5, sans, grey);
  }

  let y2 = top;
  const x2 = M + colW + 24;
  heading("Performance & specification", x2, y2);
  y2 -= 24;
  const rows: [string, string][] = [
    ["Power", `${specs.powerHp} hp`],
    ["Torque", `${specs.torqueNm} Nm`],
    ["0–100 km/h", `${specs.zeroToHundred} s`],
    ["Top speed", `${specs.topSpeedKmh} km/h`],
    ["Engine", specs.engine],
    ["Transmission", specs.transmission],
    ["Drivetrain", specs.drivetrain],
    ["Seats", String(specs.seats)],
    ["Weight", specs.weightKg ? `${specs.weightKg.toLocaleString("en-US")} kg` : "—"],
    ["Origin", car.brand.country],
  ];
  for (const [k, v] of rows) {
    text(page, k, x2, y2, 9, sans, grey);
    const vl = wrap(v, sans, 9, colW - 90);
    vl.forEach((l, i) => text(page, l, x2 + colW - sans.widthOfTextAtSize(l, 9), y2 - i * 11, 9, sans));
    y2 -= 11 * vl.length + 7;
  }

  // Description
  y = Math.min(y, y2) - 34;
  text(page, "ABOUT THIS CAR", M, y, 8, bold, gold);
  y -= 16;
  for (const l of wrap(car.description, serif, 11, width - 2 * M)) {
    if (y < 90) break;
    text(page, l, M, y, 11, serif);
    y -= 15;
  }

  // Footer
  page.drawLine({ start: { x: M, y: 64 }, end: { x: width - M, y: 64 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
  text(page, `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · ${site.email}`, M, 48, 7.5, sans, grey);
  const disc = "Prices and specifications are indicative and subject to confirmation by your advisor. Taxes, duties and delivery not included.";
  wrap(disc, sans, 7, width - 2 * M).forEach((l, i) => text(page, l, M, 36 - i * 9, 7, sans, grey));

  const bytes = await pdf.save();
  const file = `${car.brand.name}-${car.model}-spec-sheet.pdf`.replace(/[^\w.-]+/g, "-");
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "no-store" },
  });
}
