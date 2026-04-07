import type { CapacitorConfig } from "@capacitor/cli";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** `npx cap sync` does not load `.env`; read APP_URL so the APK matches NextAuth / AUTH_URL. */
function appUrlFromDotEnv(): string | undefined {
  const p = join(process.cwd(), ".env");
  if (!existsSync(p)) return undefined;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const eq = s.indexOf("=");
    if (eq === -1) continue;
    const k = s.slice(0, eq).trim();
    if (k !== "APP_URL") continue;
    let v = s.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    return v.trim() || undefined;
  }
  return undefined;
}

/**
 * WebView loads this URL. Dev: keep APP_URL in `.env` as http://localhost:3000 (stale http://
 * in the shell must not override). Production APK: pass `PROOF_VAULT_SERVER_URL=https://…`
 * so a real https build wins over local `.env`.
 */
function resolveCapServerUrl(): string {
  const proof = process.env.PROOF_VAULT_SERVER_URL?.trim();
  if (proof?.startsWith("https://")) return proof;

  const fromDotEnv = appUrlFromDotEnv();
  if (fromDotEnv) return fromDotEnv;

  if (proof) return proof;

  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) return appUrl;

  return "http://localhost:3000";
}

const url = resolveCapServerUrl();

const isHttp = url.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.proofvault.app",
  appName: "Proof Vault",
  webDir: "www",
  server: {
    url,
    cleartext: isHttp,
    androidScheme: isHttp ? "http" : "https",
  },
};

export default config;
