'use strict';

const geoip = require('geoip-lite');
const axios = require('axios');
const dns = require('dns').promises;

// Tor exit node list (cached in memory, refreshed every 6 hours)
let torExitNodes = new Set();
let torLastFetched = 0;

// Known datacenter/hosting ASN patterns
const DATACENTER_ASN_PATTERNS = [
  /amazon/i, /google/i, /microsoft/i, /azure/i, /digitalocean/i,
  /linode/i, /vultr/i, /hetzner/i, /ovh/i, /choopa/i, /quadranet/i,
  /serverius/i, /cloudflare/i, /fastly/i, /cdn77/i, /leaseweb/i,
  /servercentral/i, /tzulo/i, /psychz/i, /hostinger/i, /contabo/i,
  /datacamp/i, /m247/i, /zenlayer/i, /incapsula/i, /colocrossing/i
];

/**
 * Fetch and cache Tor exit node list from Tor Project
 */
async function refreshTorList() {
  const now = Date.now();
  if (now - torLastFetched < 6 * 60 * 60 * 1000) return; // 6h cache

  try {
    const res = await axios.get(
      'https://check.torproject.org/torbulkexitlist',
      { timeout: 8000, responseType: 'text' }
    );
    const ips = res.data.split('\n').map(l => l.trim()).filter(Boolean);
    torExitNodes = new Set(ips);
    torLastFetched = now;
  } catch {
    // Silently fail — tor check not critical
  }
}

// Kick off initial fetch
refreshTorList();

/**
 * Check if an IP is a known Tor exit node
 */
function isTorExitNode(ip) {
  return torExitNodes.has(ip);
}

/**
 * Check if an ISP/org string matches known datacenter patterns
 */
function isDatacenterASN(isp) {
  if (!isp) return false;
  return DATACENTER_ASN_PATTERNS.some(p => p.test(isp));
}

/**
 * Get geolocation data using geoip-lite (offline, fast)
 * Falls back to ip-api.com for richer data when available
 */
async function getGeoData(ip) {
  // Skip private/loopback IPs
  if (isPrivateIP(ip)) {
    return {
      country: 'Local Network',
      countryCode: 'LO',
      city: 'localhost',
      lat: 0, lon: 0,
      isp: 'Local',
      asn: 'LOCAL',
      proxy: false,
      hosting: false
    };
  }

  // Try ip-api.com first (free, richer data)
  try {
    const res = await axios.get(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org,as,proxy,hosting`,
      { timeout: 4000 }
    );
    if (res.data.status === 'success') {
      return {
        country: res.data.country,
        countryCode: res.data.countryCode,
        city: res.data.city,
        region: res.data.regionName,
        lat: res.data.lat,
        lon: res.data.lon,
        isp: res.data.isp,
        org: res.data.org,
        asn: res.data.as,
        proxy: res.data.proxy,
        hosting: res.data.hosting
      };
    }
  } catch {
    // Fall through to geoip-lite
  }

  // Offline fallback
  const geo = geoip.lookup(ip);
  if (geo) {
    return {
      country: geo.country,
      countryCode: geo.country,
      city: geo.city,
      region: geo.region,
      lat: geo.ll ? geo.ll[0] : null,
      lon: geo.ll ? geo.ll[1] : null,
      isp: null,
      asn: null,
      proxy: false,
      hosting: false
    };
  }

  return { country: 'Unknown', countryCode: 'XX', city: 'Unknown', lat: 0, lon: 0 };
}

/**
 * Reverse DNS lookup
 */
async function getRDNS(ip) {
  try {
    const hostnames = await dns.reverse(ip);
    return hostnames[0] || null;
  } catch {
    return null;
  }
}

/**
 * Query AbuseIPDB for abuse confidence score
 */
async function getAbuseScore(ip) {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) return { abuseScore: 0, totalReports: 0, categories: [] };

  try {
    const res = await axios.get('https://api.abuseipdb.com/api/v2/check', {
      params: { ipAddress: ip, maxAgeInDays: 90 },
      headers: { Key: apiKey, Accept: 'application/json' },
      timeout: 5000
    });
    const d = res.data.data;
    return {
      abuseScore: d.abuseConfidenceScore || 0,
      totalReports: d.totalReports || 0,
      categories: d.categories || [],
      lastReportedAt: d.lastReportedAt || null,
      usageType: d.usageType || null
    };
  } catch {
    return { abuseScore: 0, totalReports: 0, categories: [] };
  }
}

/**
 * Fingerprint the tool being used from User-Agent
 */
function fingerprintTool(userAgent) {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();

  const signatures = [
    { pattern: /nmap/i, name: 'Nmap Port Scanner', icon: '🔍' },
    { pattern: /masscan/i, name: 'Masscan', icon: '🔍' },
    { pattern: /zmap/i, name: 'ZMap Scanner', icon: '🔍' },
    { pattern: /hydra/i, name: 'Hydra Brute Forcer', icon: '🔑' },
    { pattern: /medusa/i, name: 'Medusa Brute Forcer', icon: '🔑' },
    { pattern: /sqlmap/i, name: 'SQLMap Injection Tool', icon: '💉' },
    { pattern: /nikto/i, name: 'Nikto Web Scanner', icon: '🕷️' },
    { pattern: /dirbuster|dirb\b/i, name: 'DirBuster Directory Fuzzer', icon: '📂' },
    { pattern: /gobuster/i, name: 'Gobuster Directory Fuzzer', icon: '📂' },
    { pattern: /wfuzz/i, name: 'WFuzz Fuzzer', icon: '📂' },
    { pattern: /metasploit|msfvenom/i, name: 'Metasploit Framework', icon: '💀' },
    { pattern: /burpsuite|burp\b/i, name: 'Burp Suite', icon: '🕵️' },
    { pattern: /python-requests/i, name: 'Python Requests Script', icon: '🐍' },
    { pattern: /go-http-client/i, name: 'Go HTTP Client', icon: '🔧' },
    { pattern: /^curl\//i, name: 'curl Command-Line Tool', icon: '💻' },
    { pattern: /wget/i, name: 'Wget Downloader', icon: '💻' },
    { pattern: /zgrab/i, name: 'ZGrab Banner Grabber', icon: '🔍' },
    { pattern: /shodan/i, name: 'Shodan Crawler', icon: '👁️' },
    { pattern: /censys/i, name: 'Censys Scanner', icon: '👁️' },
    { pattern: /acunetix/i, name: 'Acunetix Scanner', icon: '🛡️' },
    { pattern: /nessus/i, name: 'Nessus Vulnerability Scanner', icon: '🛡️' }
  ];

  for (const sig of signatures) {
    if (sig.pattern.test(userAgent)) return sig.name;
  }

  if (!ua || ua === '-') return 'Unknown Tool';
  return null; // Normal browser
}

/**
 * Detect attack patterns from request path and body
 */
function classifyAttackPatterns(events) {
  const patterns = new Set();

  for (const ev of events) {
    const path = (ev.path || '').toLowerCase();
    const body = JSON.stringify(ev.body_json || '').toLowerCase();
    const rawPayload = (ev.raw_payload || '').toLowerCase();
    const combined = path + ' ' + body + ' ' + rawPayload;

    // CMS/Admin scanning
    if (/\/(admin|wp-admin|wp-login|phpmyadmin|administrator|cpanel|plesk)/.test(path)) {
      patterns.add('CMS Scanner');
    }

    // API fuzzing
    if (/\/api\/(v\d+|swagger|graphql|rest|docs)/.test(path)) {
      patterns.add('API Fuzzer');
    }

    // Directory traversal
    if (/\.\.|\/etc\/passwd|\/etc\/shadow|\/proc\/|\/var\//.test(path)) {
      patterns.add('Directory Traversal');
    }

    // SQLi probes
    if (/('|\s)(or|and)\s+\d+\s*=\s*\d+|union\s+select|select\s+.*from|drop\s+table|insert\s+into|--|#/.test(combined)) {
      patterns.add('SQL Injection');
    }

    // XSS probes
    if (/<script|javascript:|onerror=|onload=|<img\s+src=x|alert\(/.test(combined)) {
      patterns.add('XSS Probe');
    }

    // Path traversal
    if (/(\.env|backup\.zip|\.git\/|\.svn\/|config\.php|\.htpasswd|web\.config)/.test(path)) {
      patterns.add('Sensitive File Access');
    }

    // Canary trap
    if (/\.(env|bak|backup|old|sql)$/.test(path)) {
      patterns.add('Canary Trap');
    }

    // Credential stuffing (POST to login endpoints)
    if (ev.method === 'POST' && /\/(login|signin|auth|wp-login)/.test(path)) {
      patterns.add('Credential Stuffing');
    }
  }

  return Array.from(patterns);
}

/**
 * Classify attacker type using rule-based logic
 */
function classifyAttackerType(profile, events) {
  const intervals = [];
  for (let i = 1; i < events.length; i++) {
    const t1 = new Date(events[i - 1].timestamp).getTime();
    const t2 = new Date(events[i].timestamp).getTime();
    intervals.push(t2 - t1);
  }

  const avgInterval = intervals.length
    ? intervals.reduce((a, b) => a + b, 0) / intervals.length
    : 0;

  const isRegularTiming = intervals.length > 3 &&
    intervals.every(d => Math.abs(d - avgInterval) < 200);

  const isSlowRecon = avgInterval > 25000 && events.length > 2;
  const hasMultiStage = (profile.attackTypes || []).length >= 3;
  const hasCredReuse = (profile.credentialsTried || []).length > 5;

  if (isSlowRecon && hasMultiStage) return 'APT Actor';
  if (hasMultiStage && hasCredReuse && !isRegularTiming) return 'Targeted Human Attacker';
  if (isRegularTiming) return 'Automated Bot';
  return 'Script Kiddie';
}

/**
 * Calculate threat score from all available signals
 */
function calculateThreatScore(data) {
  let score = 20; // Base: any connection
  const breakdown = { base: 20 };

  if (data.abuseScore > 30) { score += 15; breakdown.abuseScore = 15; }
  if (data.portsHit?.length >= 3) { score += 20; breakdown.multiPortScan = 20; }
  if (data.attackTypes?.length > 0) { score += 15; breakdown.attackPattern = 15; }
  if (data.isTor) { score += 10; breakdown.torExitNode = 10; }
  if (data.isDatacenter) { score += 10; breakdown.datacenterIP = 10; }
  if (data.credentialsTried?.length > 0) { score += 10; breakdown.credStuffing = 10; }
  if (data.attackTypes?.includes('SQL Injection')) { score += 5; breakdown.sqli = 5; }
  if (data.attackTypes?.includes('XSS Probe')) { score += 5; breakdown.xss = 5; }

  return {
    score: Math.min(score, 100),
    breakdown
  };
}

/**
 * Generate plain-English attack narrative for profiles with 5+ events
 */
function generateAttackNarrative(profile, events) {
  if (events.length < 3) return null;

  const city = profile.city || 'an unknown location';
  const country = profile.country || 'an unknown country';
  const tool = profile.toolFingerprint || 'unknown tools';
  const types = (profile.attackTypes || []).join(', ') || 'general probing';
  const firstTime = events[0] ? new Date(events[0].timestamp).toLocaleTimeString() : 'unknown time';
  const lastTime = events[events.length - 1]
    ? new Date(events[events.length - 1].timestamp).toLocaleTimeString()
    : 'unknown time';
  const credCount = (profile.credentialsTried || []).length;
  const classLabel = profile.attacker_class || profile.attackerClass || 'Unknown';

  const severity = profile.threat_score >= 80 ? 'CRITICAL'
    : profile.threat_score >= 60 ? 'HIGH'
    : profile.threat_score >= 40 ? 'MEDIUM' : 'LOW';

  return `This actor from ${city}, ${country} using ${tool} was first observed at ${firstTime}. ` +
    `Over ${events.length} recorded interactions until ${lastTime}, they engaged in: ${types}. ` +
    (credCount > 0 ? `${credCount} credential pair(s) were attempted. ` : '') +
    `Behavioral classification: ${classLabel}. Threat level: ${severity}.`;
}

/**
 * Check if IP is private/local
 */
function isPrivateIP(ip) {
  if (!ip) return true;
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith('169.254.')
  );
}

/**
 * Main enrichment function — called for every new IP seen
 */
async function enrichIP(ip) {
  await refreshTorList();

  const [geo, rdns, abuse] = await Promise.all([
    getGeoData(ip),
    getRDNS(ip),
    getAbuseScore(ip)
  ]);

  return {
    ...geo,
    rdns,
    ...abuse,
    isTor: isTorExitNode(ip),
    isDatacenter: isDatacenterASN(geo.isp || geo.org || geo.asn || '')
  };
}

module.exports = {
  enrichIP,
  fingerprintTool,
  classifyAttackPatterns,
  classifyAttackerType,
  calculateThreatScore,
  generateAttackNarrative,
  isPrivateIP,
  isTorExitNode,
  isDatacenterASN
};
