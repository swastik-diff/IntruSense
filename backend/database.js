'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'intrusense.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Create schema
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER,
    protocol TEXT,
    method TEXT,
    path TEXT,
    headers_json TEXT,
    body_json TEXT,
    raw_payload TEXT,
    session_id TEXT,
    user_agent TEXT
  );

  CREATE TABLE IF NOT EXISTS attacker_profiles (
    ip TEXT PRIMARY KEY,
    first_seen TEXT,
    last_seen TEXT,
    hit_count INTEGER DEFAULT 0,
    threat_score INTEGER DEFAULT 0,
    country TEXT,
    country_code TEXT,
    city TEXT,
    lat REAL,
    lon REAL,
    isp TEXT,
    asn TEXT,
    rdns TEXT,
    whois_json TEXT,
    attack_types_json TEXT DEFAULT '[]',
    credentials_tried_json TEXT DEFAULT '[]',
    user_agents_json TEXT DEFAULT '[]',
    ports_hit_json TEXT DEFAULT '[]',
    abuse_score INTEGER DEFAULT 0,
    is_tor INTEGER DEFAULT 0,
    is_datacenter INTEGER DEFAULT 0,
    classification TEXT DEFAULT 'Unknown',
    attacker_class TEXT DEFAULT 'Script Kiddie',
    tool_fingerprint TEXT,
    session_count INTEGER DEFAULT 0,
    threat_score_breakdown TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    ip TEXT,
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    acknowledged INTEGER DEFAULT 0,
    profile_snapshot TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_events_ip ON events(ip);
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
  CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
`);

// --- Prepared statements ---
const stmts = {
  insertEvent: db.prepare(`
    INSERT INTO events (timestamp, ip, port, protocol, method, path, headers_json, body_json, raw_payload, session_id, user_agent)
    VALUES (@timestamp, @ip, @port, @protocol, @method, @path, @headers_json, @body_json, @raw_payload, @session_id, @user_agent)
  `),

  upsertProfile: db.prepare(`
    INSERT INTO attacker_profiles (ip, first_seen, last_seen, hit_count, threat_score,
      country, country_code, city, lat, lon, isp, asn, rdns, whois_json, attack_types_json,
      credentials_tried_json, user_agents_json, ports_hit_json, abuse_score, is_tor,
      is_datacenter, classification, attacker_class, tool_fingerprint, session_count, threat_score_breakdown)
    VALUES (@ip, @first_seen, @last_seen, @hit_count, @threat_score,
      @country, @country_code, @city, @lat, @lon, @isp, @asn, @rdns, @whois_json, @attack_types_json,
      @credentials_tried_json, @user_agents_json, @ports_hit_json, @abuse_score, @is_tor,
      @is_datacenter, @classification, @attacker_class, @tool_fingerprint, @session_count, @threat_score_breakdown)
    ON CONFLICT(ip) DO UPDATE SET
      last_seen = excluded.last_seen,
      hit_count = excluded.hit_count,
      threat_score = excluded.threat_score,
      country = excluded.country,
      country_code = excluded.country_code,
      city = excluded.city,
      lat = excluded.lat,
      lon = excluded.lon,
      isp = excluded.isp,
      asn = excluded.asn,
      rdns = excluded.rdns,
      attack_types_json = excluded.attack_types_json,
      credentials_tried_json = excluded.credentials_tried_json,
      user_agents_json = excluded.user_agents_json,
      ports_hit_json = excluded.ports_hit_json,
      abuse_score = excluded.abuse_score,
      is_tor = excluded.is_tor,
      is_datacenter = excluded.is_datacenter,
      classification = excluded.classification,
      attacker_class = excluded.attacker_class,
      tool_fingerprint = excluded.tool_fingerprint,
      session_count = excluded.session_count,
      threat_score_breakdown = excluded.threat_score_breakdown
  `),

  insertAlert: db.prepare(`
    INSERT INTO alerts (timestamp, ip, alert_type, severity, message, acknowledged, profile_snapshot)
    VALUES (@timestamp, @ip, @alert_type, @severity, @message, @acknowledged, @profile_snapshot)
  `),

  getProfile: db.prepare(`SELECT * FROM attacker_profiles WHERE ip = ?`),

  getStats: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM attacker_profiles) as total_attackers,
      (SELECT COUNT(*) FROM events WHERE timestamp > datetime('now', '-5 minutes')) as active_now,
      (SELECT COUNT(*) FROM attacker_profiles WHERE threat_score >= 80) as critical_threats,
      (SELECT COUNT(*) FROM events) as total_events,
      (SELECT COUNT(*) FROM attacker_profiles WHERE first_seen > date('now')) as new_today
  `),

  getTopAttackers: db.prepare(`
    SELECT * FROM attacker_profiles ORDER BY threat_score DESC LIMIT 50
  `),

  getRecentEvents: db.prepare(`
    SELECT * FROM events ORDER BY id DESC LIMIT 100
  `),

  getAlerts: db.prepare(`
    SELECT * FROM alerts ORDER BY id DESC LIMIT 100
  `),

  getTimeline: db.prepare(`
    SELECT * FROM events WHERE ip = ? ORDER BY timestamp ASC
  `),

  getHourlyStats: db.prepare(`
    SELECT
      strftime('%Y-%m-%d %H:00', timestamp) as hour,
      COUNT(*) as count
    FROM events
    WHERE timestamp > datetime('now', '-24 hours')
    GROUP BY hour
    ORDER BY hour ASC
  `),

  getCountryStats: db.prepare(`
    SELECT country, COUNT(*) as count
    FROM attacker_profiles
    WHERE country IS NOT NULL
    GROUP BY country
    ORDER BY count DESC
    LIMIT 10
  `),

  getAttackTypeStats: db.prepare(`
    SELECT attack_types_json FROM attacker_profiles
  `),

  getThreatScoreDistribution: db.prepare(`
    SELECT
      CASE
        WHEN threat_score < 20 THEN '0-20'
        WHEN threat_score < 40 THEN '20-40'
        WHEN threat_score < 60 THEN '40-60'
        WHEN threat_score < 80 THEN '60-80'
        ELSE '80-100'
      END as range,
      COUNT(*) as count
    FROM attacker_profiles
    GROUP BY range
  `),

  getHeatmap: db.prepare(`
    SELECT
      strftime('%w', timestamp) as day,
      strftime('%H', timestamp) as hour,
      COUNT(*) as count
    FROM events
    WHERE timestamp > datetime('now', '-7 days')
    GROUP BY day, hour
  `)
};

// --- Public API ---

/**
 * Insert a raw honeypot event into the database
 */
function insertEvent(event) {
  return stmts.insertEvent.run({
    timestamp: new Date().toISOString(),
    ip: event.ip || '',
    port: event.port || null,
    protocol: event.protocol || 'HTTP',
    method: event.method || null,
    path: event.path || null,
    headers_json: JSON.stringify(event.headers || {}),
    body_json: JSON.stringify(event.body || {}),
    raw_payload: event.rawPayload || null,
    session_id: event.sessionId || null,
    user_agent: event.userAgent || null
  });
}

/**
 * Upsert an attacker profile (insert or update)
 */
function upsertProfile(profile) {
  return stmts.upsertProfile.run({
    ip: profile.ip,
    first_seen: profile.firstSeen || new Date().toISOString(),
    last_seen: new Date().toISOString(),
    hit_count: profile.hitCount || 1,
    threat_score: profile.threatScore || 0,
    country: profile.country || null,
    country_code: profile.countryCode || null,
    city: profile.city || null,
    lat: profile.lat || null,
    lon: profile.lon || null,
    isp: profile.isp || null,
    asn: profile.asn || null,
    rdns: profile.rdns || null,
    whois_json: JSON.stringify(profile.whois || {}),
    attack_types_json: JSON.stringify(profile.attackTypes || []),
    credentials_tried_json: JSON.stringify(profile.credentialsTried || []),
    user_agents_json: JSON.stringify(profile.userAgents || []),
    ports_hit_json: JSON.stringify(profile.portsHit || []),
    abuse_score: profile.abuseScore || 0,
    is_tor: profile.isTor ? 1 : 0,
    is_datacenter: profile.isDatacenter ? 1 : 0,
    classification: profile.classification || 'Unknown',
    attacker_class: profile.attackerClass || 'Script Kiddie',
    tool_fingerprint: profile.toolFingerprint || null,
    session_count: profile.sessionCount || 1,
    threat_score_breakdown: JSON.stringify(profile.threatScoreBreakdown || {})
  });
}

/**
 * Insert a new alert
 */
function insertAlert(alert) {
  return stmts.insertAlert.run({
    timestamp: new Date().toISOString(),
    ip: alert.ip || null,
    alert_type: alert.alertType,
    severity: alert.severity,
    message: alert.message,
    acknowledged: 0,
    profile_snapshot: JSON.stringify(alert.profileSnapshot || {})
  });
}

/**
 * Get a single attacker profile by IP
 */
function getProfile(ip) {
  const row = stmts.getProfile.get(ip);
  if (!row) return null;
  return parseProfile(row);
}

/**
 * Get dashboard statistics
 */
function getStats() {
  return stmts.getStats.get();
}

/**
 * Get top attackers sorted by threat score
 */
function getTopAttackers() {
  return stmts.getTopAttackers.all().map(parseProfile);
}

/**
 * Get recent raw events
 */
function getRecentEvents() {
  return stmts.getRecentEvents.all().map(row => ({
    ...row,
    headers: safeJSON(row.headers_json),
    body: safeJSON(row.body_json)
  }));
}

/**
 * Get recent alerts
 */
function getAlerts() {
  return stmts.getAlerts.all().map(row => ({
    ...row,
    profileSnapshot: safeJSON(row.profile_snapshot)
  }));
}

/**
 * Get all events for a specific IP
 */
function getTimeline(ip) {
  return stmts.getTimeline.all(ip);
}

/**
 * Get hourly attack counts for the last 24 hours
 */
function getHourlyStats() {
  return stmts.getHourlyStats.all();
}

/**
 * Get attack counts by country
 */
function getCountryStats() {
  return stmts.getCountryStats.all();
}

/**
 * Get attack type distribution across all profiles
 */
function getAttackTypeStats() {
  const rows = stmts.getAttackTypeStats.all();
  const counts = {};
  for (const row of rows) {
    const types = safeJSON(row.attack_types_json) || [];
    for (const t of types) {
      counts[t] = (counts[t] || 0) + 1;
    }
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

/**
 * Get threat score distribution
 */
function getThreatScoreDistribution() {
  return stmts.getThreatScoreDistribution.all();
}

/**
 * Get attack heatmap data (day x hour)
 */
function getHeatmap() {
  return stmts.getHeatmap.all();
}

// Helper: parse JSON fields in a profile row
function parseProfile(row) {
  return {
    ...row,
    attackTypes: safeJSON(row.attack_types_json) || [],
    credentialsTried: safeJSON(row.credentials_tried_json) || [],
    userAgents: safeJSON(row.user_agents_json) || [],
    portsHit: safeJSON(row.ports_hit_json) || [],
    whois: safeJSON(row.whois_json) || {},
    threatScoreBreakdown: safeJSON(row.threat_score_breakdown) || {},
    isTor: row.is_tor === 1,
    isDatacenter: row.is_datacenter === 1
  };
}

function safeJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}

/**
 * Graceful shutdown
 */
function close() {
  db.close();
}

module.exports = {
  insertEvent, upsertProfile, insertAlert,
  getProfile, getStats, getTopAttackers,
  getRecentEvents, getAlerts, getTimeline,
  getHourlyStats, getCountryStats, getAttackTypeStats,
  getThreatScoreDistribution, getHeatmap, close,
  // expose raw db for demo seeding
  _db: db
};
