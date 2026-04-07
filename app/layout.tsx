import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { auth, signOut } from "@/auth";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Proof Vault",
  description: "Receipts, warranties, and claim-ready packets in one place.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
              Proof Vault
            </Link>
            <nav className="flex flex-wrap items-center justify-end gap-3 text-sm">
              {session?.user ? (
                <>
                  <span className="hidden text-zinc-600 sm:inline">{session.user.email}</span>
                  <Link href="/" className="text-zinc-600 hover:text-zinc-900">
                    Inbox
                  </Link>
                  <Link
                    href="/receipts/new"
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800"
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
                      className="rounded-full border border-zinc-300 px-3 py-1.5 text-zinc-800 hover:bg-zinc-50"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
