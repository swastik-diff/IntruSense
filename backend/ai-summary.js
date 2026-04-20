'use strict';

/**
 * AI Summary Engine
 * Generates plain-English explanations of attacks for non-technical users.
 * Uses pattern matching + Ollama (if available) for local LLM summaries.
 */

const axios = require('axios');
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const USE_LLM = process.env.USE_LLM === 'true';

// ── Pattern-based summaries (always available, instant) ──────────────────────
const ATTACK_SUMMARIES = {
  'Port Scan': {
    short: (ip, ctx) => `Someone ${ctx.isLocal ? 'inside your WiFi' : `from ${ctx.country || 'the internet'}`} is checking what doors are open on your device.`,
    detail: 'A port scan maps your network services. Attackers do this before attempting to break in — it\'s like trying every lock on a building before picking one.',
    severity: 'MEDIUM',
    action: 'Block this IP and check if any services are unnecessarily exposed.',
  },
  'Brute Force': {
    short: (ip, ctx) => `Someone ${ctx.isLocal ? 'on your local network' : `from ${ctx.country || 'outside'}`} is repeatedly guessing your password.`,
    detail: 'Automated tools are trying thousands of username/password combinations per minute. Like someone trying every key combination on your front door lock.',
    severity: 'HIGH',
    action: 'Enable account lockout policies. Consider 2FA. Block this IP immediately.',
  },
  'SQL Injection': {
    short: (ip, ctx) => `An attacker is trying to trick your database into giving away secret information.`,
    detail: 'SQL injection embeds malicious commands inside normal form fields. Like writing "show me everything" in a search box and having the database comply.',
    severity: 'CRITICAL',
    action: 'Check your database for unauthorized queries. Use parameterized queries in all code.',
  },
  'XSS Probe': {
    short: (ip, ctx) => `Someone is trying to inject malicious scripts into your web pages that would affect visitors.`,
    detail: 'Cross-site scripting plants code in your website. Visitors who load the page would unknowingly run the attacker\'s code in their browser.',
    severity: 'HIGH',
    action: 'Sanitize all user inputs. Check web application logs for injected payloads.',
  },
  'Credential Stuffing': {
    short: (ip, ctx) => `Stolen username/password pairs from other websites are being tested against your login pages.`,
    detail: 'Attackers buy lists of breached credentials from the dark web and try them everywhere. If you reuse passwords, this works.',
    severity: 'HIGH',
    action: 'Enable 2FA. Use a password manager. Check if your accounts appear in breach databases.',
  },
  'Recon': {
    short: (ip, ctx) => `Someone ${ctx.isLocal ? 'on your WiFi' : 'from the internet'} is quietly gathering information about your systems.`,
    detail: 'Reconnaissance is the first phase of any attack. The attacker is mapping your infrastructure before deciding how to strike.',
    severity: 'MEDIUM',
    action: 'Log and monitor this IP. They may return with a more targeted attack.',
  },
  'Directory Traversal': {
    short: (ip, ctx) => `An attacker is trying to access files outside of your web folder — like reading your password files.`,
    detail: 'Path traversal exploits "../" tricks to escape the intended directory. Like using back passages in a building to reach restricted areas.',
    severity: 'HIGH',
    action: 'Patch your web server. Validate all file paths in your code.',
  },
  'Canary Access': {
    short: (ip, ctx) => `Someone accessed a deliberately fake file we planted to catch intruders. They are already inside your system.`,
    detail: 'Our honeytrap was triggered. This person opened a file that no legitimate user should ever touch. This is a confirmed breach.',
    severity: 'CRITICAL',
    action: 'Incident response required immediately. Isolate affected systems.',
  },
};

const DEFAULT_SUMMARY = {
  short: (ip, ctx) => `Suspicious activity detected from ${ctx.isLocal ? 'inside your network' : (ctx.country || 'an unknown location')}.`,
  detail: 'Unusual access patterns were detected. This may indicate an attacker probing your defenses.',
  severity: 'MEDIUM',
  action: 'Review logs and consider blocking this IP address.',
};

// ── Device type guessing from user agent + ASN ────────────────────────────────
function guessDeviceType(userAgent, isp, ports) {
  if (!userAgent) {
    if (ports && ports.includes(2222)) return { type: 'SSH Scanner', icon: '🖥️' };
    return { type: 'Unknown Device', icon: '❓' };
  }
  const ua = userAgent.toLowerCase();
  if (/masscan|nmap|zmap|zgrab|shodan|censys/i.test(ua)) return { type: 'Attack Tool', icon: '⚔️' };
  if (/curl|wget|python|go-http|java|ruby|perl/i.test(ua)) return { type: 'Automated Script', icon: '🤖' };
  if (/mobile|android|iphone|ipad/i.test(ua)) return { type: 'Mobile Device', icon: '📱' };
  if (/windows/i.test(ua)) return { type: 'Windows PC', icon: '💻' };
  if (/macintosh|mac os/i.test(ua)) return { type: 'Mac Laptop', icon: '💻' };
  if (/linux/i.test(ua)) return { type: 'Linux Server', icon: '🖥️' };
  if (isp && /router|mikrotik|cisco|juniper/i.test(isp)) return { type: 'Network Device', icon: '📡' };
  return { type: 'Browser / PC', icon: '🖥️' };
}

// ── IP context builder ─────────────────────────────────────────────────────────
function isPrivateIP(ip) {
  if (!ip) return false;
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1|localhost)/.test(ip);
}

function buildIPContext(profile) {
  const isLocal = isPrivateIP(profile.ip);
  return {
    isLocal,
    country: profile.country || null,
    city: profile.city || null,
    isp: profile.isp || null,
    asn: profile.asn || null,
    isVPN: profile.isDatacenter || false,
    isTor: profile.isTor || false,
    lat: isLocal ? 22.5726 : (profile.lat || 0), // Kolkata fallback for local
    lon: isLocal ? 88.3639 : (profile.lon || 0),
    displayLocation: isLocal
      ? '📶 Inside your WiFi/LAN'
      : [profile.city, profile.country].filter(Boolean).join(', ') || 'Unknown Location',
    locationDetail: isLocal
      ? 'This IP is on your local network — the attacker is nearby (same building or compromised device on your WiFi).'
      : `IP located in ${[profile.city, profile.country].filter(Boolean).join(', ')}. ISP: ${profile.isp || 'Unknown'}.`,
    riskFlags: [
      profile.isTor && '🧅 Tor Exit Node',
      profile.isDatacenter && '🏢 VPN / Hosting',
      isLocal && '⚠️ Internal Threat',
    ].filter(Boolean),
  };
}

// ── Main summary generator ────────────────────────────────────────────────────
function generateSummary(profile) {
  const ctx = buildIPContext(profile);
  const attackTypes = profile.attackTypes || profile.attack_types || [];
  const device = guessDeviceType(
    (profile.userAgents || [])[0] || profile.user_agent,
    profile.isp,
    profile.portsHit || profile.ports_hit
  );

  // Find best matching attack template
  let template = DEFAULT_SUMMARY;
  for (const type of attackTypes) {
    if (ATTACK_SUMMARIES[type]) {
      template = ATTACK_SUMMARIES[type];
      break;
    }
  }

  // Check canary
  const isCanary = (profile.portsHit || []).length === 0 && attackTypes.length === 0;

  const summary = {
    plainEnglish: template.short(profile.ip, ctx),
    technicalDetail: template.detail,
    recommendedAction: template.action,
    ipContext: ctx,
    device,
    severity: template.severity,
    attackTypes: attackTypes.length ? attackTypes : ['General Probe'],
    threatScore: profile.threatScore || profile.threat_score || 0,
    humanReadableScore: scoreToWords(profile.threatScore || profile.threat_score || 0),
  };

  return summary;
}

function scoreToWords(score) {
  if (score >= 90) return 'Extremely Dangerous';
  if (score >= 70) return 'Very Dangerous';
  if (score >= 50) return 'Dangerous';
  if (score >= 30) return 'Suspicious';
  return 'Low Risk';
}

// ── Optional LLM enhancement (Ollama local) ───────────────────────────────────
async function enhanceWithLLM(profile, baseSummary) {
  if (!USE_LLM) return baseSummary;
  try {
    const prompt = `You are a cybersecurity expert explaining an attack to a non-technical business owner.
Attack details: IP=${profile.ip}, Country=${profile.country}, Attack types=${(profile.attackTypes||[]).join(', ')}, Threat score=${profile.threatScore}/100.
Write ONE sentence (max 25 words) explaining what this attacker is trying to do in plain English. No jargon. Be specific.`;

    const res = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'llama3.2',
      prompt,
      stream: false,
      options: { temperature: 0.3, num_predict: 60 }
    }, { timeout: 5000 });

    if (res.data && res.data.response) {
      baseSummary.plainEnglish = res.data.response.trim();
      baseSummary.llmEnhanced = true;
    }
  } catch {
    // Gracefully degrade — LLM not required
  }
  return baseSummary;
}

module.exports = { generateSummary, enhanceWithLLM, buildIPContext, guessDeviceType, isPrivateIP };
