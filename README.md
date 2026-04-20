# IntruSense v2.0
### Intelligent Deception & Attacker Intelligence Platform

> *"We don't just detect attacks. We let attackers walk into our traps, profile them, and expose every move they make."*

---

## 🚀 One-Command Deploy

```bash
git clone https://github.com/your-org/intrusense
cd intrusense
docker-compose up --build
```

**That's it.** Open http://localhost:5173 for the live dashboard.

| Service | URL | Description |
|---|---|---|
| Dashboard | http://localhost:5173 | Live threat monitoring UI |
| API | http://localhost:3000 | REST + Socket.io backend |
| HTTP Honeypot | http://localhost:8080 | Fake login/admin pages |
| SSH Honeypot | localhost:2222 | Fake SSH server |
| FTP Honeypot | localhost:2121 | Fake FTP server |

---

## 🧠 What It Does

IntruSense is a **deception-based security platform** that:

1. **Deploys honeypots** — fake login pages, SSH servers, FTP servers, and canary files that attract attackers
2. **Profiles every attacker** — geo-location, device fingerprinting, attack classification, threat scoring
3. **Explains attacks in plain English** — using AI summaries any non-technical user can understand
4. **Shows smart notifications** — grouped by IP and type, no flooding
5. **Maps attacks in real-time** — including local LAN attackers plotted on Kolkata

---

## 📁 Project Structure

```
intrusense/
├── backend/                 # Node.js API + Honeypots
│   ├── server.js            # Main server (API + all honeypots)
│   ├── database.js          # SQLite database layer
│   ├── alert-engine.js      # Smart alert system + AI summaries
│   ├── capture-pipeline.js  # IP enrichment + attack classification
│   ├── honeypot-pages.js    # Fake HTML pages served to attackers
│   └── demo-seed.js         # Demo data for presentations
│
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.jsx  # Landing page (pixel-perfect)
│   │   │   └── Dashboard.jsx # Live dashboard with map
│   │   └── hooks/
│   │       └── useSocket.js  # Real-time Socket.io hook
│   └── nginx.conf           # Production nginx config
│
├── docs/                    # Hackathon documentation
│   ├── ARCHITECTURE.md
│   ├── PROBLEM_STATEMENT.md
│   └── PRESENTATION_SPEECH.md
│
└── docker-compose.yml       # One-command deployment
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the backend folder:

```bash
PORT=3000
HTTP_HONEYPOT_PORT=8080
SSH_HONEYPOT_PORT=2222
FTP_HONEYPOT_PORT=2121
DEMO_MODE=true          # Seeds database with sample data
```

---

## 🎯 Demo Mode

With `DEMO_MODE=true`, the system seeds realistic attack data automatically — perfect for hackathon demos. The dashboard shows:

- 5 curated demo attacks from different countries
- Port scans, brute force, SQL injection, canary trap triggers
- AI summaries explaining each attack in plain English

---

## 🔒 Security Architecture

IntruSense uses **isolated honeypot architecture**:
- Honeypots run on separate ports from the API
- All honeypot data is read-only to the dashboard
- No actual system access is granted to attackers
- Credentials captured are stored locally for forensics

---

## 📊 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, Socket.io |
| Database | SQLite (better-sqlite3) |
| IP Intel | geoip-lite, ip-api.com |
| Frontend | React 18, Vite |
| Maps | Leaflet.js |
| Containerization | Docker, Docker Compose |
| Honeypots | Raw TCP (SSH/FTP), HTTP |
