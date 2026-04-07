import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/LogoMark";

/** Match post-login redirect to AUTH_URL so we never mix localhost vs 127.0.0.1 cookies. */
function postLoginRedirect() {
  const base = process.env.AUTH_URL?.trim().replace(/\/$/, "");
  if (base) return `${base}/`;
  return "/";
}

function authErrorHint(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "Configuration":
      return "Sign-in failed on the server (Auth.js reports this generically). Common causes: PostgreSQL not running or wrong DATABASE_URL, missing or invalid AUTH_SECRET, or an OAuth step that lost session cookies (try a normal browser tab at http://localhost:3000/login, not an embedded preview). Check the terminal running `npm run dev` for `[auth]` lines.";
    case "AdapterError":
      return "Signing in failed while talking to the database. Start PostgreSQL (`brew services start postgresql@16` or `npm run db:up`), run `npx prisma db push`, then try again.";
    case "AccessDenied":
      return "Sign-in was denied. Try again, or use a different Google account.";
    case "OAuthCallbackError":
      return "Google could not complete sign-in (often wrong client secret, redirect URI mismatch in Google Cloud Console, or a cancelled login). Verify OAuth credentials and authorized redirect URIs for http://localhost:3000, then try again.";
    default:
      return `Sign-in could not finish (${code}). Try again, or check the terminal where Next.js is running.`;
  }
}

const ring = "outline-none ring-vault-500/30 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorCode } = await searchParams;
  const errorHint = authErrorHint(errorCode);

  const session = await auth();
  if (session?.user) redirect("/");

  const hasGitHub = !!(
    process.env.AUTH_GITHUB_ID?.trim() && process.env.AUTH_GITHUB_SECRET?.trim()
  );
  const hasGoogleEnv = !!(
    process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim()
  );
  const showGoogle = hasGoogleEnv;
  const showGitHub = hasGitHub;
  const noOAuth = !showGoogle && !showGitHub;

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-card sm:p-10">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-vault-400/20 blur-2xl" />
        <div className="relative text-center">
          <LogoMark
            gradientId="pv-logo-login"
            className="mx-auto h-14 w-14 shadow-lg shadow-vault-900/15"
          />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {noOAuth
              ? "Sign-in is turned off until OAuth keys are added on the Mac that runs the app server."
              : "Receipts stay tied to your account. Pick a provider to continue."}
          </p>
          {errorHint ? (
            <div
              className="mt-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-left text-sm text-red-900"
              role="alert"
            >
              {errorHint}
            </div>
          ) : null}
        </div>
        <div className="relative mt-8 space-y-3">
          {showGoogle ? (
            <Link
              href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(postLoginRedirect())}`}
              className={`flex w-full items-center justify-center rounded-full bg-gradient-to-b from-vault-600 to-vault-700 py-3 text-sm font-semibold text-white shadow-md shadow-vault-900/20 transition hover:from-vault-500 hover:to-vault-600 ${ring}`}
              prefetch={false}
            >
              Continue with Google
            </Link>
          ) : null}
          {showGitHub ? (
            <Link
              href={`/api/auth/signin/github?callbackUrl=${encodeURIComponent(postLoginRedirect())}`}
              className={`flex w-full items-center justify-center rounded-full border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 ${ring}`}
              prefetch={false}
            >
              Continue with GitHub
            </Link>
          ) : null}
          {noOAuth ? (
            <div className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 text-left text-sm text-amber-950">
              <p>
                On your Mac, open the project&apos;s <code className="text-xs">.env</code> file. Set real values for{" "}
                <code className="rounded bg-amber-100/90 px-1 text-xs">AUTH_GOOGLE_ID</code> and{" "}
                <code className="rounded bg-amber-100/90 px-1 text-xs">AUTH_GOOGLE_SECRET</code>, or GitHub{" "}
                <code className="text-xs">AUTH_GITHUB_ID</code> / <code className="text-xs">AUTH_GITHUB_SECRET</code>.
              </p>
              <p>
                Create the client under Google Cloud → APIs &amp; Services → Credentials. Pick the <strong>Web application</strong> client type
                (not Android). Add redirect URLs such as{" "}
                <code className="break-all text-xs">http://127.0.0.1:3000/api/auth/callback/google</code>.
              </p>
              <p>
                Save <code className="text-xs">.env</code>, then on the Mac run <code className="text-xs">npm run dev</code> again. Keep USB reverse
                if you use the phone over USB.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
