#!/usr/bin/env bash
# Module 05: SSH Brute Force Simulation
# Hammers the SSH honeypot with credential pairs — triggers CRITICAL alert in IntruSense
# NOTE: Targets only the IntruSense honeypot port 2222, NOT real SSH

TARGET_IP="${TARGET_IP:-$1}"
SSH_PORT="${SSH_HONEYPOT_PORT:-2222}"
[[ -z "$TARGET_IP" ]] && { echo "TARGET_IP not set"; exit 1; }

USERNAMES=(admin root administrator user ubuntu pi deploy postgres oracle mysql operator guest)
PASSWORDS=(admin password 123456 admin123 password123 root toor qwerty letmein welcome 12345678 111111 monkey dragon master sunshine 1234567890 login)

echo "[05] Starting SSH brute force against $TARGET_IP:$SSH_PORT (honeypot)"
echo "[05] Using netcat/bash TCP — $(( ${#USERNAMES[@]} * 4 )) attempts planned"

attempt=0
for user in "${USERNAMES[@]}"; do
  for pass in "${PASSWORDS[@]:0:4}"; do
    attempt=$(( attempt + 1 ))
    echo "[05] Attempt $attempt: $user / $pass"
    # Send raw TCP data simulating SSH auth attempt to the honeypot
    printf "SSH-2.0-OpenSSH_8.9p1\r\nuser=%s\r\npass=%s\r\n" "$user" "$pass" \
      | timeout 2 nc -w 2 "$TARGET_IP" "$SSH_PORT" 2>/dev/null || true
    sleep 0.2
  done
done

echo "[05] SSH brute force complete — $attempt attempts sent"
echo "[05] Check IntruSense dashboard for BRUTE FORCE alert"
