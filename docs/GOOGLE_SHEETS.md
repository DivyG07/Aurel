# Google Sheets live mirror

The app's own database is the source of truth. Live auctions need fast, transactional writes, and Google Sheets is rate-limited, so it can't be the primary store. Every important event is copied to a Google Sheet as it happens:

| Tab | Written when |
|---|---|
| **Logins** | Every sign-in, sign-up and failed password attempt (email, method, IP, device) |
| **Users** | An account is created or signs in, or the admin suspends it, changes its role or deletes it |
| **Listings** | The admin creates, edits or deletes a car |
| **Auctions** | An auction is scheduled, edited, cancelled or settled |
| **Bids** | Every bid |
| **Inquiries** | Every private-viewing, test-drive and concierge form submission; status changes made in the admin |
| **Subscribers** | Every "Request access" newsletter sign-up |

## Setup

1. Sign in to Google as the admin and create a sheet at <https://sheets.new>.
2. Open **Extensions → Apps Script**. Delete the starter code and paste in [`google-sheets-apps-script.gs`](./google-sheets-apps-script.gs).
3. Set `SECRET` at the top of the script to the `GOOGLE_SHEETS_SECRET` value from your `.env`.
4. Click **Deploy → New deployment**, choose **Web app**, set *Execute as* to **Me** and *Who has access* to **Anyone**, then click **Deploy** and authorise it.
5. Copy the web-app URL (`https://script.google.com/macros/s/…/exec`) into `.env`:
   ```
   GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/…/exec"
   ```
6. Restart `npm run dev`. Open **/admin/sheets** and press **Sync everything now**.

**Using a Google Workspace account (e.g. a university or company email)?** If your web-app URL looks like `https://script.google.com/a/macros/yourdomain/s/…/exec`, the app is restricted to your organisation and the server will be refused (HTTP 401). Redeploy with **Who has access: Anyone**. If your organisation doesn't offer that option, create the sheet and script with a personal Gmail account instead. The correct URL looks like `https://script.google.com/macros/s/…/exec`.

The shared secret means only your server can write to the sheet. "Anyone" access is required for the server to reach the script, but requests without the secret are rejected. If you edit the script later, deploy a **new version** of the same deployment so the URL stays the same.
