'use strict';

const db = require('./database');

// ── Rate tracking ────────────────────────────────────────────────────────────
const recentAttempts = new Map();

function pruneAttempts() {
  const cutoff = Date.now() - 60000;
  for (const [ip, attempts] of recentAttempts.entries()) {
    const filtered = attempts.filter(a => a.ts > cutoff);
    if (filtered.length === 0) recentAttempts.delete(ip);
    else recentAttempts.set(ip, filtered);
  }
}
setInterval(pruneAttempts, 30000);

function recordAttempt(ip, port, type) {
  if (!recentAttempts.has(ip)) recentAttempts.set(ip, []);
  recentAttempts.get(ip).push({ ts: Date.now(), port, type });
}

function isBruteForce(ip, port) {
  const attempts = recentAttempts.get(ip) || [];
  const relevant = attempts.filter(a => a.port === port && Date.now() - a.ts < 60000);
  return relevant.length > 5;
}

function isPortScan(ip) {
  const attempts = recentAttempts.get(ip) || [];
  const ports = new Set(attempts.map(a => a.port));
  return ports.size >= 3;
}

// ── Smart Notification Grouping ───────────────────────────────────────────────
const notifGroups = new Map();
const GROUPING_WINDOW_MS = 60 * 1000;
const REOPEN_WINDOW_MS = 2 * 60 * 1000;

function getGroupKey(alert) {
  return `${alert.ip}::${alert.alertType}`;
}

function processSmartNotification(alert, io) {
  const key = getGroupKey(alert);
  const now = Date.now();
  const existing = notifGroups.get(key);

  if (existing) {
    const timeSinceLast = now - existing.lastTs;
    if (timeSinceLast <= GROUPING_WINDOW_MS) {
      existing.count++;
      existing.lastTs = now;
      existing.alert = { ...alert, count: existing.count };
      notifGroups.set(key, existing);
      if (io) {
        io.emit('notification_update', { key, count: existing.count, lastTs: new Date(now).toISOString(), alert: existing.alert });
      }
      return null;
    } else if (timeSinceLast > REOPEN_WINDOW_MS) {
      notifGroups.delete(key);
    } else {
      existing.count++;
      existing.lastTs = now;
      notifGroups.set(key, existing);
      return null;
    }
  }

  const entry = { alert, count: 1, firstTs: now, lastTs: now };
  notifGroups.set(key, entry);
  for (const [k, v] of notifGroups.entries()) {
    if (now - v.lastTs > 10 * 60 * 1000) notifGroups.delete(k);
  }
  return { ...alert, groupKey: key, count: 1 };
}

// ── AI plain-English summaries ────────────────────────────────────────────────
function isPrivateIP(ip) {
  if (!ip) return false;
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1$|localhost)/.test(ip);
}

const SUMMARIES = {
  'Port Scan': (ip, ctx) => `Someone ${ctx.local ? 'inside your WiFi' : ('from ' + ctx.location)} is checking what network services your device has open — like rattling door handles before breaking in.`,
  'Brute Force': (ip, ctx) => `Someone ${ctx.local ? 'on your local network' : ('from ' + ctx.location)} is rapidly trying to guess your password using automated tools.`,
  'SQL Injection': (ip, ctx) => `An attacker is trying to trick your database into revealing secret data by typing malicious commands into form fields.`,
  'XSS Probe': (ip, ctx) => `Someone is attempting to inject malicious scripts into your website that would run in visitors' browsers.`,
  'Credential Stuffing': (ip, ctx) => `Stolen username/password pairs from other data breaches are being tested against your login pages.`,
  'Recon': (ip, ctx) => `Someone ${ctx.local ? 'on your WiFi' : 'from the internet'} is quietly mapping your systems before attempting an attack.`,
  'Directory Traversal': (ip, ctx) => `An attacker is trying to access files they shouldn't — like reading your config or password files through a web exploit.`,
  'Canary Access': (ip, ctx) => `A trap was triggered: someone accessed a fake decoy file we planted. This is a confirmed intruder already inside your system.`,
};

function getAISummary(profile) {
  const local = isPrivateIP(profile.ip);
  const location = [profile.city, profile.country].filter(Boolean).join(', ') || 'an unknown location';
  const ctx = { local, location };
  const types = profile.attackTypes || [];
  for (const t of types) {
    if (SUMMARIES[t]) return SUMMARIES[t](profile.ip, ctx);
  }
  return `Suspicious activity from ${local ? 'inside your network' : location}. Someone may be probing your defenses.`;
}

function guessDevice(userAgent, ports) {
  if (!userAgent) {
    if (ports && ports.includes(2222)) return { type: 'SSH Scanner', icon: '🖥️' };
    return { type: 'Unknown Device', icon: '❓' };
  }
  const ua = userAgent.toLowerCase();
  if (/masscan|nmap|zmap|zgrab|shodan|censys/i.test(ua)) return { type: 'Attack Tool', icon: '⚔️' };
  if (/curl|wget|python|go-http|java|ruby/i.test(ua)) return { type: 'Automated Script', icon: '🤖' };
  if (/mobile|android|iphone|ipad/i.test(ua)) return { type: 'Mobile Device', icon: '📱' };
  if (/windows/i.test(ua)) return { type: 'Windows PC', icon: '💻' };
  if (/macintosh|mac os/i.test(ua)) return { type: 'Mac', icon: '💻' };
  if (/linux/i.test(ua)) return { type: 'Linux Server', icon: '🖥️' };
  return { type: 'Browser / PC', icon: '🖥️' };
}

function buildIPIntelligence(profile) {
  const local = isPrivateIP(profile.ip);
  return {
    isLocal: local,
    displayLocation: local
      ? '📶 Inside your WiFi/LAN'
      : [profile.city, profile.country].filter(Boolean).join(', ') || 'Unknown',
    locationDetail: local
      ? 'This attacker is on your local network — same building or a compromised device on your WiFi.'
      : `Located in ${[profile.city, profile.country].filter(Boolean).join(', ')}. ISP: ${profile.isp || 'Unknown'}.`,
    riskFlags: [
      profile.isTor && '🧅 Tor Exit Node',
      profile.isDatacenter && '🏢 VPN/Hosting',
      local && '⚠️ Internal Threat',
    ].filter(Boolean),
    device: guessDevice((profile.userAgents || [])[0], profile.portsHit),
    // Map coords: local IPs get Kolkata for visual display
    mapLat: local ? 22.5726 : (profile.lat || 0),
    mapLon: local ? 88.3639 : (profile.lon || 0),
  };
}

// ── Alert evaluation ──────────────────────────────────────────────────────────
function evaluateAlerts(event, profile, io) {
  const alerts = [];
  const ip = event.ip;
  const ts = new Date().toISOString();

  recordAttempt(ip, event.port, event.protocol);

  const intel = buildIPIntelligence(profile);
  const plainEnglish = getAISummary(profile);

  const profileSnapshot = {
    ip: profile.ip,
    country: profile.country,
    city: profile.city,
    threatScore: profile.threatScore || profile.threat_score,
    classification: profile.classification,
    attackTypes: profile.attackTypes || [],
    intel,
    plainEnglish,
  };

  const fire = (alertType, severity, message) => {
    const alert = { ip, timestamp: ts, alertType, severity, message, profileSnapshot, acknowledged: false, plainEnglish };
    const grouped = processSmartNotification(alert, io);
    if (grouped) {
      fireAlert(grouped, io);
      alerts.push(grouped);
    }
  };

  if ((profile.threatScore || 0) >= 80)
    fire('CRITICAL_THREAT', 'CRITICAL', `Critical threat from ${ip}. Score: ${profile.threatScore}/100. ${plainEnglish}`);

  if (isBruteForce(ip, event.port))
    fire('BRUTE_FORCE', 'HIGH', `Brute-force on port ${event.port} from ${ip}. ${plainEnglish}`);

  if ((profile.attackTypes || []).includes('SQL Injection'))
    fire('SQLI_DETECTED', 'HIGH', `SQL Injection from ${ip} → ${event.path || 'N/A'}. ${plainEnglish}`);

  if ((profile.attackTypes || []).includes('XSS Probe'))
    fire('XSS_DETECTED', 'HIGH', `XSS probe from ${ip} → ${event.path || 'N/A'}. ${plainEnglish}`);

  const path = (event.path || '').toLowerCase();
  if (path === '/.env' || path === '/backup.zip' || path.endsWith('.bak') || path.endsWith('.sql'))
    fire('CANARY_TRIGGERED', 'CRITICAL', `🪤 CANARY TRIGGERED: ${ip} accessed "${event.path}". ${plainEnglish}`);

  if (isPortScan(ip))
    fire('PORT_SCAN', 'MEDIUM', `Port scan from ${ip} (${intel.displayLocation}). ${plainEnglish}`);

  if (profile.isTor)
    fire('TOR_EXIT_NODE', 'MEDIUM', `Tor exit node: ${ip}. ${plainEnglish}`);

  if ((profile.hitCount || 1) === 1)
    fire('NEW_ATTACKER', 'INFO', `New attacker: ${ip} from ${intel.displayLocation}. ${plainEnglish}`);

  return alerts;
}

function fireAlert(alert, io) {
  try {
    db.insertAlert(alert);
    if (io) io.emit('alert', { ...alert, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
  } catch (_) {}
}

module.exports = { evaluateAlerts, recordAttempt, isBruteForce, isPortScan, getAISummary, buildIPIntelligence, isPrivateIP };
