#!/usr/bin/env bash
# Module 01: Reconnaissance & Port Scan
# Scans the target to generate port-scanner signature in IntruSense

TARGET_IP="${TARGET_IP:-$1}"
[[ -z "$TARGET_IP" ]] && { echo "TARGET_IP not set"; exit 1; }

echo "[01] Starting port scan against $TARGET_IP"

# nmap scan if available, otherwise manual probe
if command -v nmap &>/dev/null; then
  echo "[01] Running nmap scan..."
  nmap -sV -p 80,443,8080,2121,2222,3000,8443,3306,5432,6379 --open \
    --script=banner "$TARGET_IP" 2>&1 || true
else
  echo "[01] nmap not found — using curl/nc probes"
  for port in 8080 2222 2121 3000; do
    echo "[01] Probing port $port..."
    curl -s --connect-timeout 2 -o /dev/null "http://$TARGET_IP:$port/" || true
    sleep 0.3
  done
fi

echo "[01] Port scan complete"
