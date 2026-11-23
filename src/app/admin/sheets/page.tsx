import { sheetsConfigured } from "@/lib/sheets";
import { PageHead } from "../ui";
import { SyncButton } from "./SyncButton";

export default function SheetsPage() {
  const connected = sheetsConfigured();
  return (
    <>
      <PageHead title="Google Sheets mirror" sub="Users, logins, listings, auctions, bids and inquiries are copied into your Google Sheet as they happen." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="border border-white/[0.07] bg-onyx p-6">
          <p className="eyebrow">Status</p>
          <p className={`mt-3 font-display text-3xl ${connected ? "text-gold" : "text-mist"}`}>{connected ? "Connected" : "Not connected"}</p>
          <p className="mt-2 text-sm text-mist">Live events (sign-ins, new accounts, bids, listing and auction changes) are pushed automatically. Use “Sync everything” to rebuild every tab from the database.</p>
          <div className="mt-6"><SyncButton disabled={!connected} /></div>
        </div>
        <div className="border border-white/[0.07] bg-onyx p-6 text-sm leading-relaxed text-ivory/80">
          <p className="eyebrow mb-3">Setup (5 minutes)</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Create a Google Sheet (sheets.new) while signed in as the admin.</li>
            <li>Extensions → Apps Script. Replace the code with <code className="text-gold">docs/google-sheets-apps-script.gs</code> from this project.</li>
            <li>In the script, set <code className="text-gold">SECRET</code> to the <code className="text-gold">GOOGLE_SHEETS_SECRET</code> value in your <code>.env</code>.</li>
            <li>Deploy → New deployment → Web app. Execute as: <b>Me</b>. Who has access: <b>Anyone</b>. Deploy and authorise.</li>
            <li>Copy the web-app URL into <code className="text-gold">GOOGLE_SHEETS_WEBHOOK_URL</code> in <code>.env</code> and restart the server.</li>
            <li>Come back here and press “Sync everything”.</li>
          </ol>
        </div>
      </div>
    </>
  );
}
