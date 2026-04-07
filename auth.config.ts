import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

const authUrl = process.env.AUTH_URL?.trim() ?? "";
/** http:// dev (or unset AUTH_URL): disable PKCE cookie checks; https:// production: use defaults. */
const isLocalHttpDev = !authUrl.startsWith("https://");

const providers: NextAuthConfig["providers"] = [];

const googleId = process.env.AUTH_GOOGLE_ID?.trim();
const googleSecret = process.env.AUTH_GOOGLE_SECRET?.trim();

if (googleId && googleSecret) {
  providers.push(
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
      allowDangerousEmailAccountLinking: true,
      // Default is ["pkce"]. On http://localhost or device WebViews, the PKCE cookie is
      // often missing on return → InvalidCheck → generic "Configuration" error in the UI.
      // For https:// production, omit this so PKCE stays enabled.
      ...(isLocalHttpDev ? { checks: ["none"] as const } : {}),
    })
  );
}

const githubId = process.env.AUTH_GITHUB_ID?.trim();
const githubSecret = process.env.AUTH_GITHUB_SECRET?.trim();

if (githubId && githubSecret) {
  providers.push(
    GitHub({
      clientId: githubId,
      clientSecret: githubSecret,
      allowDangerousEmailAccountLinking: true,
      ...(isLocalHttpDev ? { checks: ["none"] as const } : {}),
    })
  );
}

export default {
  trustHost: true,
  debug: process.env.NODE_ENV !== "production",
  useSecureCookies: authUrl.startsWith("https://"),
  providers,
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path === "/login" || path.startsWith("/login/")) return true;
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
