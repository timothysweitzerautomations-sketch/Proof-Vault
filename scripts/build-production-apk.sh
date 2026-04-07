#!/usr/bin/env bash
# Build / install a debug APK that points at your deployed https:// site.
# Deploy the Next app first (see README “Ship it”).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

URL="${1:-${PROOF_VAULT_SERVER_URL:-}}"
if [[ -z "${URL}" ]] || [[ "${URL}" != https://* ]]; then
  echo "Proof Vault — production APK"
  echo ""
  echo "Pass your live HTTPS origin (no trailing slash), same as AUTH_URL / APP_URL in Vercel:"
  echo "  npm run android:apk:prod -- https://your-app.vercel.app"
  echo ""
  echo "Or set the env var:"
  echo "  PROOF_VAULT_SERVER_URL=https://your-app.vercel.app npm run android:apk:prod"
  exit 1
fi

export PROOF_VAULT_SERVER_URL="${URL}"
exec bash "${ROOT}/scripts/build-and-install-apk.sh"
