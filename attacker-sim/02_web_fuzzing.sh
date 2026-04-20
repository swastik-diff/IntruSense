#!/usr/bin/env bash
# Module 02: Web Directory Fuzzing
# Simulates directory traversal / path discovery against the honeypot

TARGET_IP="${TARGET_IP:-$1}"
PORT="${TARGET_PORT:-8080}"
[[ -z "$TARGET_IP" ]] && { echo "TARGET_IP not set"; exit 1; }

BASE="http://$TARGET_IP:$PORT"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"

PATHS=(
  "/" "/admin" "/wp-login.php" "/wp-admin" "/phpmyadmin"
  "/.env" "/backup.zip" "/config.php" "/api/v1/users"
  "/api/swagger.json" "/.git/config" "/.htpasswd"
  "/web.config" "/server-status" "/robots.txt"
  "/sitemap.xml" "/crossdomain.xml" "/humans.txt"
  "/api/v2/users" "/api/graphql" "/api/rest/v1"
  "/phpinfo.php" "/test.php" "/info.php"
  "/db.php" "/database.php" "/connect.php"
  "/login" "/signin" "/register" "/logout"
  "/administrator" "/cpanel" "/plesk" "/webmail"
  "/uploads/" "/files/" "/static/" "/assets/"
  "/backup/" "/old/" "/bak/" "/tmp/"
)

echo "[02] Starting web fuzzing against $BASE"

for path in "${PATHS[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    --connect-timeout 3 \
    -A "$UA" \
    -H "X-Forwarded-For: 10.0.0.1" \
    "$BASE$path" 2>/dev/null || echo "000")
  echo "[02] $path → HTTP $code"
  sleep 0.15
done

echo "[02] Web fuzzing complete — $(( ${#PATHS[@]} )) paths probed"
