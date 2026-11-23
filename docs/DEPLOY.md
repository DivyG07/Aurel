# Deploying

**Live site:** https://aurel-showroom-divy.netlify.app
**Netlify dashboard:** https://app.netlify.com/projects/aurel-showroom-divy
**Database:** Neon Postgres. The same database is used locally and live, via `DATABASE_URL` and `DIRECT_URL` in `.env` and in Netlify's environment variables.

## Publish changes

```bash
npx netlify-cli deploy --build --prod
```

Stop `npm run dev` first; both use the `.next` folder.

## Changing settings

Local settings live in `.env`. Live settings live in Netlify (Project configuration → Environment variables), or set them from the terminal:

```bash
npx netlify-cli env:set NAME "value"
```

Redeploy after changing a live setting.

## Database schema changes

After editing `prisma/schema.prisma`:

```bash
npx prisma db push
```

This updates the Neon database directly, and the live site uses it immediately.

## Things that differ on Netlify

- **Live auctions:** the auction room checks for new bids every 2.5 seconds instead of streaming them. Netlify functions don't share memory. Locally, `npm run dev` still streams instantly.
- **Visitor access:** visitor protection is turned off for this site. New sites on this Netlify team default to "team members only".
