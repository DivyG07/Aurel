/**
 * AUREL → Google Sheets live mirror.
 * Paste into Extensions → Apps Script of your sheet, set SECRET, then
 * Deploy → New deployment → Web app (Execute as: Me, Access: Anyone).
 * Put the web-app URL in GOOGLE_SHEETS_WEBHOOK_URL.
 *
 * Accepts POST JSON: { secret, op: "append" | "upsert" | "replace", sheet, row?, key?, rows? }
 */
const SECRET = "PASTE_GOOGLE_SHEETS_SECRET_FROM_.env";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) return json({ ok: false, error: "bad secret" });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(body.sheet) || ss.insertSheet(body.sheet);

    if (body.op === "replace") {
      const rows = body.rows || [];
      sheet.clearContents();
      if (!rows.length) return json({ ok: true, rows: 0 });
      const headers = Object.keys(rows[0]);
      const values = [headers].concat(rows.map((r) => headers.map((h) => r[h])));
      sheet.getRange(1, 1, values.length, headers.length).setValues(values);
      styleHeader(sheet, headers.length);
      return json({ ok: true, rows: rows.length });
    }

    const row = body.row || {};
    const headers = ensureHeaders(sheet, Object.keys(row));
    const values = headers.map((h) => (h in row ? row[h] : ""));

    if (body.op === "upsert" && body.key) {
      const col = headers.indexOf(body.key) + 1;
      const last = sheet.getLastRow();
      if (col > 0 && last > 1) {
        const ids = sheet.getRange(2, col, last - 1, 1).getValues().map((r) => String(r[0]));
        const idx = ids.indexOf(String(row[body.key]));
        if (idx >= 0) {
          // Merge: keep existing cells for fields not sent.
          const range = sheet.getRange(idx + 2, 1, 1, headers.length);
          const existing = range.getValues()[0];
          range.setValues([headers.map((h, i) => (h in row ? row[h] : existing[i]))]);
          return json({ ok: true, updated: true });
        }
      }
    }
    sheet.appendRow(values);
    return json({ ok: true, appended: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function ensureHeaders(sheet, keys) {
  const lastCol = sheet.getLastColumn();
  let headers = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].filter(String) : [];
  const missing = keys.filter((k) => headers.indexOf(k) < 0);
  if (missing.length) {
    headers = headers.concat(missing);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader(sheet, headers.length);
  }
  return headers;
}

function styleHeader(sheet, n) {
  sheet.getRange(1, 1, 1, n).setFontWeight("bold").setBackground("#111111").setFontColor("#c9a96e");
  sheet.setFrozenRows(1);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
