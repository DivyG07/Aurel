# AUREL: main features (for the presentation)

Live site: https://aurel-showroom-divy.netlify.app · Code: https://github.com/DivyG07/Aurel

## 1. The virtual showroom
- **Real cars, not 3D cartoons.** Every car has real photography and, where available, an interactive **360° model**. You can drag to rotate, zoom, and **recolour the paint live**.
- **HD video:** a fast-cut cinematic reel on the home page, plus a dedicated film for each brand.
- **Interactive car cards:**
  - Slide across a card to flip through its photos.
  - The card has 3D tilt, a light glare and a sweeping accent border.
  - Spec bars (power, 0–100, top speed) charge up on hover.
- **Grid / Showcase views** for the collection, with live filters: marque, body type, budget slider, search and sort.
- **Car detail page:**
  - Gallery and 360° viewer.
  - **Configurator** (paint, interior, calipers, variants) with a live price.
  - 12-month price-history chart.
  - Downloadable **PDF spec sheet**.
- **Compare tray:** pick up to 3 cars and see a side-by-side spec comparison.
- **Wishlist:** save cars to your account.

## 2. Brand worlds
- Choosing a marque (Ferrari, Bugatti, Rolls-Royce, BYD, Pagani… 15 brands) **re-skins the entire website** in that brand's colours, typography and motto.
- A **game-style loading screen** with the brand logo and a photo montage plays while you enter or leave a world.
- Each brand has its own world page with its film, its models and its history.

## 3. Live auctions
- **Timed auctions** with a live countdown, real-time bid updates and **anti-sniping**: a late bid extends the clock.
- **Three listing types:**
  - **House** lots run by AUREL.
  - **Dealer** lots: first-hand cars.
  - **Collector** lots: second-hand cars from members.
- **Sell your car:**
  - Members list their own car with photos, a reserve price and a schedule.
  - Each listing goes to an **admin review queue** before going live.
  - Sellers can edit or withdraw their listing, and can't bid on their own lot.
- **Bidder deposit:** placing bids requires a refundable ₹5,000 deposit paid through Razorpay.

## 4. Community
- **Forum (Reddit-style):**
  - Posts with image uploads, flairs, up/down votes and threaded replies.
  - You can edit or delete your own posts and comments.
  - Admins can pin and lock threads.
- **My Garage:** members add the cars they own, with photos and stories, and can edit or delete them.
- **Collectors' Garages:** browse other members' public garages.
- **Icons:** 15 famous personalities and the cars they own, each with a portrait and a source link for every claim. This includes our professor, Saurabh Kumar, and his black BYD Seal.

## 5. Accounts and personalisation
- **Sign-in:** Google sign-in or email and password.
- **Bot protection:** sign-in and forms are protected by a **Cloudflare Turnstile CAPTCHA**.
- **Onboarding:**
  - New users choose **Collector or Dealer**.
  - They answer 4 preference questions: favourite brands, budget, interests and cars owned.
  - The home page then recommends cars "picked for you".
- **Account page:**
  - Edit your profile and **change your profile photo**.
  - Manage preferences, garage, listings, bids and payment history.
  - Notifications for outbid alerts, listing approvals and similar events.
  - **Delete your account**, which removes your data.
- **Full CRUD on the user side:** forum posts, comments, garage cars, auction listings, profile, wishlist and account.

## 6. Third-party integrations
- **Razorpay payments (test mode):**
  - Bidder deposits and a ₹1,00,000 **car reservation** deposit.
  - Payments are verified twice: by signature and by the Razorpay API.
  - A webhook confirms payments server-side.
  - Admins can issue **refunds** from the console.
- **AI Concierge chatbot (Zapier):** trained on the whole catalogue, auctions and FAQs. It opens from a themed launcher.
- **Google Sheets live mirror:** every sign-in, inquiry, subscriber and payment is copied to a Google Sheet in real time.
- **Google OAuth**, **Cloudflare Turnstile**, **Sketchfab** (360° models) and **Wikimedia Commons** (licensed photos).

## 7. Admin console (restricted to approved admin emails)
- **Dashboard** with key numbers.
- **Login log:** every sign-in with time, method and device.
- **User management:** roles, bans, and verified-bidder status.
- **Catalogue:** add, edit and delete cars and brands (photos, specs, 360° model, colours).
- **Auctions:** create and manage lots, plus a **review queue** to approve or reject member listings.
- **Payments:** see every transaction and refund with one click.
- **Other sections:** Icons manager, inquiries / concierge requests, newsletter subscribers, and Google Sheets sync status.

## 8. Tech and deployment
- **Framework:** Next.js 15 (React 19, server components, server actions), TypeScript and Tailwind CSS.
- **Motion:** Motion for animations and Lenis for smooth scrolling.
- **Database:** PostgreSQL on **Neon** (cloud), accessed through the Prisma ORM. Uploaded images are compressed in the browser and stored in the database.
- **Auth:** Auth.js (JWT sessions).
- **Hosting:** **Netlify**, with **continuous deployment from GitHub**: every push to `main` goes live automatically.
- **Performance:** cached catalogue data, lazy-loaded media, compressed images, and a reduced-motion mode for accessibility.
- **Responsive:** works on phones, tablets and desktops.
