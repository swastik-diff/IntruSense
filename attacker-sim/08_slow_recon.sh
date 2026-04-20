#!/usr/bin/env bash
# Module 08: Slow APT-Style Recon
# Simulates a patient attacker — one request every 30s with rotating User-Agents
# This creates a distinctive timeline in IntruSense (classified as APT Actor)

TARGET_IP="${TARGET_IP:-$1}"
PORT="${TARGET_PORT:-8080}"
[[ -z "$TARGET_IP" ]] && { echo "TARGET_IP not set"; exit 1; }

BASE="http://$TARGET_IP:$PORT"

# Rotating realistic User-Agents (different tools/browsers, simulating switching)
USER_AGENTS=(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  "curl/7.88.1"
  "python-requests/2.31.0"
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
  "Go-http-client/1.1"
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"
  "Wget/1.21.4"
  "HTTPie/3.2.2"
)

# Staged recon steps — simulates multi-stage kill chain
RECON_STEPS=(
  "/ GET homepage recon"
  "/robots.txt GET check disallow rules"
  "/api/v1/users GET enumerate API"
  "/.env GET hunt for credentials"
  "/admin GET check admin panel"
  "/api/swagger.json GET map all endpoints"
  "/wp-login.php GET check CMS type"
  "/phpmyadmin GET check DB admin access"
  "/backup.zip GET grab backup"
  "/api/v1/users GET re-verify user data"
)

echo "[08] Starting slow APT-style recon — $(( ${#RECON_STEPS[@]} )) steps, 15s intervals"
echo "[08] This simulates a patient 'low and slow' attacker"
echo "[08] Total estimated time: $(( ${#RECON_STEPS[@]} * 15 ))s"
echo ""

for i in "${!RECON_STEPS[@]}"; do
  step="${RECON_STEPS[$i]}"
  path=$(echo "$step" | awk '{print $1}')
  method=$(echo "$step" | awk '{print $2}')
  desc=$(echo "$step" | cut -d' ' -f3-)

  ua_index=$(( i % ${#USER_AGENTS[@]} ))
  ua="${USER_AGENTS[$ua_index]}"

  echo "[08] Step $(( i+1 ))/${#RECON_STEPS[@]}: $desc"
  echo "[08]   Path: $path | UA: ${ua:0:50}..."

  curl -s -o /dev/null \
    --connect-timeout 4 \
    -A "$ua" \
    -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
    -H "Accept-Language: en-US,en;q=0.5" \
    "$BASE$path" 2>/dev/null || true

  echo "[08]   ✓ Request sent. Waiting 15s before next step..."
  sleep 15
done

echo ""
echo "[08] Slow recon complete"
echo "[08] IntruSense should classify this actor as 'APT Actor' due to:"
echo "[08]   - Low request rate (15s intervals)"
echo "[08]   - Rotating User-Agents"
echo "[08]   - Multi-stage recon pattern"
