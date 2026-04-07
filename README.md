# Proof Vault

Next.js app for receipts, warranty dates, PDF claim packs, and **email reminders** (via Resend + daily cron).

## Local setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL (Docker):

   ```bash
   docker compose up -d
   ```

3. Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and at least one OAuth provider (`AUTH_GOOGLE_*` or `AUTH_GITHUB_*`) in `.env`.

4. Install and migrate:

   ```bash
   npm install
   npx prisma db push
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000), sign in, add receipts.

### Open Proof Vault on your Android phone (from your Mac)

The dev server listens on **all interfaces** (`0.0.0.0:3000`) so your phone can reach it.

#### Option A — USB cable + `adb reverse` (good with “data” USB)

1. On the phone: **Settings → Developer options → USB debugging** on. Plug in the cable; tap **Allow** when the Mac is prompted.
2. On the Mac, confirm the device shows up:

   ```bash
   adb devices
   ```

   If `adb` is missing: `brew install android-platform-tools`

3. Forward the dev port so the phone’s `localhost:3000` hits your Mac:

   ```bash
   cd /path/to/proof-vault
   npm run android:reverse
   npm run dev
   ```

   Or one command:

   ```bash
   npm run dev:android-usb
   ```

   **All-in-one** (checks USB, `adb reverse`, Docker Postgres, `db push`, then dev):

   ```bash
   npm run android:start
   ```

4. On the phone, open Chrome and go to: **http://127.0.0.1:3000**

5. **Google sign-in:** In [Google Cloud Console](https://console.cloud.google.com/) → your OAuth client, add **Authorized JavaScript origins** and **Authorized redirect URI**:
   - `http://127.0.0.1:3000`
   - `http://127.0.0.1:3000/api/auth/callback/google`  
   Set `AUTH_URL` and `APP_URL` in `.env` to `http://127.0.0.1:3000` while testing this way (then change back for desktop if you like).

#### Option B — Same Wi‑Fi (no `adb`)

1. Start the app: `npm run dev`
2. On the Mac, get your LAN IP (often Wi‑Fi):

   ```bash
   ipconfig getifaddr en0
   ```

3. On the phone (same Wi‑Fi), open **http://YOUR_MAC_IP:3000** (example `http://192.168.1.24:3000`).
4. If it doesn’t load, check **macOS Firewall** (allow **Node** / incoming for port 3000).
5. Add that exact `http://YOUR_MAC_IP:3000` origin and `.../api/auth/callback/google` redirect in Google OAuth, and set `AUTH_URL` / `APP_URL` to match.

Reconnecting the USB cable can clear `adb reverse`; run `npm run android:reverse` again if `127.0.0.1:3000` stops working on the phone.

### Android APK (Capacitor WebView)

The app is still your **hosted Next.js site**; the APK is a **thin shell** that opens that URL (default `http://127.0.0.1:3000` after USB reverse + `npm run dev`, or your production `https://` URL).

**Requirements on the Mac:** **JDK 21+** (Capacitor 7’s Android module targets Java 21). Homebrew: `brew install openjdk@21`, then e.g. `export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`. Also [Android Studio](https://developer.android.com/studio) or Homebrew `android-commandlinetools` with `ANDROID_HOME` set.

**Build and install on a connected, authorized phone:**

```bash
cd /path/to/proof-vault
# Optional: point at production instead of local dev
# export PROOF_VAULT_SERVER_URL=https://your-deployment.example.com
npm run android:apk
```

If Gradle fails inside Cursor (“local IP” / `getifaddrs`), run the same steps in **Terminal.app**:

```bash
cd /path/to/receipt-warranty-vault
npm run android:build-terminal
```

This runs `cap sync`, `assembleDebug`, then `adb install` if a device is listed under `adb devices`. The debug APK path is:

`android/app/build/outputs/apk/debug/app-debug.apk`

For **local dev** with the APK: keep `PROOF_VAULT_SERVER_URL=http://127.0.0.1:3000`, run `adb reverse tcp:3000 tcp:3000`, start `npm run dev` on the Mac, then open the installed app.

### Uploads

- **Local:** files are stored under `uploads/`.
- **Vercel:** set `BLOB_READ_WRITE_TOKEN` (Vercel Blob). Without it, serverless disk is ephemeral — use Blob in production.

## Ship it (production site + APK that works without your Mac)

Do this **in order** so OAuth, uploads, and the Android shell all point at the same HTTPS origin.

### 1. Host the Next.js app

- Push the repo to GitHub (or GitLab / Bitbucket) and [import it in Vercel](https://vercel.com/new), or use `vercel link` + `vercel --prod` from your machine.
- Pick a stable URL (e.g. `https://proof-vault.vercel.app` or a custom domain). Call it **`ORIGIN`** below.

### 2. Production database

- Create Postgres ([Neon](https://neon.tech), [Supabase](https://supabase.com), etc.).
- In Vercel → Project → **Settings → Environment Variables**, set `DATABASE_URL` for **Production**.

### 3. Vercel environment variables (Production)

Set at least:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | From step 2 |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | **`ORIGIN`** (e.g. `https://proof-vault.vercel.app`, no trailing slash) |
| `APP_URL` | Same as `AUTH_URL` unless you use a different public URL for emails |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Web OAuth client |
| `BLOB_READ_WRITE_TOKEN` | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) — **required** so uploads survive serverless (without it, disk is ephemeral) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Reminder emails |
| `CRON_SECRET` | Random string; cron route checks `Authorization: Bearer …` |

Redeploy after changing env vars.

### 4. Database schema once

From your laptop (safe if `DATABASE_URL` is only in your shell temporarily):

```bash
cd /path/to/receipt-warranty-vault
export DATABASE_URL="postgresql://…production…"
npx prisma db push
```

### 5. Google OAuth (production)

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your **Web application** client:

- **Authorized JavaScript origins:** `ORIGIN`
- **Authorized redirect URIs:** `ORIGIN/api/auth/callback/google`

If the app is in *Testing* on the consent screen, add real users under **Test users**.

### 6. Smoke-test the website

Open **`ORIGIN`** in a desktop browser, sign in with Google, add a receipt with a file (confirms Blob + DB).

### 7. Cron (reminders)

`vercel.json` schedules `/api/cron/reminders` daily **14:00 UTC**. That requires a [Vercel plan with Cron Jobs](https://vercel.com/docs/cron-jobs). With `CRON_SECRET` set, Vercel sends `Authorization: Bearer <CRON_SECRET>`.

Manual run:

```bash
curl -s "ORIGIN/api/cron/reminders" -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 8. Android APK against production (no USB dev server)

On your Mac, phone plugged in and authorized:

```bash
cd /path/to/receipt-warranty-vault
npm run android:apk:prod -- https://your-exact-ORIGIN
```

Example: `npm run android:apk:prod -- https://proof-vault.vercel.app`

This sets the WebView to **`ORIGIN`** (see `capacitor.config.ts`: `https://` in `PROOF_VAULT_SERVER_URL` overrides local `APP_URL` in `.env`). The script runs `cap sync`, Gradle, and `adb install -r` when a device is listed.

**Play Store / release builds:** the repo currently automates **debug** APKs. For paid distribution you’ll want a **release** keystore, `assembleRelease`, Play Console listing, and privacy policy — that’s separate from this checklist.

---

## Deploy on Vercel (short reference)

1. Create Postgres and set `DATABASE_URL` in the project.
2. Set `AUTH_SECRET`, `AUTH_URL`, `APP_URL`, OAuth keys, `RESEND_*`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN`.
3. `npx prisma db push` against production once.
4. Google: redirect `https://YOUR_DOMAIN/api/auth/callback/google`.
5. Resend: verify a domain for real `EMAIL_FROM`.
6. Cron: see §8 above.

## Performance note

Saving receipts does **not** send email inline. The cron job batches due reminders so the UI stays responsive.
