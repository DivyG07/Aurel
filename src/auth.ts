import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { mirror } from "@/lib/sheets";
import { clientIp, isHuman } from "@/lib/human";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: string; onboarded: boolean } & DefaultSession["user"];
  }
}

export const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
export const isAdminEmail = (email?: string | null) => !!email && adminEmails().includes(email.toLowerCase());
export const googleEnabled = () => Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

class CaptchaRequired extends CredentialsSignin {
  code = "captcha";
}
class Banned extends CredentialsSignin {
  code = "banned";
}

async function logEvent(email: string, provider: string, kind: string, userId?: string) {
  const ip = await clientIp().catch(() => null);
  const ua = (await headers().catch(() => null))?.get("user-agent") ?? null;
  const ev = await db.loginEvent.create({ data: { email, provider, kind, userId, ip, userAgent: ua } });
  mirror("Logins", { id: ev.id, time: ev.createdAt, email, provider, kind, ip, userAgent: ua });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
  providers: [
    ...(googleEnabled() ? [Google({ allowDangerousEmailAccountLinking: true })] : []),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        if (!(await isHuman())) throw new CaptchaRequired();
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
          await logEvent(email || "(blank)", "credentials", "FAILED");
          return null;
        }
        if (user.banned) throw new Banned();
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!(await isHuman())) return "/login?error=captcha";
        if (profile?.email_verified === false) return "/login?error=unverified";
        const existing = user.email ? await db.user.findUnique({ where: { email: user.email.toLowerCase() }, include: { accounts: true } }) : null;
        if (existing?.banned) return "/login?error=banned";
        // Google proves ownership of the email. If a password account was registered for it
        // (emails aren't verified at sign-up), drop that unverified password before linking.
        if (existing?.passwordHash && !existing.accounts.some((a) => a.provider === "google") && !isAdminEmail(existing.email)) {
          await db.user.update({ where: { id: existing.id }, data: { passwordHash: null } });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      const id = (user?.id ?? token.sub) as string | undefined;
      if (!id) return token;
      // Re-read every time so bans and role changes apply immediately.
      const row = await db.user.findUnique({ where: { id }, select: { role: true, banned: true, email: true, name: true, image: true, onboardedAt: true } });
      if (!row || row.banned) return null;
      token.sub = id;
      token.role = isAdminEmail(row.email) ? "ADMIN" : row.role === "ADMIN" || row.role === "SUPERADMIN" ? "COLLECTOR" : row.role;
      token.name = row.name;
      token.picture = row.image;
      token.onboarded = !!row.onboardedAt;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = (token.role as string) ?? "COLLECTOR";
      session.user.onboarded = token.onboarded !== false;
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (!user.id || !user.email) return;
      const u = await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), loginCount: { increment: 1 }, role: isAdminEmail(user.email) ? "ADMIN" : undefined },
      });
      await logEvent(user.email, account?.provider ?? "unknown", isNewUser ? "SIGN_UP" : "SIGN_IN", user.id);
      mirror("Users", { id: u.id, email: u.email, name: u.name, role: u.role, provider: account?.provider, created: u.createdAt, lastLogin: u.lastLoginAt, logins: u.loginCount, banned: u.banned }, "id");
    },
  },
});
