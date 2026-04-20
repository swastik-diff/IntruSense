import { useEffect, useRef, useState } from 'react'

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@300;400;600;700&display=swap');
@font-face {
  font-family: 'Mechsuit';
  src: url('./assets/fonts/Mechsuit.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --red:#c0392b;--red-b:#ff3b2f;--red-g:rgba(255,59,47,0.5);
  --red-dim:rgba(192,57,43,0.15);
  --bg:#050507;--s1:#0a0a0e;--s2:#0f0f15;
  --bdr:rgba(255,255,255,0.07);--text:rgba(255,255,255,0.93);--muted:rgba(255,255,255,0.42);
  --card-grad:linear-gradient(135deg,rgba(20,5,5,0.95) 0%,rgba(12,4,4,0.9) 40%,rgba(8,2,2,0.98) 100%);
  --card-grad2:linear-gradient(145deg,rgba(25,6,6,0.9) 0%,rgba(15,3,3,0.95) 50%,rgba(192,57,43,0.06) 100%);
  --card-grad3:linear-gradient(120deg,rgba(192,57,43,0.08) 0%,rgba(10,3,3,0.97) 60%,rgba(6,2,2,1) 100%);
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif;overflow-x:hidden;cursor:none}
::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:var(--red)}

/* CURSOR */
#cur{width:5px;height:5px;background:var(--red-b);border-radius:50%;position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:width .15s,height .15s}
#cur-ring{width:32px;height:32px;border:1px solid rgba(255,59,47,0.3);border-radius:50%;position:fixed;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:left .08s ease,top .08s ease,width .2s,height .2s}
body:has(a:hover,button:hover) #cur{width:10px;height:10px}
body:has(a:hover,button:hover) #cur-ring{width:50px;height:50px;border-color:rgba(255,59,47,0.5)}

/* LOADER */
#loader{position:fixed;inset:0;background:#020204;z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;transition:opacity .8s,transform .8s}
#loader.hide{opacity:0;transform:scale(1.06);pointer-events:none}
.ld-icon{width:48px;height:48px;background:var(--red);border-radius:12px;display:flex;align-items:center;justify-content:center;animation:iconPulse 1.4s ease infinite}
@keyframes iconPulse{0%,100%{box-shadow:0 0 20px var(--red-g)}50%{box-shadow:0 0 70px var(--red-g),0 0 120px rgba(255,59,47,0.15)}}
.ld-icon svg{width:22px;height:22px;stroke:#fff;fill:none;stroke-width:2}
.ld-word{font-family:'Bebas Neue';font-size:36px;letter-spacing:4px}
.ld-bar-bg{width:300px;height:1px;background:rgba(255,255,255,0.07);border-radius:1px;overflow:hidden}
.ld-bar{height:100%;background:linear-gradient(90deg,#c0392b,#ff3b2f,#ff6b5b);width:0;transition:width 2.2s cubic-bezier(.4,0,.2,1)}
.ld-bar.go{width:100%}
.ld-lines{font-family:'JetBrains Mono';font-size:10px;color:rgba(255,255,255,0.18);letter-spacing:2px;text-align:center;line-height:1.9}
.lline{opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s}
.lline.show{opacity:1;transform:none}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:300;padding:18px 52px;display:flex;align-items:center;opacity:0;transform:translateY(-24px);transition:all .6s}
nav.vis{opacity:1;transform:translateY(0)}
nav.scrolled{background:rgba(5,5,7,0.85);border-bottom:1px solid var(--bdr);backdrop-filter:blur(28px)}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-right:40px}
.nav-logo-box{width:34px;height:34px;background:var(--red);border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 22px rgba(192,57,43,0.45)}
.nav-logo-box svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2}
.nav-logo-text{font-family:'Bebas Neue';font-size:22px;letter-spacing:2px; color:rgba(255,59,47,0.5)}
.nav-link{padding:7px 16px;border-radius:20px;font-size:12px;color:rgba(255,255,255,0.4);text-decoration:none;margin-right:4px;transition:all .25s;border:1px solid transparent}
.nav-link:hover{color:#fff;border-color:rgba(255,255,255,0.08);background:rgba(255,255,255,0.04)}
.nav-r{margin-left:auto;display:flex;gap:10px;align-items:center}
.nav-ghost{padding:8px 18px;border:1px solid var(--bdr);border-radius:6px;font-size:12px;color:var(--muted);text-decoration:none;transition:all .25s}
.nav-ghost:hover{border-color:rgba(255,59,47,0.4);color:#fff}
.nav-cta{padding:9px 22px;background:var(--red);border-radius:6px;font-size:12px;color:#fff;font-weight:600;text-decoration:none;transition:all .25s;box-shadow:0 0 22px rgba(192,57,43,0.35)}
.nav-cta:hover{background:var(--red-b);box-shadow:0 0 36px rgba(255,59,47,0.5);transform:translateY(-1px)}

/* ═══ HERO — PREMIUM SLEEK REDESIGN ═══ */
#hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 64px;
  overflow: hidden;
  background: #030305;
}

/* HERO SPLIT LAYOUT */
.hero-container {
  max-width: 1280px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 0;
  z-index: 10;
  position: relative;
}

/* ── HERO LEFT ── */
.hero-left {
  padding-right: 60px;
  position: relative;
  z-index: 2;
}

/* HERO IMAGE SIDE — full bleed panel */
.hero-image-wrapper {
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}

/* diagonal cut panel behind image */
.hero-image-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(192,57,43,0.06) 0%, rgba(10,10,18,0.95) 60%);
  clip-path: polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%);
  z-index: 0;
}

/* vertical red accent line */
.hero-image-wrapper::after {
  content: '';
  position: absolute;
  left: 7%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(255,59,47,0.6) 30%, rgba(255,59,47,0.6) 70%, transparent);
  z-index: 2;
}

.shape-mask {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
  clip-path: polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%);
}

.shape-mask img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: grayscale(15%) contrast(1.08) brightness(0.88);
  transform: scale(1.05);
  transition: transform .6s ease;
}

/* Red overlay gradient on image */
.hero-img-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, rgba(3,3,5,0.85) 0%, transparent 40%),
    linear-gradient(to top, rgba(192,57,43,0.18) 0%, transparent 50%);
  z-index: 2;
}

/* Floating accent - simplified clean lines */
.shape-accent { display: none; }
.accent-1 { display: none; }
.accent-2 { display: none; }

/* ── FLOATING HUD WIDGETS on image ── */
.hud-widget {
  position: absolute;
  z-index: 5;
  background: rgba(8,4,4,0.82);
  border: 1px solid rgba(192,57,43,0.25);
  border-radius: 8px;
  backdrop-filter: blur(16px);
  padding: 10px 14px;
  animation: floatUp 6s ease-in-out infinite;
}
.hud-widget.w1 { bottom: 22%; right: 8%; animation-delay: 0s; }
.hud-widget.w2 { top: 22%; right: 6%; animation-delay: -3s; }
.hud-label { font-family:'JetBrains Mono'; font-size:8px; color:rgba(255,255,255,0.28); letter-spacing:2px; margin-bottom:4px; }
.hud-val { font-family:'Bebas Neue'; font-size:22px; color:#fff; letter-spacing:1px; line-height:1; }
.hud-val span { color:var(--red-b); }
.hud-sub { font-family:'JetBrains Mono'; font-size:8px; color:rgba(255,59,47,0.6); letter-spacing:1px; margin-top:2px; }
.hud-dot { display:inline-block; width:5px; height:5px; border-radius:50%; background:var(--red-b); box-shadow:0 0 6px var(--red-b); margin-right:5px; animation:blink 2s ease infinite; vertical-align:middle; }
/* product callout labels */
.callout{
  position:absolute;z-index:5;
  display:flex;align-items:center;gap:0;
  opacity:0;transform:translateX(20px);
  transition:opacity .6s,transform .6s;
}
.callout.vis{opacity:1;transform:translateX(0)}
.callout-line{height:1px;background:rgba(255,255,255,0.35);flex-shrink:0}
.callout-box{
  padding:5px 12px;
  background:rgba(10,10,14,0.85);
  border:1px solid rgba(255,255,255,0.15);
  border-radius:4px;backdrop-filter:blur(12px);
  white-space:nowrap;
}
.callout-name{font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,0.55);letter-spacing:2px;text-transform:uppercase}
.callout-price{font-family:'Bebas Neue';font-size:18px;color:#fff;line-height:1.1;letter-spacing:1px}
/* callout positions */
.c1{top:22%;right:52%;flex-direction:row-reverse}
.c1 .callout-line{width:60px}
.c2{top:50%;right:20%}
.c2 .callout-line{width:45px}
.c3{top:68%;right:18%}
.c3 .callout-line{width:55px}


/* SHOP NOW pill */
.shop-pill{
  position:absolute;top:28%;right:28px;z-index:6;
  padding:8px 20px;background:#fff;border-radius:20px;
  font-size:11px;font-weight:700;color:#111;text-decoration:none;letter-spacing:1px;
  box-shadow:0 4px 20px rgba(0,0,0,0.4);
  opacity:0;transform:translateY(-10px);
  transition:opacity .5s .3s,transform .5s .3s;
}
.shop-pill.vis{opacity:1;transform:translateY(0)}
.shop-pill:hover{background:#f0f0f0;transform:translateY(-2px)}



/* GRID BG */
.grid-bg{
  position:absolute;inset:0;z-index:0;
  background-image:linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px);
  background-size:65px 65px;
  mask-image:radial-gradient(ellipse 90% 80% at 30% 50%,black 0%,transparent 70%);
  pointer-events:none;will-change:transform;
}
/* vignette & beam */
.hero-vignette{position:absolute;inset:0;z-index:1;background:radial-gradient(ellipse 70% 80% at 20% 50%,rgba(192,57,43,0.14) 0%,transparent 60%);pointer-events:none}
.beam-v{position:absolute;left:48%;top:0;width:1px;height:100%;background:linear-gradient(to bottom,rgba(255,59,47,0.8),rgba(192,57,43,0.2),transparent);z-index:2;pointer-events:none;animation:beamPulse 5s ease infinite}
@keyframes beamPulse{0%,100%{opacity:.7}50%{opacity:.2}}
.scanlines{position:absolute;inset:0;z-index:2;background-image:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px);pointer-events:none}

/* ORBS */
.orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(90px);will-change:transform}
.orb-1{width:550px;height:550px;background:rgba(192,57,43,0.11);left:-200px;top:50%;transform:translateY(-50%)}
.orb-2{width:400px;height:400px;background:rgba(192,57,43,0.07);right:0;bottom:0}

/* HERO CONTENT */
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:10px;
  padding:7px 16px;
  background:transparent;
  border:1px solid rgba(255,59,47,0.22);
  border-radius:2px;
  font-family:'JetBrains Mono';font-size:9px;
  color:rgba(255,59,47,0.7);letter-spacing:3px;margin-bottom:28px;
  width:fit-content;
  position:relative;
  opacity:0;transform:translateY(16px);transition:opacity .6s,transform .6s;
}
.hero-eyebrow::before{content:'';position:absolute;top:-1px;left:-1px;width:8px;height:8px;border-top:2px solid var(--red-b);border-left:2px solid var(--red-b)}
.hero-eyebrow::after{content:'';position:absolute;bottom:-1px;right:-1px;width:8px;height:8px;border-bottom:2px solid var(--red-b);border-right:2px solid var(--red-b)}
.hero-eyebrow.vis{opacity:1;transform:translateY(0)}
.ey-dot{width:5px;height:5px;background:var(--red-b);border-radius:50%;box-shadow:0 0 8px var(--red-b);animation:blink 2s ease infinite}

h1.hero-h1{
  font-family: 'Mechsuit', 'Bebas Neue', sans-serif;
  font-size: clamp(72px, 7.5vw, 118px);
  line-height: .88;
  letter-spacing: 2px;
  margin-bottom: 28px;
}
.hl{display:block;overflow:hidden}
.hw{display:inline-block;opacity:0;transform:translateY(110%);transition:opacity .7s,transform .7s}
.hw.vis{opacity:1;transform:translateY(0)}
.hw.accent{
  color:transparent;
  -webkit-text-stroke:2px var(--red-b);
  text-shadow:0 0 80px rgba(255,59,47,0.25),0 0 120px rgba(192,57,43,0.15);
  position:relative;
}
/* Thin decorative line under heading */
.hero-h1-line{
  width:60px;height:2px;
  background:linear-gradient(90deg,var(--red-b),transparent);
  margin-bottom:22px;
  opacity:0;transform:scaleX(0);transform-origin:left;
  transition:opacity .5s .5s,transform .5s .5s;
}
.hero-h1-line.vis{opacity:1;transform:scaleX(1)}

.hero-desc{
  font-size:14px;color:var(--muted);line-height:1.85;max-width:420px;font-weight:300;
  margin-bottom:32px;
  opacity:0;transform:translateY(14px);transition:opacity .6s .3s,transform .6s .3s;
}
.hero-desc.vis{opacity:1;transform:translateY(0)}

.hero-actions{
  display:flex;gap:12px;margin-bottom:44px;
  opacity:0;transform:translateY(14px);transition:opacity .6s .45s,transform .6s .45s;
}
.hero-actions.vis{opacity:1;transform:translateY(0)}

.btn-primary{
  padding:13px 28px;background:var(--red);border:none;border-radius:8px;
  color:#fff;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;
  display:flex;align-items:center;gap:8px;
  box-shadow:0 0 32px rgba(192,57,43,0.4),inset 0 1px 0 rgba(255,255,255,0.12);
  transition:all .3s;
}
.btn-primary:hover{background:var(--red-b);transform:translateY(-2px);box-shadow:0 10px 44px rgba(255,59,47,0.5)}
.btn-primary svg{width:13px;height:13px;stroke:#fff;fill:none;stroke-width:2}
.btn-sec{
  padding:13px 28px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
  border-radius:8px;color:var(--muted);font-size:13px;cursor:pointer;text-decoration:none;transition:all .3s;
}
.btn-sec:hover{border-color:rgba(255,59,47,0.4);color:#fff;background:rgba(255,59,47,0.06)}

/* TRUST STRIP */
.trust{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  opacity:0;transition:opacity .6s .6s;
}
.trust.vis{opacity:1}
.trust-lbl{font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,0.2);letter-spacing:3px;margin-right:8px}
.trust-chip{padding:5px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:4px;font-size:10px;color:rgba(255,255,255,0.28);letter-spacing:.5px}

/* LEFT BOTTOM — stats */
.hero-stats{
  position:absolute;bottom:40px;left:52px;z-index:10;
  display:flex;gap:32px;
  opacity:0;transform:translateY(16px);transition:opacity .6s .8s,transform .6s .8s;
}
.hero-stats.vis{opacity:1;transform:translateY(0)}
.hs-item{text-align:left}
.hs-num{font-family:'Bebas Neue';font-size:30px;color:#fff;letter-spacing:1px;line-height:1}
.hs-lbl{font-family:'JetBrains Mono';font-size:8px;color:rgba(255,255,255,0.22);letter-spacing:2px;margin-top:2px}

/* NAV BUTTONS top-right of image */
.img-nav{position:absolute;top:28px;right:28px;z-index:6;display:flex;gap:10px;align-items:center;opacity:0;transition:opacity .5s .5s}
.img-nav.vis{opacity:1}
.img-nav-btn{width:38px;height:38px;border-radius:50%;background:rgba(10,10,14,0.75);border:1px solid rgba(255,255,255,0.12);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .25s;text-decoration:none}
.img-nav-btn:hover{background:rgba(192,57,43,0.3);border-color:rgba(192,57,43,0.5)}
.img-nav-btn svg{width:14px;height:14px;stroke:rgba(255,255,255,0.6);fill:none;stroke-width:2}
.img-nav-contact{padding:8px 18px;background:rgba(10,10,14,0.75);border:1px solid rgba(255,255,255,0.12);border-radius:20px;font-size:11px;color:rgba(255,255,255,0.6);text-decoration:none;backdrop-filter:blur(12px);transition:all .25s}
.img-nav-contact:hover{color:#fff;background:rgba(192,57,43,0.3);border-color:rgba(192,57,43,0.5)}

/* brand top-left */
.hero-brand-top{position:absolute;top:28px;left:28px;z-index:6;font-family:'Bebas Neue';font-size:18px;letter-spacing:2px;padding:8px 16px;background:rgba(10,10,14,0.75);border:1px solid rgba(255,255,255,0.12);border-radius:20px;backdrop-filter:blur(12px);opacity:0;transition:opacity .5s .2s}
.hero-brand-top.vis{opacity:1}

/* ══ TICKER ══ */
.ticker-wrap{overflow:hidden;background:rgba(255,59,47,0.05);border-top:1px solid rgba(255,59,47,0.12);border-bottom:1px solid rgba(255,59,47,0.12);padding:10px 0;position:relative;z-index:20}
.ticker{display:flex;animation:tick 32s linear infinite;white-space:nowrap}
.ticker-item{font-family:'JetBrains Mono';font-size:10px;color:rgba(255,255,255,0.28);letter-spacing:3px;padding:0 28px;flex-shrink:0}
.ticker-item::before{content:'◆';color:rgba(255,59,47,0.5);margin-right:10px;font-size:7px}
@keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* ══ STATS BAND ══ */
.stats-band{padding:72px 52px;position:relative;overflow:hidden}
.stats-band::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(192,57,43,0.04) 40%,rgba(192,57,43,0.04) 60%,transparent 100%);pointer-events:none}
.stats-inner{max-width:880px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr)}
.stat-item{text-align:center;padding:0 20px;border-right:1px solid rgba(255,255,255,0.05)}
.stat-item:last-child{border-right:none}
.stat-n{font-family:'Bebas Neue';font-size:58px;color:#fff;line-height:1;letter-spacing:2px}
.stat-n span{color:var(--red-b)}
.stat-l{font-family:'JetBrains Mono';font-size:9px;color:var(--muted);letter-spacing:2.5px;margin-top:6px}

/* ══ SECTION COMMON ══ */
section{padding:100px 52px;position:relative}
.sec-inner{max-width:1120px;margin:0 auto}
.sec-pill{display:inline-flex;align-items:center;gap:8px;padding:5px 14px;background:rgba(255,59,47,0.07);border:1px solid rgba(255,59,47,0.2);border-radius:20px;font-family:'JetBrains Mono';font-size:9px;color:rgba(255,59,47,0.7);letter-spacing:3px;margin-bottom:14px}
h2.sh{font-family:'Bebas Neue';font-size:clamp(44px,5vw,76px);font-weight:400;line-height:.95;letter-spacing:2px}
h2.sh em{color:var(--red-b);font-style:normal;text-shadow:0 0 50px rgba(255,59,47,0.35)}

/* ══ HOW IT WORKS ══ */
.how-grid{display:grid;grid-template-columns:1fr 1fr;gap:72px;margin-top:60px;align-items:start}
.steps{display:flex;flex-direction:column;gap:28px}
.step{display:flex;gap:18px;align-items:flex-start}
.step-n{font-family:'Bebas Neue';font-size:38px;color:rgba(255,59,47,0.15);line-height:1;width:46px;flex-shrink:0}
.step h4{font-size:14px;font-weight:600;color:var(--text);margin-bottom:5px}
.step p{font-size:12px;color:var(--muted);line-height:1.75}
.atk-vis{background:rgba(12,12,18,0.9);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:24px;position:relative;overflow:hidden}
.atk-vis::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(192,57,43,0.04) 0%,transparent 60%);pointer-events:none}
.atk-title{font-family:'JetBrains Mono';font-size:8px;color:rgba(255,255,255,0.18);letter-spacing:3px;margin-bottom:20px}
.atk-row{display:flex;align-items:center;gap:14px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
.atk-row:last-child{border-bottom:none}
.atk-num{font-family:'JetBrains Mono';font-size:9px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.28);flex-shrink:0}
.atk-num.c{background:rgba(192,57,43,0.2);border-color:rgba(192,57,43,0.4);color:#e74c3c}
.atk-label{font-size:12px;color:rgba(255,255,255,0.45);flex:1}
.atk-row.caught .atk-label{color:rgba(255,255,255,0.88)}
.atk-status{font-family:'JetBrains Mono';font-size:8px;color:rgba(255,255,255,0.14);letter-spacing:1px}
.atk-status.c{color:#e74c3c}

/* ══ BENTO / FEATURES ══ */
#features{background:rgba(6,6,9,0.98)}
.bento-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  grid-template-rows:auto auto;
  gap:14px;
  margin-top:52px;
}

/* BASE CARD */
.fc{
  position:relative;overflow:hidden;
  border-radius:16px;
  border:1px solid rgba(255,59,47,0.12);
  padding:28px;
  background:var(--card-grad);
  transition:transform .35s ease,border-color .35s ease,box-shadow .35s ease;
  cursor:default;
}
.fc::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 80% 60% at 0% 0%,rgba(192,57,43,0.1) 0%,transparent 60%);
  pointer-events:none;z-index:0;
  opacity:0;transition:opacity .35s;
}
.fc::after{
  content:'';position:absolute;inset:0;
  border-radius:16px;
  background:linear-gradient(135deg,rgba(255,59,47,0.06) 0%,transparent 50%,rgba(192,57,43,0.04) 100%);
  pointer-events:none;z-index:0;
}
.fc:hover{
  transform:translateY(-4px);
  border-color:rgba(255,59,47,0.28);
  box-shadow:0 20px 60px rgba(0,0,0,0.7),0 0 40px rgba(192,57,43,0.12),inset 0 1px 0 rgba(255,59,47,0.08);
}
.fc:hover::before{opacity:1}

/* CARD VARIANTS */
.fc.alt1{background:var(--card-grad2)}
.fc.alt2{background:var(--card-grad3)}
.fc.alt3{background:linear-gradient(150deg,rgba(192,57,43,0.09) 0%,rgba(12,4,4,0.97) 45%,rgba(8,2,2,1) 100%)}
.fc.alt4{background:linear-gradient(120deg,rgba(10,3,3,0.98) 0%,rgba(192,57,43,0.07) 50%,rgba(12,4,4,0.95) 100%)}

/* card spanning */
.fc.span2{grid-column:span 2}

/* card z layering so content sits above pseudo */
.fc>*{position:relative;z-index:1}

/* CARD BADGE */
.fc-badge{
  display:inline-flex;align-items:center;gap:6px;
  padding:4px 10px;background:rgba(255,59,47,0.08);border:1px solid rgba(255,59,47,0.18);
  border-radius:20px;font-family:'JetBrains Mono';font-size:8px;color:rgba(255,59,47,0.7);
  letter-spacing:2.5px;margin-bottom:16px;
}
.fc-badge::before{content:'';width:4px;height:4px;background:var(--red-b);border-radius:50%;box-shadow:0 0 6px var(--red-b)}

/* CARD ICON */
.fc-icon{
  width:40px;height:40px;
  background:linear-gradient(135deg,rgba(192,57,43,0.2),rgba(192,57,43,0.06));
  border:1px solid rgba(255,59,47,0.2);border-radius:10px;
  display:flex;align-items:center;justify-content:center;margin-bottom:16px;
}
.fc-icon svg{width:18px;height:18px;stroke:var(--red-b);fill:none;stroke-width:1.5}

.fc-title{font-size:15px;font-weight:600;color:var(--text);margin-bottom:10px;line-height:1.35}
.fc-desc{font-size:12px;color:var(--muted);line-height:1.75}

/* CARD DIVIDER */
.fc-div{height:1px;background:linear-gradient(90deg,transparent,rgba(255,59,47,0.15),transparent);margin:16px 0}

/* ALERT CARD */
.alert-box{
  background:linear-gradient(135deg,rgba(192,57,43,0.07),rgba(10,3,3,0.9));
  border:1px solid rgba(192,57,43,0.18);
  border-radius:10px;padding:14px 16px;margin-top:14px;
}
.ab-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.ab-badge{font-family:'JetBrains Mono';font-size:9px;color:#e74c3c;letter-spacing:1px}
.ab-time{font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,0.18)}
.ab-file{font-size:11px;color:rgba(255,255,255,0.72);margin-bottom:4px}
.ab-meta{font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,0.28);margin-bottom:4px}
.ab-intent{font-family:'JetBrains Mono';font-size:9px;color:var(--red-b)}

/* TERMINAL */
.term{
  background:rgba(2,2,4,0.9);border:1px solid rgba(255,255,255,0.06);
  border-radius:8px;padding:12px 14px;
  font-family:'JetBrains Mono';font-size:10px;margin-top:14px;
  line-height:2;
}
.t-cm{color:rgba(255,255,255,0.25)}.t-cmd{color:#e74c3c}.t-ok{color:rgba(0,210,90,0.75)}.t-al{color:#e74c3c}

/* RISK GAUGE */
.risk-row{display:flex;align-items:center;gap:18px;margin-top:16px}
.risk-gauge{flex-shrink:0}
.risk-info h3{font-family:'Bebas Neue';font-size:26px;color:#ff3b2f;letter-spacing:1px}
.risk-info p{font-size:11px;color:var(--muted);line-height:1.65;margin-top:4px}

/* BARS MINI */
.mini-bars{display:flex;align-items:flex-end;gap:4px;height:52px;margin-top:14px}
.mb{flex:1;border-radius:2px 2px 0 0;background:rgba(192,57,43,0.25);transition:height .3s}
.mb.hot{background:linear-gradient(to top,rgba(192,57,43,0.8),rgba(255,59,47,0.9))}
.mb.mid{background:rgba(192,57,43,0.5)}

/* FEED */
.feed{display:flex;flex-direction:column;gap:7px;margin-top:14px}
.feed-row{display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono';font-size:9px}
.feed-dot{width:5px;height:5px;border-radius:50%;background:#e74c3c;flex-shrink:0;box-shadow:0 0 5px rgba(231,76,60,0.7)}
.feed-t{color:rgba(255,255,255,0.2)}.feed-f{flex:1;color:rgba(255,255,255,0.6)}.feed-s{color:#e74c3c;font-size:8px}

/* HONEYFILE LIST */
.hf-list{display:flex;flex-direction:column;gap:8px;margin-top:14px}
.hf-item{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:6px;transition:border-color .25s}
.hf-item:hover{border-color:rgba(255,59,47,0.18)}
.hf-name{font-family:'JetBrains Mono';font-size:10px;color:rgba(255,255,255,0.5)}
.hf-tag{font-family:'JetBrains Mono';font-size:8px;padding:2px 8px;border-radius:20px;letter-spacing:1px}
.hf-tag.decoy{background:rgba(255,59,47,0.1);color:rgba(255,59,47,0.7);border:1px solid rgba(255,59,47,0.15)}
.hf-tag.armed{background:rgba(0,200,100,0.08);color:rgba(0,200,100,0.6);border:1px solid rgba(0,200,100,0.15)}

/* GLOWING CORNER accent */
.fc-corner{position:absolute;bottom:0;right:0;width:140px;height:140px;background:radial-gradient(circle at bottom right,rgba(192,57,43,0.14) 0%,transparent 70%);pointer-events:none;z-index:0}
.fc-corner-tl{position:absolute;top:0;left:0;width:120px;height:120px;background:radial-gradient(circle at top left,rgba(192,57,43,0.1) 0%,transparent 70%);pointer-events:none;z-index:0}

/* ══ PROOF ══ */
.proof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:52px}
.pc{background:rgba(12,12,18,0.9);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:28px;position:relative;overflow:hidden;transition:border-color .3s,transform .3s}
.pc:hover{border-color:rgba(255,59,47,0.2);transform:translateY(-3px)}
.pc::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,59,47,0.25),transparent)}
.pc-q{font-size:13px;color:var(--muted);line-height:1.85;font-style:italic;margin-bottom:24px}
.pc-author{display:flex;align-items:center;gap:10px}
.pc-av{width:34px;height:34px;background:rgba(192,57,43,0.18);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue';font-size:14px;color:var(--red-b);flex-shrink:0;border:1px solid rgba(192,57,43,0.25)}
.pc-name{font-size:12px;font-weight:600;color:var(--text)}
.pc-role{font-family:'JetBrains Mono';font-size:8px;color:rgba(255,255,255,0.2);letter-spacing:1px;margin-top:2px}

/* ══ DEPLOY ══ */
#deploy{background:linear-gradient(180deg,rgba(8,8,12,0) 0%,rgba(192,57,43,0.03) 50%,rgba(8,8,12,0) 100%)}
.deploy-inner{max-width:860px;margin:0 auto;text-align:center}
.deploy-card{
  margin-top:48px;
  background:linear-gradient(135deg,rgba(18,6,6,0.97) 0%,rgba(12,4,4,0.95) 50%,rgba(192,57,43,0.05) 100%);
  border:1px solid rgba(255,59,47,0.15);border-radius:16px;padding:36px;
  display:flex;gap:36px;align-items:center;text-align:left;
  position:relative;overflow:hidden;
}
.deploy-card::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 80% at 100% 50%,rgba(192,57,43,0.07) 0%,transparent 70%);pointer-events:none}
.code-b{font-family:'JetBrains Mono';font-size:12px;flex:1;line-height:2;position:relative;z-index:1}
.cc{color:rgba(255,255,255,0.25)}.ccmd{color:#e74c3c}
.deploy-btns{display:flex;flex-direction:column;gap:10px;flex-shrink:0;position:relative;z-index:1}

/* ══ FOOTER ══ */
footer{padding:28px 52px;border-top:1px solid var(--bdr)}
.footer-inner{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.footer-wordmark{font-family:'Bebas Neue';font-size:18px;letter-spacing:2px;color:rgba(255,255,255,0.3)}
.footer-copy{font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,0.12);letter-spacing:2px}
.live-pill{display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,0.2);letter-spacing:2px}
.live-dot{width:5px;height:5px;border-radius:50%;background:#22cc66;box-shadow:0 0 6px #22cc66;animation:blink 2s ease infinite}

/* ══ SCROLL REVEALS ══ */
.rev,.rev-l,.rev-r{opacity:0;transform:translateY(40px);transition:opacity .75s ease,transform .75s ease}
.rev-l{transform:translateX(-40px)}.rev-r{transform:translateX(40px)}
.rev.on,.rev-l.on,.rev-r.on{opacity:1;transform:none}

/* ══ NOISE OVERLAY ══ */
#noise{position:fixed;inset:0;z-index:8999;pointer-events:none;opacity:.025;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:200px}

/* KEYFRAMES */
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes floatUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
`

export default function Landing() {
  const [loaderHide, setLoaderHide] = useState(false)
  const [navVis, setNavVis]         = useState(false)
  const [heroVis, setHeroVis]       = useState(false)
  const curRef  = useRef(null)
  const ringRef = useRef(null)
  const heroRightRef = useRef(null)
  const gridBgRef = useRef(null)

  /* ── inject CSS ── */
  useEffect(() => {
    const id = 'ls-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = CSS
      document.head.appendChild(s)
    }
    /* loader */
    document.querySelectorAll('.lline').forEach((el,i) =>
      setTimeout(() => el.classList.add('show'), 300 + i * 380)
    )
    const barEl = document.querySelector('.ld-bar')
    if (barEl) setTimeout(() => barEl.classList.add('go'), 50)
    const t1 = setTimeout(() => setLoaderHide(true), 2200)
    const t2 = setTimeout(() => { setNavVis(true); setHeroVis(true) }, 2900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  /* ── scroll reveals ── */
  useEffect(() => {
    if (!heroVis) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on') })
    }, { threshold: 0.14 })
    document.querySelectorAll('.rev,.rev-l,.rev-r').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [heroVis])

  /* ── parallax on scroll ── */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const grid = gridBgRef.current
      if (grid) grid.style.transform = `translateY(${y * 0.22}px)`
      /* parallax on hero image — moves slower → depth */
      const img = document.querySelector('.hero-img')
      if (img) img.style.transform = `scale(1.05) translateY(${y * 0.15}px)`
      /* floating callouts drift away slightly */
      document.querySelectorAll('.callout').forEach((el, i) => {
        el.style.transform = `translateX(0) translateY(${y * (0.06 + i * 0.02)}px)`
      })
      const nav = document.querySelector('nav')
      if (nav) nav.classList.toggle('scrolled', y > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── cursor ── */
  useEffect(() => {
    let rx = 0, ry = 0
    const move = e => {
      if (curRef.current) {
        curRef.current.style.left = e.clientX + 'px'
        curRef.current.style.top  = e.clientY + 'px'
      }
      rx += (e.clientX - rx) * 0.1
      ry += (e.clientY - ry) * 0.1
      if (ringRef.current) {
        ringRef.current.style.left = e.clientX + 'px'
        ringRef.current.style.top  = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const LLINES = ['INITIALIZING DETECTION ENGINE...','DEPLOYING HONEYFILES...','ARMING TRAP SYSTEM...','INTRUSENSE v4.0 READY']

  return (
    <>
      {/* LOADER */}
      <div id="loader" className={loaderHide ? 'hide' : ''}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div className="ld-icon">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span className="ld-word">INTRUSENSE</span>
        </div>
        <div className="ld-bar-bg"><div className="ld-bar"/></div>
        <div className="ld-lines">
          {LLINES.map((l,i) => <div key={i} className="lline">{l}</div>)}
        </div>
      </div>
            <style>

</style>


      <div id="cur" ref={curRef}/>
      <div id="cur-ring" ref={ringRef}/>
      <div id="noise"/>

      {/* NAV */}
      <nav className={navVis ? 'vis' : ''}>
        <a href="/" className="nav-logo">
          <div className="nav-logo-box">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span className="nav-logo-text">INTRUSENSE</span>
        </a>
        <a href="#how" className="nav-link">How It Works</a>
        <a href="#features" className="nav-link">Features</a>
        <a href="#deploy" className="nav-link">Deploy</a>
        <div className="nav-r">
          <a href="/api/report" className="nav-ghost">Report</a>
          <a href="/dashboard" className="nav-cta">Live Dashboard →</a>
        </div>
      </nav>

      {/* ═══════════════════════════════
           HERO — PREMIUM SLEEK
      ════════════════════════════════ */}
<section id="hero">
  {/* BACKGROUND DECOR */}
  <div className="grid-bg" ref={gridBgRef}/>
  <div className="hero-vignette"/>
  <div className="scanlines"/>
  <div className="beam-v"/>
  <div className="orb orb-1"/>
  <div className="orb orb-2"/>

  <div className="hero-container">
    {/* LEFT: CONTENT */}
    <div className="hero-left">
      <div className={`hero-eyebrow ${heroVis?'vis':''}`}>
        <span className="ey-dot"/>
        DECEPTION SECURITY PLATFORM v4.0
      </div>

      <h1 className="hero-h1">
        <span className="hl">
          <span className={`hw ${heroVis?'vis':''}`} style={{transitionDelay:'.12s'}}>DETECT.</span>
        </span>
        <span className="hl">
          <span className={`hw ${heroVis?'vis':''}`} style={{transitionDelay:'.26s'}}>DECEIVE.</span>
        </span>
        <span className="hl">
          <span className={`hw accent ${heroVis?'vis':''}`} style={{transitionDelay:'.42s'}}>DOMINATE.</span>
        </span>
      </h1>

      <div className={`hero-h1-line ${heroVis?'vis':''}`}/>

      <p className={`hero-desc ${heroVis?'vis':''}`}>
        Post-compromise honeytrap that catches attackers{' '}
        <em style={{color:'rgba(255,255,255,0.72)',fontStyle:'normal',fontWeight:500}}>after they're already inside</em>.
        AI intent scoring. Sub-2-second alerts. Zero false positives.
      </p>

      <div className={`hero-actions ${heroVis?'vis':''}`}>
        <a href="/dashboard" className="btn-primary">
          <svg viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          Launch Dashboard
        </a>
        <a href="#how" className="btn-sec">Explore Tech</a>
      </div>

      <div className={`trust ${heroVis?'vis':''}`}>
        <span className="trust-lbl">BUILT ON</span>
        {['Python 3','Leaflet.js','React','Telegram API','MITRE ATT&CK'].map(t=>(
          <span key={t} className="trust-chip">{t}</span>
        ))}
      </div>
    </div>

    {/* RIGHT: PREMIUM IMAGE PANEL */}
    <div className={`hero-image-wrapper rev-r ${heroVis?'on':''}`} ref={heroRightRef}>
      <div className="shape-mask">
        <img src="/intru.png" alt="IntruSense Core" className="hero-img"/>
        <div className="hero-img-overlay"/>
      </div>

      {/* HUD WIDGET — bottom right */}
      <div className="hud-widget w1">
        <div className="hud-label">THREAT LEVEL</div>
        <div className="hud-val"><span>CRITICAL</span></div>
        <div className="hud-sub"><span className="hud-dot"/>ACTIVE MONITORING</div>
      </div>

      {/* HUD WIDGET — top right */}
      <div className="hud-widget w2">
        <div className="hud-label">DETECTION TIME</div>
        <div className="hud-val"><span>&lt;2</span>s</div>
        <div className="hud-sub">ZERO FALSE POSITIVES</div>
      </div>
    </div>
  </div>
</section>
      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker">
          {['REAL-TIME DETECTION','ZERO FALSE POSITIVES','AI INTENT ANALYSIS','TELEGRAM ALERTS',
            'IP GEOLOCATION','BRUTE FORCE DETECTION','SSH MONITORING','PSYCHOLOGICAL HONEYTRAP',
            'REAL-TIME DETECTION','ZERO FALSE POSITIVES','AI INTENT ANALYSIS','TELEGRAM ALERTS',
            'IP GEOLOCATION','BRUTE FORCE DETECTION','SSH MONITORING','PSYCHOLOGICAL HONEYTRAP'].map((t,i)=>(
            <div key={i} className="ticker-item">{t}</div>
          ))}
        </div>
      </div>

      {/* STATS BAND */}
      <div className="stats-band">
        <div className="stats-inner">
          {[['<2','s','Detection time'],['0','','False positives'],['100','%','Post-breach coverage'],['5','MIN','Setup time']].map(([n,s,l])=>(
            <div key={l} className="stat-item rev">
              <div className="stat-n">{n}<span>{s}</span></div>
              <div className="stat-l">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="sec-inner">
          <div className="rev" style={{textAlign:'center',marginBottom:8}}>
            <div className="sec-pill" style={{display:'inline-flex'}}>HOW IT WORKS</div>
          </div>
          <div className="rev" style={{textAlign:'center'}}>
            <h2 className="sh" style={{maxWidth:580,margin:'0 auto'}}>FROM BREACH TO BLOCK <em>IN SECONDS</em></h2>
          </div>
          <div className="how-grid">
            <div className="steps rev-l">
              {[
                ['01','Deploy Honeyfiles','Plant fake credentials, API keys, salary sheets. Realistic content with psychological breadcrumb trails that keep attackers engaged longer.'],
                ['02','Attacker Breaks In','SSH brute force or stolen credentials. Every failed attempt logged as recon in real-time — before any file is touched.'],
                ['03','Trap Triggered','File opened or copied via SCP — detection fires instantly, silently, with zero impact on real systems.'],
                ['04','Alert + Block','Telegram alert with AI-classified intent, confidence score, MITRE ATT&CK tags, and IP geolocation. IP auto-blocked.'],
              ].map(([n,h,p]) => (
                <div key={n} className="step">
                  <div className="step-n">{n}</div>
                  <div><h4>{h}</h4><p>{p}</p></div>
                </div>
              ))}
            </div>
            <div className="atk-vis rev-r">
              <div className="atk-title">ATTACK CHAIN VISUALIZATION</div>
              {[
                ['01','Perimeter breach via SSH','s'],
                ['02','Lateral movement through dirs','s'],
                ['03','Locates sensitive folders','s'],
                ['04','Opens employee_credentials.txt','c'],
                ['05','IP blocked — report generated','c'],
              ].map(([n,l,t]) => (
                <div key={n} className={`atk-row${t==='c'?' caught':''}`}>
                  <div className={`atk-num${t==='c'?' c':''}`}>{n}</div>
                  <div className="atk-label">{l}</div>
                  <div className={`atk-status${t==='c'?' c':''}`}>{t==='c'?'● ALERT':'○ SILENT'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
           FEATURES — PREMIUM BENTO
      ════════════════════════════════ */}
      <section id="features">
        <div className="sec-inner">
          <div className="rev" style={{textAlign:'center'}}>
            <div className="sec-pill" style={{display:'inline-flex'}}>CAPABILITIES</div>
            <h2 className="sh" style={{maxWidth:620,margin:'14px auto 0'}}>BUILT FOR <em>REAL COMPANIES</em>,<br/>DEPLOYABLE IN MINUTES</h2>
          </div>

          <div className="bento-grid rev" style={{transitionDelay:'.15s'}}>

            {/* CARD 1 — Recon Detection (narrow) */}
            <div className="fc alt1">
              <div className="fc-corner"/>
              <div className="fc-badge">RECON DETECTION</div>
              <div className="fc-icon">
                <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <div className="fc-title">Catches Attackers Before Any File Is Touched</div>
              <div className="fc-desc">5+ failed logins in 60 seconds triggers a recon alert — logs every attempt with timestamp and geolocation.</div>
              <div className="fc-div"/>
              <div style={{display:'flex',gap:12}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'Bebas Neue',fontSize:28,color:'var(--red-b)',lineHeight:1}}>{'<'}2s</div>
                  <div style={{fontFamily:'JetBrains Mono',fontSize:8,color:'var(--muted)',letterSpacing:'1.5px',marginTop:4}}>ALERT</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'Bebas Neue',fontSize:28,color:'#fff',lineHeight:1}}>0</div>
                  <div style={{fontFamily:'JetBrains Mono',fontSize:8,color:'var(--muted)',letterSpacing:'1.5px',marginTop:4}}>FALSE POS.</div>
                </div>
              </div>
            </div>

            {/* CARD 2 — AI Analyst (wide) */}
            <div className="fc alt2 span2">
              <div className="fc-corner-tl"/>
              <div className="fc-badge">AI SECURITY ANALYST</div>
              <div className="fc-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              </div>
              <div className="fc-title">Intent Classification with Confidence Score & MITRE Tagging</div>
              <div className="alert-box">
                <div className="ab-header">
                  <span className="ab-badge">🔴 CRITICAL ALERT</span>
                  <span className="ab-time">22:18:04 UTC</span>
                </div>
                <div className="ab-file">employee_credentials.txt + api_keys.env + db_backup.sql accessed</div>
                <div className="ab-meta">IP: 192.168.1.35 · Kolkata, India · 3 files in 42 seconds</div>
                <div className="ab-intent">Intent: CREDENTIAL HARVESTING · 91% confidence · MITRE T1552.001</div>
              </div>
            </div>

            {/* CARD 3 — Live Detection Terminal */}
            <div className="fc alt3">
              <div className="fc-corner"/>
              <div className="fc-badge">LIVE DETECTION</div>
              <div className="fc-icon">
                <svg viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
              </div>
              <div className="fc-title">Dual-Layer Detection Engine</div>
              <div className="term">
                <div className="t-cm"><span style={{color:'var(--red-b)'}}>$</span> python start.py</div>
                <div className="t-ok">[OK] Watching Documents/</div>
                <div className="t-ok">[OK] SSH monitor active</div>
                <div className="t-al">[ALERT] api_keys.env READ</div>
                <div className="t-ok">[BLOCK] 192.168.1.35 blocked</div>
              </div>
            </div>

            {/* CARD 4 — Risk Gauge */}
            <div className="fc alt4">
              <div className="fc-corner-tl"/>
              <div className="fc-badge">RISK SCORING</div>
              <div className="fc-title">0–100 Real-Time Risk Engine</div>
              <div className="risk-row">
                <svg className="risk-gauge" width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="url(#rg)" strokeWidth="6"
                    strokeLinecap="round" transform="rotate(-90 40 40)"
                    strokeDasharray="201" strokeDashoffset="26"
                    style={{filter:'drop-shadow(0 0 8px rgba(255,59,47,0.7))'}}/>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#c0392b"/>
                      <stop offset="100%" stopColor="#ff3b2f"/>
                    </linearGradient>
                  </defs>
                  <text x="40" y="46" textAnchor="middle" fontFamily="Bebas Neue" fontSize="20" fill="#ff3b2f">87</text>
                </svg>
                <div className="risk-info">
                  <h3>CRITICAL</h3>
                  <p>Credential harvesting<br/>3 files in 42s<br/>IP: 192.168.1.35</p>
                </div>
              </div>
              <div className="mini-bars">
                {[30,55,40,25,65,100,88,80,70,92].map((h,i)=>(
                  <div key={i} className={`mb${h>=80?' hot':h>=50?' mid':''}`} style={{height:`${h}%`}}/>
                ))}
              </div>
            </div>

            {/* CARD 5 — Event Feed */}
            <div className="fc alt1">
              <div className="fc-badge">LIVE EVENT FEED</div>
              <div className="fc-icon">
                <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div className="fc-title">Real-Time Activity Stream</div>
              <div className="feed">
                {[['22:17:43','credentials.txt'],['22:17:51','api_keys.env'],['22:18:02','db_backup.sql'],['22:18:10','salary_2025.xlsx']].map(([t,f])=>(
                  <div key={t} className="feed-row">
                    <div className="feed-dot"/>
                    <span className="feed-t">{t}</span>
                    <span className="feed-f">{f}</span>
                    <span className="feed-s">READ</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 6 — Honeyfiles (wide) */}
            <div className="fc alt2 span2">
              <div className="fc-corner"/>
              <div className="fc-badge">PSYCHOLOGICAL HONEYTRAP</div>
              <div className="fc-icon">
                <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="fc-title">Layered Deception — Keeps Attackers Engaged Longer for Forensic Analysis</div>
              <div className="fc-desc" style={{marginBottom:14}}>Breadcrumb file system leads attackers deeper. Each accessed file suggests the next, creating the illusion of more valuable data ahead.</div>
              <div className="hf-list">
                {[
                  ['employee_credentials.txt','DECOY'],
                  ['api_keys.env','ARMED'],
                  ['db_backup.sql','ARMED'],
                  ['salary_2025.xlsx','DECOY'],
                ].map(([name, tag]) => (
                  <div key={name} className="hf-item">
                    <span className="hf-name">{name}</span>
                    <span className={`hf-tag ${tag.toLowerCase()}`}>{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 7 — Deployment (narrow) */}
            <div className="fc alt3">
              <div className="fc-corner-tl"/>
              <div className="fc-badge">INSTANT DEPLOY</div>
              <div className="fc-icon">
                <svg viewBox="0 0 24 24"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
              </div>
              <div className="fc-title">5-Minute Setup. No Cloud. No Cost.</div>
              <div className="fc-desc">Runs on any Linux box. SSH + file monitor. Remote access via ngrok. Telegram alerts out of the box.</div>
              <div className="fc-div"/>
              <div style={{fontFamily:'JetBrains Mono',fontSize:10,color:'var(--red-b)',letterSpacing:'1px'}}>pip install → python start.py → done.</div>
            </div>

          </div>
        </div>
      </section>

      {/* PROOF */}
      <section id="proof">
        <div className="sec-inner">
          <div className="rev" style={{textAlign:'center'}}>
            <div className="sec-pill" style={{display:'inline-flex'}}>WHY IT WORKS</div>
            <h2 className="sh" style={{maxWidth:560,margin:'14px auto 0'}}>DESIGNED FOR THE <em>REAL THREAT</em> LANDSCAPE</h2>
          </div>
          <div className="proof-grid rev" style={{transitionDelay:'.2s'}}>
            {[
              ['"Traditional tools watch the front door. HoneyTrap watches what happens after the attacker is already inside — that\'s where the real damage occurs."','SK','Security Researcher','Post-Compromise Detection'],
              ['"74% of breaches involve file access that goes undetected for 207 days. HoneyTrap closes this gap with zero false positives and sub-2-second detection."','AT','Industry Data','2025 Breach Report'],
              ['"SMEs don\'t have SIEM budgets. HoneyTrap gives them enterprise-grade post-compromise detection, running on hardware they already own."','RV','SME Security Gap','Market Analysis'],
            ].map(([q,av,n,r]) => (
              <div key={n} className="pc">
                <p className="pc-q">{q}</p>
                <div className="pc-author">
                  <div className="pc-av">{av}</div>
                  <div><div className="pc-name">{n}</div><div className="pc-role">{r}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPLOY */}
      <section id="deploy">
        <div className="deploy-inner">
          <div className="rev">
            <div className="sec-pill" style={{display:'inline-flex'}}>DEPLOYMENT</div>
            <h2 className="sh" style={{maxWidth:560,margin:'14px auto 0',textAlign:'center'}}>READY IN <em>5 MINUTES</em>.<br/>NO CLOUD. NO COST.</h2>
          </div>
          <div className="deploy-card rev" style={{transitionDelay:'.2s'}}>
<div className="code-b">
  <div className="cc"># 1. Download the project</div>
  <div className="cc">
    <span className="ccmd">
      https://github.com/heaven-swastik/IntruSense_Honeypot
    </span>
  </div>
  <div style={{height:8}}/>

  <div className="cc"># 2. Install Docker (if not already installed)</div>
  <div className="cc">
    <span className="ccmd">https://www.docker.com/</span>
  </div>
  <div style={{height:8}}/>

  <div className="cc"># 3. Run the system</div>
  <div className="cc">
    <span className="ccmd">docker-compose up --build</span>
  </div>
  <div style={{height:8}}/>

  <div className="cc"># 🚀 Boom! Your system is ready locally</div>
</div>
            <div className="deploy-btns">
              <a href="/dashboard" className="btn-primary">Open Live Dashboard →</a>
              <a href="/api/report" className="btn-sec">Download Report</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div className="nav-logo-box" style={{width:30,height:30,borderRadius:7}}>
              <svg viewBox="0 0 24 24" style={{stroke:'#fff',fill:'none',strokeWidth:2,width:13,height:13}}>
                <path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="footer-wordmark">INTRUSENSE</span>
          </div>
          <span className="footer-copy">CS 007 — DECEPTION SECURITY PLATFORM — 2026</span>
          <div className="live-pill"><div className="live-dot"/>MONITORING ACTIVE</div>
        </div>
      </footer>
    </>
  )
}