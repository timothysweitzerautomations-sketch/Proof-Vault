import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { auth, signOut } from "@/auth";
import { LogoMark } from "@/components/LogoMark";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Proof Vault",
  description: "Receipts, warranties, and claim-ready packets in one place.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
};

const focusRing = "outline-none ring-vault-500/40 focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en-US">
      <body
        className={`${geist.variable} ${geistMono.variable} min-h-screen font-sans antialiased text-slate-900`}
      >
        <header className="sticky top-0 z-50 border-b border-vault-700/10 bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/65">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5 sm:py-4 lg:max-w-[min(72rem,calc(100%-2rem))]">
            <Link
              href="/"
              className={`group flex items-center gap-2.5 rounded-lg text-lg font-semibold tracking-tight text-slate-900 ${focusRing}`}
            >
              <LogoMark
                gradientId="pv-logo-header"
                className="h-9 w-9 shadow-sm shadow-vault-900/10 transition group-hover:scale-[1.02]"
              />
              <span className="bg-gradient-to-r from-vault-900 to-vault-600 bg-clip-text text-transparent">
                Proof Vault
              </span>
            </Link>
            <nav className="flex flex-wrap items-center justify-end gap-2 text-sm sm:gap-3">
              {session?.user ? (
                <>
                  <span className="hidden max-w-[12rem] truncate text-slate-500 sm:inline md:max-w-none">
                    {session.user.email}
                  </span>
                  <Link
                    href="/"
                    className={`rounded-full px-2 py-1.5 text-slate-600 transition hover:bg-vault-50 hover:text-vault-900 ${focusRing}`}
                  >
                    Inbox
                  </Link>
                  <Link
                    href="/receipts/new"
                    className={`rounded-full bg-gradient-to-b from-vault-600 to-vault-700 px-3 py-1.5 font-medium text-white shadow-md shadow-vault-900/15 transition hover:from-vault-500 hover:to-vault-600 ${focusRing}`}
                  >
                    Add receipt
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/login" });
                    }}
                  >
                    <button
                      type="submit"
                      className={`rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${focusRing}`}
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className={`rounded-full px-3 py-1.5 font-medium text-vault-800 transition hover:bg-vault-50 ${focusRing}`}
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10 lg:max-w-[min(72rem,calc(100%-2rem))]">
          {children}
        </main>
      </body>
    </html>
  );
}
