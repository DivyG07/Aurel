// Sets an email/password login for an admin email listed in ADMIN_EMAILS.
// Web sign-up is blocked for admin emails, so only someone with access to this
// machine can create the admin password. Usage:
//   npm run admin:password -- "your-strong-password"            (first ADMIN_EMAILS entry)
//   npm run admin:password -- "your-strong-password" other@x.com
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/))
    .filter(Boolean)
    .map((m) => [m![1], m![2]]),
);
const admins = (env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim().toLowerCase()).filter(Boolean);
const [password, emailArg] = process.argv.slice(2);
const email = (emailArg ?? admins[0] ?? "").toLowerCase();

async function main() {
  if (!password || password.length < 10) throw new Error("Provide a password of at least 10 characters.");
  if (!admins.includes(email)) throw new Error(`${email || "(none)"} is not in ADMIN_EMAILS.`);
  const db = new PrismaClient();
  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.upsert({ where: { email }, update: { passwordHash, role: "ADMIN" }, create: { email, name: "Admin", passwordHash, role: "ADMIN" } });
  await db.$disconnect();
  console.log(`Admin password set for ${email}. Sign in at /login.`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
