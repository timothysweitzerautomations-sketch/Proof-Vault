import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

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
    <div className="mx-auto max-w-sm space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {noOAuth
            ? "Sign-in is turned off until OAuth keys are added on the Mac that runs the app server."
            : "Your receipts stay on your account. Sign in with the provider you use."}
        </p>
        {errorHint ? (
          <div
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-900"
            role="alert"
          >
            {errorHint}
          </div>
        ) : null}
      </div>
      <div className="space-y-3">
        {showGoogle ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: postLoginRedirect() });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-full bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Continue with Google
            </button>
          </form>
        ) : null}
        {showGitHub ? (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: postLoginRedirect() });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-full border border-zinc-300 bg-white py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Continue with GitHub
            </button>
          </form>
        ) : null}
        {noOAuth ? (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
            <p>
              On your Mac, open the project&apos;s <code className="text-xs">.env</code>{" "}
              file. Set real values for{" "}
              <code className="rounded bg-amber-100/80 px-1 text-xs">
                AUTH_GOOGLE_ID
              </code>{" "}
              and{" "}
              <code className="rounded bg-amber-100/80 px-1 text-xs">
                AUTH_GOOGLE_SECRET
              </code>
              , or GitHub <code className="text-xs">AUTH_GITHUB_ID</code> /{" "}
              <code className="text-xs">AUTH_GITHUB_SECRET</code>.
            </p>
            <p>
              Create the client under Google Cloud → APIs &amp; Services →
              Credentials. Pick the <strong>Web application</strong> client type
              (not Android). Add redirect URLs such as{" "}
              <code className="break-all text-xs">
                http://127.0.0.1:3000/api/auth/callback/google
              </code>
              .
            </p>
            <p>
              Save <code className="text-xs">.env</code>, then on the Mac run{" "}
              <code className="text-xs">npm run dev</code> again. Keep USB reverse
              if you use the phone over USB.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
