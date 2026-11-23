# AUREL — The Collector's Showroom

A luxury-car showroom built with Next.js 15, Auth.js, Prisma and Server-Sent Events. It features real cars in 360°, brand worlds, live auctions and an admin console.

## Run it

```bash
npm install
npm run db:setup        # creates prisma/dev.db: 10 brands, 14 cars, demo auctions
npm run dev             # http://localhost:3000
```

## Become the admin

Only emails listed in `ADMIN_EMAILS` (`.env`) can open `/admin`. It is set to **i25divyg@iimidr.ac.in**. Sign in with one of these:

- **Google** (recommended): add Google OAuth keys (see below) and sign in with that Google account.
- **Password**: run this once on your machine, then sign in at `/login` with that email:
  ```bash
  npm run admin:password -- "choose-a-strong-password"
  ```
  Web sign-up is blocked for admin emails, so nobody else can register as the admin.

## Google sign-in

1. Go to <https://console.cloud.google.com/apis/credentials> and choose **Create credentials → OAuth client ID → Web application**.
2. Under **Authorized redirect URIs**, add `http://localhost:3000/api/auth/callback/google` (and your production URL later).
3. Paste the client ID and secret into `.env` as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, then restart.

## CAPTCHA (Cloudflare Turnstile)

Both Google and email/password sign-in require a passed Turnstile challenge, and it is verified on the server. `.env` ships with Cloudflare's public **test keys**, which always pass, so it works locally. Before launch, create real keys at <https://dash.cloudflare.com/?to=/:account/turnstile> and replace `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.

## Google Sheets mirror

Logins, users, listings, auctions and bids are copied live into a Google Sheet. Setup takes about 5 minutes; see [docs/GOOGLE_SHEETS.md](docs/GOOGLE_SHEETS.md).

## Features

| Area | What's there |
|---|---|
| **Real cars** | Wikimedia Commons photos (credited) for every car. Sketchfab 360° models with live repainting where the model allows. A link to each brand's official configurator. |
| **Brand worlds** | Pick a marque from Marques in the header (searchable) or on the home page. The whole site re-skins with that brand's colours, typeface, letter case and button shapes. Leave with the "× world" chip. |
| **Collection** | Real-photo banners that switch angle on hover. Filters for brand, body type and budget, plus search and sort. |
| **Compare** | Up to 3 cars side by side, with per-car variant and colour, best-in-row highlights, a differences-only view and a shareable URL. |
| **Auctions** | Live bidding over Server-Sent Events: watcher count, a countdown corrected to server time, anti-snipe extension, reserve indicator, outbid notifications and automatic settlement. |
| **Accounts** | Google or email sign-in with CAPTCHA. My bids and notifications at `/account`. Wishlist. |
| **Admin** (`/admin`) | Dashboard; full login log (IP and device); accounts (suspend, role, delete); create, edit and delete listings, brands and auctions (with date and time); inquiries; Sheets sync. Every change is audit-logged. |

## Also included

- **Icons** (`/icons`): 14 personalities and 36 publicly reported cars. Each claim links to its press source, and catalog cars show a "Famous owners" section. Manage them in Admin → Icons.
- **PDF spec sheet:** "Download spec sheet" on every car page produces an A4 PDF of the visitor's exact configuration, including the photo, price breakdown and full specification.
- **Hero video reel:** the home banner plays licensed HD clips listed in `src/data/media/videos.json` (Pexels and Pixabay licences: free commercial use, no attribution needed). They are hotlinked from the providers' CDNs for now. Before launch, download them into `public/videos/` and point `src` at `/videos/…`, because Pixabay discourages permanent hotlinking.
- **360° repaint:** colour swatches recolour the real 3D model. The paint material is auto-detected by sampling the car body. If a model recolours the wrong part, put the correct material name in Admin → Listings → Edit → "360° paint material(s)".

## 360° model licensing

The Sketchfab embeds use the Sketchfab player; files are never downloaded or redistributed, and each author is credited. Many of the selected models carry NonCommercial or Editorial licences, though. Before a commercial launch, either get the author's permission, buy a commercial licence, or replace them with OEM-supplied assets. You can swap a model in Admin → Listings → Edit → "Sketchfab model".

## Scaling notes

- The live-auction event bus is in-process, so run a single Node server, or swap `bus` in `src/lib/auctions.ts` for Redis or Ably.
- For production, switch `prisma/schema.prisma` to `postgresql`.
