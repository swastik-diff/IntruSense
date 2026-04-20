#!/usr/bin/env bash
# Module 07: Canary Trap Trigger
# Fetches deception files (.env, backup.zip, etc.) — triggers CANARY alert

TARGET_IP="${TARGET_IP:-$1}"
PORT="${TARGET_PORT:-8080}"
[[ -z "$TARGET_IP" ]] && { echo "TARGET_IP not set"; exit 1; }

BASE="http://$TARGET_IP:$PORT"
UA="Mozilla/5.0 (compatible; wget/1.21.4)"

CANARY_PATHS=(
  "/.env"
  "/backup.zip"
  "/.env.local"
  "/.env.production"
  "/database.sql"
  "/dump.sql"
  "/backup.sql"
  "/config.bak"
  "/wp-config.php.bak"
  "/.git/config"
  "/.git/HEAD"
  "/id_rsa"
  "/id_rsa.pub"
  "/.ssh/id_rsa"
  "/private.key"
)

echo "[07] Triggering canary traps against $BASE"

for path in "${CANARY_PATHS[@]}"; do
  echo "[07] Fetching canary: $path"
  result=$(curl -s -o /tmp/canary_output -w "%{http_code}" \
    --connect-timeout 3 \
    -A "$UA" \
    "$BASE$path" 2>/dev/null || echo "000")
  size=$(wc -c < /tmp/canary_output 2>/dev/null || echo 0)
  echo "[07]   → HTTP $result, ${size} bytes received"
  sleep 0.5
done

rm -f /tmp/canary_output
echo ""
echo "[07] Canary trap module complete"
echo "[07] Watch for 'CANARY TRIGGERED' HIGH alert in IntruSense dashboard!"
