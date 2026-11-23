import "server-only";

// Live mirror of key tables into a Google Sheet, via the Apps Script web app in
// docs/google-sheets-apps-script.gs. The app's own database stays the source of
// truth; the sheet is a readable, shareable copy. No-op until configured.

type Row = Record<string, string | number | boolean | null | undefined | Date>;

const url = () => process.env.GOOGLE_SHEETS_WEBHOOK_URL;

function clean(row: Row) {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : (v ?? "")]));
}

async function post(body: object) {
  const target = url();
  if (!target) return { ok: false, skipped: true };
  const res = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: process.env.GOOGLE_SHEETS_SECRET ?? "", ...body }),
    redirect: "follow",
    cache: "no-store",
  });
  const text = await res.text();
  // Google answers with an HTML sign-in page when the web app isn't open to "Anyone".
  if (res.status === 401 || res.status === 403 || /^\s*</.test(text)) {
    const domainLocked = /\/a\/macros\//.test(target);
    return {
      ok: false,
      status: res.status,
      text: domainLocked
        ? "Google blocked the request: this web app is restricted to your organisation's accounts (the URL contains /a/macros/…). Redeploy it with “Who has access: Anyone”, or create the sheet with a personal Gmail account — see docs/GOOGLE_SHEETS.md."
        : "Google returned a sign-in page instead of the script. In Apps Script, set Deploy → Manage deployments → Who has access to “Anyone”, then use the /exec URL.",
    };
  }
  return { ok: res.ok && !/"ok"\s*:\s*false/.test(text), status: res.status, text: text.slice(0, 300) };
}

/** Fire-and-forget: append a row, or upsert it when `key` names the id column. Never throws. */
export function mirror(sheet: string, row: Row, key?: string) {
  if (!url()) return;
  post({ op: key ? "upsert" : "append", sheet, key, row: clean(row) }).catch((e) => console.warn("[sheets] mirror failed:", e?.message));
}

/** Replace a whole tab with `rows` (used by the admin "Sync now" button). */
export async function replaceSheet(sheet: string, rows: Row[]) {
  return post({ op: "replace", sheet, rows: rows.map(clean) });
}

export const sheetsConfigured = () => Boolean(url());
