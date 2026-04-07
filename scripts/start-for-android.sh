#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Proof Vault — Android USB + dev server"
echo ""

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install: brew install android-platform-tools"
  exit 1
fi

adb start-server
if ! adb devices | grep -E '[[:space:]]device$' >/dev/null 2>&1; then
  echo "No Android device authorized. Plug in USB, enable USB debugging, unlock phone, accept the RSA prompt."
  adb devices -l
  exit 1
fi

echo "==> USB: reverse tcp:3000 -> Mac"
adb reverse tcp:3000 tcp:3000
adb reverse --list

if command -v docker >/dev/null 2>&1; then
  echo "==> Postgres (docker compose)"
  docker compose up -d
else
  echo "(!) docker not found — ensure Postgres is running (DATABASE_URL in .env)"
fi

echo "==> Prisma db push"
npx prisma db push

echo ""
echo "==> Starting Next.js on 0.0.0.0:3000"
echo "    On your phone: open http://127.0.0.1:3000 in Chrome"
echo ""

exec npm run dev
