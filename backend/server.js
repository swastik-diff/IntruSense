'use strict';
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const chalk = require('chalk');
const net = require('net');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const path = require('path');

const db = require('./database');
const pipeline = require('./capture-pipeline');
const alertEngine = require('./alert-engine');
const pages = require('./honeypot-pages');
const { getAISummary, buildIPIntelligence, isPrivateIP } = require('./alert-engine');

const PORT = process.env.PORT || 3000;
const HTTP_HONEYPOT_PORT = process.env.HTTP_HONEYPOT_PORT || 8080;
const SSH_HONEYPOT_PORT = process.env.SSH_HONEYPOT_PORT || 2222;
const FTP_HONEYPOT_PORT = process.env.FTP_HONEYPOT_PORT || 2121;
const DEMO_MODE = process.env.DEMO_MODE === 'false';

// ── API Server ─────────────────────────────────────────────────────────────
const app = express();
const apiServer = http.createServer(app);
const io = new Server(apiServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(morgan('tiny'));

// ── REST API ───────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => res.json(db.getStats()));
app.get('/api/attackers', (req, res) => res.json(db.getTopAttackers()));
app.get('/api/attacker/:ip', (req, res) => {
  const p = db.getProfile(req.params.ip);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const events = db.getTimeline(req.params.ip);
  const narrative = pipeline.generateAttackNarrative(p, events);
  const intel = buildIPIntelligence(p);
  const aiSummary = getAISummary(p);
  res.json({ ...p, events, narrative, intel, aiSummary });
});
app.get('/api/events', (req, res) => res.json(db.getRecentEvents()));
app.get('/api/alerts', (req, res) => res.json(db.getAlerts()));
app.get('/api/hourly', (req, res) => res.json(db.getHourlyStats()));
app.get('/api/countries', (req, res) => res.json(db.getCountryStats()));
app.get('/api/attack-types', (req, res) => res.json(db.getAttackTypeStats()));
app.get('/api/threat-distribution', (req, res) => res.json(db.getThreatScoreDistribution()));
app.get('/api/heatmap', (req, res) => res.json(db.getHeatmap()));

// Enhanced map data with local IP plotting
app.get('/api/map-data', (req, res) => {
  const attackers = db.getTopAttackers();
  const mapData = attackers.map(a => {
    const local = isPrivateIP(a.ip);
    const intel = buildIPIntelligence(a);
    return {
      ip: a.ip,
      lat: intel.mapLat,
      lon: intel.mapLon,
      country: local ? 'Local Network' : (a.country || 'Unknown'),
      city: local ? 'Kolkata (LAN)' : (a.city || 'Unknown'),
      threatScore: a.threat_score || 0,
      attackTypes: JSON.parse(a.attack_types_json || '[]'),
      isLocal: local,
      intel,
      aiSummary: getAISummary({ ...a, attackTypes: JSON.parse(a.attack_types_json || '[]') }),
    };
  });
  res.json(mapData);
});

// Acknowledge alert
app.post('/api/alerts/:id/acknowledge', (req, res) => {
  try {
    db.acknowledgeAlert(req.params.id);
    io.emit('alert_acknowledged', { id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Socket.io ──────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(chalk.cyan(`[Dashboard] Client connected: ${socket.id}`));
  // Send current state on connect
  socket.emit('initial_state', {
    stats: db.getStats(),
    attackers: db.getTopAttackers().slice(0, 20),
    alerts: db.getAlerts().slice(0, 50),
    events: db.getRecentEvents().slice(0, 100),
  });
  socket.on('disconnect', () => {
    console.log(chalk.gray(`[Dashboard] Client disconnected: ${socket.id}`));
  });
});

// ── Session cache ──────────────────────────────────────────────────────────
const sessionCache = new Map();

async function processHit(eventData) {
  const { ip } = eventData;
  if (!ip) return;

  const now = Date.now();
  const session = sessionCache.get(ip);
  let sessionId;
  if (!session || now - session.lastSeen > 30 * 60 * 1000) {
    sessionId = uuidv4();
    sessionCache.set(ip, { sessionId, lastSeen: now, hitCount: 1 });
  } else {
    sessionId = session.sessionId;
    session.lastSeen = now;
    session.hitCount++;
    sessionCache.set(ip, session);
  }
  eventData.sessionId = sessionId;

  db.insertEvent(eventData);
  const existing = db.getProfile(ip);
  const allEvents = db.getTimeline(ip);
  const enrichment = await pipeline.enrichIP(ip);
  const toolFingerprint = pipeline.fingerprintTool(eventData.userAgent) || existing?.toolFingerprint || null;
  const allEventsWithCurrent = [...allEvents, {
    path: eventData.path, method: eventData.method,
    body_json: JSON.stringify(eventData.body || {}),
    raw_payload: eventData.rawPayload || ''
  }];
  const attackTypes = pipeline.classifyAttackPatterns(allEventsWithCurrent);
  const credentialsTried = [...(existing?.credentialsTried || [])];
  if (eventData.body && (eventData.body.username || eventData.body.log || eventData.body.pma_username)) {
    const username = eventData.body.username || eventData.body.log || eventData.body.pma_username || '';
    const password = eventData.body.password || eventData.body.pwd || eventData.body.pma_password || '';
    if (username || password) {
      const exists = credentialsTried.some(c => c.username === username && c.password === password);
      if (!exists) credentialsTried.push({ username, password, timestamp: new Date().toISOString(), path: eventData.path });
    }
  }
  const portsHit = [...new Set([...(existing?.portsHit || []), eventData.port].filter(Boolean))];
  const userAgents = [...new Set([...(existing?.userAgents || []), eventData.userAgent].filter(Boolean))];
  const { score: threatScore, breakdown } = pipeline.calculateThreatScore({
    abuseScore: enrichment.abuseScore, portsHit, attackTypes,
    isTor: enrichment.isTor, isDatacenter: enrichment.isDatacenter, credentialsTried
  });
  const attackerClass = pipeline.classifyAttackerType({ attackTypes, credentialsTried, toolFingerprint }, allEventsWithCurrent);

  // For local IPs, plot on Kolkata map
  const localIP = isPrivateIP(ip);
  const lat = localIP ? 22.5726 + (Math.random() * 0.05 - 0.025) : (enrichment.lat ?? existing?.lat);
  const lon = localIP ? 88.3639 + (Math.random() * 0.05 - 0.025) : (enrichment.lon ?? existing?.lon);

  const profile = {
    ip, firstSeen: existing?.first_seen || new Date().toISOString(),
    lastSeen: new Date().toISOString(), hitCount: (existing?.hit_count || 0) + 1,
    threatScore, country: localIP ? 'Local Network' : (enrichment.country || existing?.country),
    countryCode: localIP ? 'LO' : (enrichment.countryCode || existing?.country_code),
    city: localIP ? 'LAN' : (enrichment.city || existing?.city),
    lat, lon, isp: enrichment.isp || existing?.isp, asn: enrichment.asn || existing?.asn,
    rdns: enrichment.rdns || existing?.rdns, attackTypes, credentialsTried,
    userAgents, portsHit, abuseScore: enrichment.abuseScore || existing?.abuse_score || 0,
    isTor: enrichment.isTor, isDatacenter: enrichment.isDatacenter,
    classification: attackTypes.join(', ') || 'Recon', attackerClass, toolFingerprint,
    sessionCount: (existing?.session_count || 0) + (session ? 0 : 1),
    threatScoreBreakdown: breakdown
  };

  db.upsertProfile(profile);

  const intel = buildIPIntelligence(profile);
  const aiSummary = getAISummary(profile);

  io.emit('event', { type: 'hit', timestamp: new Date().toISOString(), event: eventData, profile, sessionId, intel, aiSummary });
  io.emit('profile_update', { ...profile, intel, aiSummary });

  alertEngine.evaluateAlerts(eventData, profile, io);

  const flag = profile.countryCode && profile.countryCode !== 'LO'
    ? String.fromCodePoint(...profile.countryCode.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
    : '🌐';
  const scoreColor = threatScore >= 80 ? chalk.red : threatScore >= 50 ? chalk.yellow : chalk.green;
  console.log(chalk.cyan(`[${eventData.protocol || 'HTTP'}]`), chalk.white(ip), flag,
    chalk.gray(`${profile.country || 'Unknown'}`), scoreColor(`[${threatScore}]`),
    chalk.magenta(eventData.method || ''), chalk.white(eventData.path || ''),
    attackTypes.length ? chalk.yellow(`[${attackTypes.join('|')}]`) : '');

  return profile;
}

// ── HTTP Honeypot ──────────────────────────────────────────────────────────
const honeypotApp = express();
honeypotApp.use(express.urlencoded({ extended: true }));
honeypotApp.use(express.json());

function getClientIP(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().replace('::ffff:', '');
}

honeypotApp.use((req, res, next) => {
  const ip = getClientIP(req);
  processHit({ ip, port: HTTP_HONEYPOT_PORT, protocol: 'HTTP', method: req.method, path: req.path,
    headers: req.headers, body: req.body, rawPayload: req.method === 'POST' ? JSON.stringify(req.body) : null,
    userAgent: req.headers['user-agent'] || null }).catch(() => {});
  next();
});

honeypotApp.get('/', (req, res) => res.send(pages.loginPage()));
honeypotApp.post('/login', (req, res) => res.send(pages.loginPage(true)));
honeypotApp.get('/admin', (req, res) => res.send(pages.adminPage()));
honeypotApp.post('/admin', (req, res) => res.send(pages.adminPage(true)));
honeypotApp.get('/wp-login.php', (req, res) => res.send(pages.adminPage()));
honeypotApp.post('/wp-login.php', (req, res) => res.send(pages.adminPage(true)));
honeypotApp.get('/wp-admin', (req, res) => res.send(pages.adminPage()));
honeypotApp.get('/phpmyadmin', (req, res) => res.send(pages.phpMyAdminPage()));
honeypotApp.post('/phpmyadmin', (req, res) => res.send(pages.phpMyAdminPage()));
honeypotApp.get('/.env', (req, res) => { res.setHeader('Content-Type', 'text/plain'); res.send(pages.dotEnvFile()); });
honeypotApp.get('/backup.zip', (req, res) => {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="backup.zip"');
  res.send(pages.fakeBackupContent);
});
honeypotApp.get('/api/v1/users', (req, res) => res.json(pages.fakeUsersAPI()));
honeypotApp.get('/api/swagger.json', (req, res) => res.json({ swagger: '2.0', info: { title: 'Meridian API', version: '1.0' } }));
honeypotApp.use((req, res) => res.status(404).send(pages.notFoundPage(req.path)));

// ── SSH Honeypot ───────────────────────────────────────────────────────────
const sshServer = net.createServer((socket) => {
  const ip = (socket.remoteAddress || '').replace('::ffff:', '');
  socket.write('SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6\r\n');
  let authAttempts = 0, authenticated = false, username = '';
  socket.setTimeout(60000);
  socket.on('data', (data) => {
    const readable = data.toString('utf8', 0, Math.min(data.length, 512));
    const userMatch = readable.match(/user[name]*[=:\s]+([a-zA-Z0-9_@.-]{1,32})/i);
    const passMatch = readable.match(/pass[word]*[=:\s]+([^\s\r\n]{1,64})/i);
    if (userMatch) username = userMatch[1];
    if (passMatch || authAttempts > 0) {
      authAttempts++;
      const password = passMatch ? passMatch[1] : '[binary-auth]';
      processHit({ ip, port: SSH_HONEYPOT_PORT, protocol: 'SSH', method: 'AUTH', path: '/ssh',
        headers: {}, body: { username: username || 'unknown', password },
        rawPayload: `SSH AUTH: ${username}/${password}`, userAgent: 'SSH-Client' }).catch(() => {});
      if (authAttempts >= 2 && !authenticated) {
        authenticated = true;
        setTimeout(() => { if (!socket.destroyed) { socket.write('\r\nWelcome to Ubuntu 22.04.3 LTS\r\nroot@ubuntu:~# '); } }, 800);
      } else if (!authenticated) {
        setTimeout(() => { if (!socket.destroyed) socket.write('Permission denied, please try again.\r\n'); }, 500);
      }
    }
    if (authenticated) {
      const cmd = readable.trim();
      if (cmd && cmd !== 'root@ubuntu:~#') {
        processHit({ ip, port: SSH_HONEYPOT_PORT, protocol: 'SSH', method: 'COMMAND', path: '/ssh/shell',
          headers: {}, body: { command: cmd }, rawPayload: `SSH COMMAND: ${cmd}`, userAgent: 'SSH-Client' }).catch(() => {});
        setTimeout(() => { if (!socket.destroyed) socket.write('root@ubuntu:~# '); }, 200);
      }
    }
  });
  socket.on('timeout', () => socket.destroy());
  socket.on('error', () => socket.destroy());
});

// ── FTP Honeypot ───────────────────────────────────────────────────────────
const ftpServer = net.createServer((socket) => {
  const ip = (socket.remoteAddress || '').replace('::ffff:', '');
  socket.write('220 (vsFTPd 3.0.5)\r\n');
  let username = '';
  socket.setTimeout(30000);
  socket.on('data', (data) => {
    const line = data.toString().trim();
    const [cmd, ...args] = line.split(' ');
    const arg = args.join(' ');
    if (cmd.toUpperCase() === 'USER') { username = arg; socket.write('331 Please specify the password.\r\n'); }
    else if (cmd.toUpperCase() === 'PASS') {
      processHit({ ip, port: FTP_HONEYPOT_PORT, protocol: 'FTP', method: 'AUTH', path: '/ftp',
        headers: {}, body: { username, password: arg }, rawPayload: `FTP AUTH: ${username}/${arg}`, userAgent: 'FTP-Client' }).catch(() => {});
      socket.write('530 Login incorrect.\r\n');
    } else if (cmd.toUpperCase() === 'QUIT') { socket.write('221 Goodbye.\r\n'); socket.destroy(); }
    else socket.write('530 Please login with USER and PASS.\r\n');
  });
  socket.on('timeout', () => socket.destroy());
  socket.on('error', () => socket.destroy());
});

// ── Demo Mode ──────────────────────────────────────────────────────────────
if (DEMO_MODE) {
  const { seedDemoData } = require('./demo-seed');
  seedDemoData();
}

// ── Startup ────────────────────────────────────────────────────────────────
const honeypotHttpServer = http.createServer(honeypotApp);

apiServer.listen(PORT, () => {
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║      IntruSense v2.0 — Starting Up       ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════╝\n'));
  console.log(chalk.green(`✓ API Server       → http://localhost:${PORT}`));
});
honeypotHttpServer.listen(HTTP_HONEYPOT_PORT, () => console.log(chalk.yellow(`✓ HTTP Honeypot    → port ${HTTP_HONEYPOT_PORT}`)));
sshServer.listen(SSH_HONEYPOT_PORT, () => console.log(chalk.yellow(`✓ SSH Honeypot     → port ${SSH_HONEYPOT_PORT}`)));
ftpServer.listen(FTP_HONEYPOT_PORT, () => {
  console.log(chalk.yellow(`✓ FTP Honeypot     → port ${FTP_HONEYPOT_PORT}`));
  console.log(chalk.cyan(`\n  Dashboard → http://localhost:5173\n`));
  if (DEMO_MODE) console.log(chalk.magenta('  DEMO MODE: ON\n'));
});

cron.schedule('0 * * * *', () => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [ip, s] of sessionCache.entries()) {
    if (s.lastSeen < cutoff) sessionCache.delete(ip);
  }
});

function shutdown() {
  console.log(chalk.red('\n[IntruSense] Shutting down...'));
  apiServer.close(); honeypotHttpServer.close(); sshServer.close(); ftpServer.close();
  db.close(); process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
