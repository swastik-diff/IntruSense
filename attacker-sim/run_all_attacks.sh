#!/usr/bin/env bash
# IntruSense Attacker Simulator — Master Runner
# Usage: ./run_all_attacks.sh <TARGET_IP> [TARGET_PORT]
# Example: ./run_all_attacks.sh 192.168.1.100

set -e

TARGET_IP="${1:-${TARGET_IP}}"
TARGET_PORT="${2:-8080}"

if [[ -z "$TARGET_IP" ]]; then
  echo "Usage: $0 <TARGET_IP> [PORT]"
  echo "       TARGET_IP=192.168.1.100 $0"
  exit 1
fi

export TARGET_IP TARGET_PORT

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOGFILE="$LOG_DIR/attack_run_${TIMESTAMP}.log"

log() { echo -e "$1" | tee -a "$LOGFILE"; }

log "${CYAN}╔══════════════════════════════════════════════╗${NC}"
log "${CYAN}║     IntruSense Attack Simulator — v1.0      ║${NC}"
log "${CYAN}╚══════════════════════════════════════════════╝${NC}"
log ""
log "${YELLOW}Target:${NC} $TARGET_IP:$TARGET_PORT"
log "${YELLOW}Log:${NC}    $LOGFILE"
log ""

run_module() {
  local script="$1"
  local name="$2"
  log "${CYAN}━━━ [$name] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  if [[ -f "$script" ]]; then
    chmod +x "$script"
    bash "$script" 2>&1 | tee -a "$LOGFILE"
    log "${GREEN}✓ $name complete${NC}\n"
  else
    log "${RED}✗ $script not found, skipping${NC}\n"
  fi
  sleep 1
}

run_module "./01_recon_portscan.sh"     "Recon & Port Scan"
run_module "./02_web_fuzzing.sh"        "Web Fuzzing"
run_module "./07_canary_trap.sh"        "Canary Trap"
run_module "./03_sqli_probe.sh"         "SQL Injection Probe"
run_module "./04_xss_probe.sh"          "XSS Probe"
run_module "./06_credential_stuffing.sh" "Credential Stuffing"
run_module "./05_brute_force_ssh.sh"    "SSH Brute Force"
run_module "./08_slow_recon.sh"         "Slow APT Recon"

log ""
log "${GREEN}╔══════════════════════════════════════════════╗${NC}"
log "${GREEN}║       All attack modules complete            ║${NC}"
log "${GREEN}║  Check IntruSense dashboard for results      ║${NC}"
log "${GREEN}╚══════════════════════════════════════════════╝${NC}"
