# Roadmap

Effort: S = small, M = medium, L = large.

## Milestone 2: Accounts & collector tools
- Auth.js v5: Google OAuth plus email magic link, with a Prisma adapter. **Cloudflare Turnstile** CAPTCHA on sign-up, inquiries and bids (it's free and invisible).
- Sync the wishlist to `WishlistItem` on sign-in. Price-drop alerts (M).
- **Compare**: up to 3 cars side by side, with colour/variant pickers, spec deltas, a radar chart and a shareable link (`Comparison.shareCode`) (M).
- Saved configurations with share links (`SavedConfiguration`) (S).
- **AI Concierge**: a Claude-powered chat with tool calls (search inventory, compare, book a viewing) and handoff to a human advisor. Stored in `ChatConversation` (M).
- Finance/lease calculator and live currency conversion through Frankfurter/ECB (S).

## Milestone 3: Admin backend (`/admin`)
- Roles: SUPERADMIN, ADMIN, DEALER (sales), plus content editor. Enforced on the server in middleware and server actions. 2FA for admins.
- Inventory CMS: cars, variants, colours and media. Upload `.glb` files and auto-optimise them with `gltf-transform` (meshopt + KTX2). Draft/publish states.
- Lead pipeline: a kanban for `Inquiry` (NEW → CONTACTED → SCHEDULED → WON/LOST), assignment, and chat transcripts attached.
- Analytics: views per car, viewer engagement, wishlist counts, and funnel (PostHog).
- Append-only `AuditLog` for every price, bid and status change.

## Milestone 4: Live auctions
- Socket.io (needs a long-running Node host) or Ably/Pusher if deploying serverless.
- Countdowns, outbid notifications, anti-snipe extension (`antiSnipeSecs`), proxy bidding (`maxAuto`), reserve-met indicator.
- Bidder verification. Deposits through a Stripe SetupIntent, charging the saved card only on a win. Note that Stripe is not escrow; full-value deals need a licensed escrow provider.

## Milestone 5: Icons & their cars
- Celebrity profiles linked to catalog cars. **Every ownership claim needs a public `sourceUrl`** (required in the schema) to manage defamation and publicity-rights risk. Admin moderation before publishing.

## Backlog: dynamic features
| Feature | Effort |
|---|---|
| Lighting presets (studio / sunset / night garage) | S |
| Engine start/rev audio on the car page | S |
| Opening doors and bonnet animations (needs rigged GLB) | M |
| AR "in your driveway" via `<model-viewer>` / Quick Look | M |
| Scroll-scrubbed "story of the car" film | M |
| Provenance timeline (`ProvenanceEvent`) | M |
| VIN decode and recalls via NHTSA vPIC (free) | S |
| Collector garages: public portfolios (`GarageCar`) | M |
| Events calendar with RSVP (`Event`) | S |
| Shipping and import-duty landed-cost estimator | M |
| Members-only off-market listings | M |
| Web push via OneSignal | S |
| Bloom/post-processing and WebGPU renderer | M |

## Integrations shortlist
| Need | Pick | Free tier |
|---|---|---|
| CAPTCHA | Cloudflare Turnstile | Free, unlimited |
| Realtime | Ably (serverless) / Socket.io (self-host) | Ably 6M msgs/mo |
| Email | Resend + React Email | Yes |
| Media CDN | Cloudinary; Mux for video | Yes |
| Booking | Cal.com embed | Yes |
| CRM | HubSpot | Free CRM |
| Live chat / WhatsApp | Crisp or Tawk.to; WhatsApp Business via Twilio | Tawk free |
| Search | Meilisearch | Open source |
| Analytics | PostHog (+ GA4) | 1M events/mo |
| Errors | Sentry | Developer plan |
| Market values | MarketCheck API | 500 calls/mo |

Check these free-tier figures on each vendor's pricing page before committing.
