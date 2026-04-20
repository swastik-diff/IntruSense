import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import useSocket from '../hooks/useSocket.js'

/* ─── Leaflet lazy loader ─── */
let _L = null
async function getL() {
  if (_L) return _L
  _L = (await import('leaflet')).default
  return _L
}

/* ═══════════════════════════════════════════════════════════════
   CSS — Unified red/dark theme, no purple, stronger glass blur,
   brighter map, improved left panel, cleaner tabs
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
@font-face{font-family:'Mechsuit';src:url('./assets/fonts/Mechsuit.otf') format('opentype')}

*{margin:0;padding:0;box-sizing:border-box}

:root{
  --cr:#c0392b;--crb:#e74c3c;--crg:rgba(192,57,43,.35);--crd:rgba(192,57,43,.12);
  --cr-glow:rgba(231,76,60,.55);
  --bg:#04040a;--s1:#080810;--s2:#0d0d18;--s3:#111120;
  --bdr:rgba(255,255,255,.07);--bdr2:rgba(255,255,255,.13);
  --bdr-red:rgba(231,76,60,.35);
  --text:rgba(255,255,255,.95);--sub:rgba(255,255,255,.6);--muted:rgba(255,255,255,.32);
  --green:#22c55e;--green-g:rgba(34,197,94,.2);
  --amber:#f59e0b;--blue:#3b82f6;--cyan:#06b6d4;
  /* NO PURPLE — replaced with teal/cyan accent */
  --glass:rgba(255,255,255,.025);
  --glass-border:rgba(255,255,255,.22);
  --r:12px;--r2:16px;
  --shadow:0 8px 32px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.04);
  --shadow-red:0 8px 40px rgba(192,57,43,.35),0 0 0 1px rgba(231,76,60,.22);
  --grad-red:linear-gradient(135deg,rgba(192,57,43,.18) 0%,rgba(231,76,60,.06) 60%,rgba(0,0,0,0) 100%);
  --grad-card:linear-gradient(135deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.01) 100%);
}

html,body,#root{height:100%;overflow:hidden}
body{background:var(--bg);color:var(--text);font-family:'Syne',sans-serif}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(192,57,43,.45);border-radius:2px}
::-webkit-scrollbar-track{background:transparent}

/* ─── ROOT GLOW OVERLAY ─── */
#db-root{height:100vh;display:flex;flex-direction:column;overflow:hidden;position:relative}
#db-root::before{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 80% 40% at 50% 0%,rgba(192,57,43,.08) 0%,transparent 70%),
    radial-gradient(ellipse 35% 55% at 100% 50%,rgba(192,57,43,.04) 0%,transparent 70%),
    radial-gradient(ellipse 35% 55% at 0% 70%,rgba(192,57,43,.04) 0%,transparent 70%);
}

/* ─── TOPBAR ─── */
#tb{
  height:54px;
  background:rgba(4,4,10,.96);
  border-bottom:1px solid rgba(231,76,60,.22);
  display:flex;align-items:center;padding:0 16px;gap:10px;
  flex-shrink:0;
  backdrop-filter:blur(40px) saturate(1.5);
  -webkit-backdrop-filter:blur(40px) saturate(1.5);
  z-index:300;position:relative;
  box-shadow:0 1px 0 rgba(231,76,60,.14),0 4px 32px rgba(0,0,0,.5);
}
.tb-logo{display:flex;align-items:center;gap:9px;text-decoration:none;cursor:pointer;flex-shrink:0}
.tb-icon{
  width:32px;height:32px;
  background:linear-gradient(135deg,#c0392b,#e74c3c);
  border-radius:9px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 22px rgba(192,57,43,.55),0 0 44px rgba(192,57,43,.22);
}
.tb-icon svg{width:15px;height:15px;stroke:#fff;fill:none;stroke-width:2}
.tb-brand{font-family:'Mechsuit',sans-serif;font-size:15px;letter-spacing:3px;color:#fff;text-shadow:0 0 22px rgba(231,76,60,.45)}
.tb-sep{width:1px;height:22px;background:rgba(255,255,255,.08);flex-shrink:0}
.tb-status{display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono';font-size:9px;letter-spacing:2px;color:var(--crb)}
.tb-pulse{width:7px;height:7px;border-radius:50%;background:var(--green);animation:tbPulse 2s ease infinite;flex-shrink:0}
.tb-pulse.off{background:rgba(255,255,255,.2);animation:none}
@keyframes tbPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.65)}70%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}
.tb-r{margin-left:auto;display:flex;align-items:center;gap:8px}
.tb-time{font-family:'JetBrains Mono';font-size:10px;color:var(--muted)}
.tb-btn{
  padding:6px 12px;border:1px solid var(--bdr);border-radius:8px;
  font-family:'JetBrains Mono';font-size:8.5px;
  color:var(--muted);cursor:pointer;background:transparent;
  text-decoration:none;transition:all .2s;letter-spacing:1px;white-space:nowrap;
}
.tb-btn:hover{border-color:var(--bdr2);color:var(--text);background:rgba(255,255,255,.03)}
.tb-btn.danger{border-color:rgba(192,57,43,.3);color:var(--crb)}
.tb-btn.danger:hover{background:rgba(192,57,43,.14);border-color:rgba(192,57,43,.65);box-shadow:0 0 14px rgba(192,57,43,.25)}
.tb-btn.report{border-color:rgba(6,182,212,.3);color:#67e8f9}
.tb-btn.report:hover{background:rgba(6,182,212,.1);border-color:rgba(6,182,212,.55);box-shadow:0 0 12px rgba(6,182,212,.2)}

/* ─── NOTIFICATION BELL ─── */
.nb-wrap{position:relative;z-index:9998}
.nb-btn{
  width:34px;height:34px;border-radius:9px;
  background:transparent;border:1px solid var(--bdr);
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:all .2s;position:relative;
}
.nb-btn:hover,.nb-btn.open{border-color:rgba(192,57,43,.5);background:var(--crd);box-shadow:0 0 14px rgba(192,57,43,.22)}
.nb-btn svg{width:15px;height:15px;stroke:var(--muted);fill:none;stroke-width:2;transition:stroke .2s}
.nb-btn.has svg,.nb-btn.open svg{stroke:var(--crb)}
.nb-badge{
  position:absolute;top:-6px;right:-6px;
  min-width:17px;height:17px;
  background:linear-gradient(135deg,#c0392b,#e74c3c);
  border-radius:9px;font-family:'JetBrains Mono';font-size:8px;
  color:#fff;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  padding:0 3px;border:2px solid var(--bg);
  animation:badgePop .3s cubic-bezier(.175,.885,.32,1.275);
  box-shadow:0 0 9px rgba(192,57,43,.55);
}
@keyframes badgePop{from{transform:scale(0)}to{transform:scale(1)}}

/* ─── NOTIFICATION PANEL — DEEP GLASS ─── */
.np{
  position:absolute;top:calc(100% + 12px);right:0;width:390px;
  background:rgba(5,3,10,.88);
  border:1px solid rgba(231,76,60,.3);
  border-radius:18px;
  backdrop-filter:blur(52px) saturate(1.7);
  -webkit-backdrop-filter:blur(52px) saturate(1.7);
  z-index:9999;overflow:hidden;
  box-shadow:0 28px 72px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.05),0 0 50px rgba(192,57,43,.18);
  transition:opacity .22s cubic-bezier(.4,0,.2,1),transform .22s cubic-bezier(.4,0,.2,1);
  transform-origin:top right;
}
.np.closed{opacity:0;transform:scale(.93) translateY(-10px);pointer-events:none}
.np::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(231,76,60,.6),transparent);
}
.np-hd{
  padding:14px 18px;
  border-bottom:1px solid rgba(255,255,255,.06);
  display:flex;align-items:center;justify-content:space-between;
  background:rgba(192,57,43,.05);
}
.np-ttl{font-size:13px;font-weight:600;letter-spacing:.5px}
.np-cnt{font-family:'JetBrains Mono';font-size:9px;color:var(--crb);margin-left:7px;
  background:rgba(192,57,43,.15);padding:2px 7px;border-radius:10px;border:1px solid rgba(192,57,43,.28)}
.np-clr{font-family:'JetBrains Mono';font-size:9px;color:var(--muted);cursor:pointer;border:1px solid transparent;background:rgba(255,255,255,.04);padding:5px 10px;border-radius:6px;transition:all .2s}
.np-clr:hover{color:var(--crb);background:var(--crd);border-color:rgba(192,57,43,.22)}
.np-list{max-height:380px;overflow-y:auto}
.np-empty{padding:40px;text-align:center;font-family:'JetBrains Mono';font-size:10px;color:rgba(255,255,255,.12);letter-spacing:2px;line-height:2.4}
.np-item{
  padding:11px 16px;border-bottom:1px solid rgba(255,255,255,.04);
  display:flex;gap:11px;align-items:flex-start;
  transition:background .15s;animation:npSlide .28s cubic-bezier(.4,0,.2,1);position:relative;
}
@keyframes npSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.np-item.fresh{background:rgba(192,57,43,.09)}
.np-item.fresh::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(180deg,#e74c3c,rgba(192,57,43,.3))}
.np-ico{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.np-ico.critical{background:rgba(192,57,43,.22);border:1px solid rgba(192,57,43,.38);box-shadow:0 0 9px rgba(192,57,43,.22)}
.np-ico.high{background:rgba(245,115,0,.17);border:1px solid rgba(245,115,0,.3)}
.np-ico.medium{background:rgba(245,158,11,.13);border:1px solid rgba(245,158,11,.24)}
.np-ico.info{background:rgba(6,182,212,.13);border:1px solid rgba(6,182,212,.24)}
.np-ico svg{width:12px;height:12px;stroke:#fff;fill:none;stroke-width:2}
.np-bd{flex:1;min-width:0}
.np-r1{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px}
.np-sv{font-family:'JetBrains Mono';font-size:8px;letter-spacing:1.5px;font-weight:600}
.np-sv.critical{color:#ff4444}.np-sv.high{color:#ff7700}.np-sv.medium{color:#f59e0b}.np-sv.info{color:#67e8f9}
.np-xc{font-family:'JetBrains Mono';font-size:8px;background:rgba(255,255,255,.07);border-radius:10px;padding:2px 7px;color:rgba(255,255,255,.4)}
.np-msg{font-size:11.5px;color:var(--text);margin-bottom:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.np-ai{font-size:10px;color:rgba(255,59,47,.65);font-style:italic;margin-bottom:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical}
.np-meta{font-family:'JetBrains Mono';font-size:8px;color:var(--muted)}

/* ─── LAYOUT ─── */
#layout{flex:1;display:grid;grid-template-columns:280px 1fr 300px;overflow:hidden;min-height:0;position:relative;z-index:1}

/* ══════════════════════════════
   LEFT PANEL — Redesigned
══════════════════════════════ */
#left{
  border-right:1px solid var(--bdr);
  display:flex;flex-direction:column;
  background:var(--s1);overflow:hidden;
}

/* Left header */
.lp-header{
  padding:13px 15px 0;flex-shrink:0;
}
.lp-title-row{
  display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;
}
.lp-title{font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--text)}
.lp-count-badge{
  padding:3px 10px;
  background:rgba(192,57,43,.15);
  border:1px solid rgba(192,57,43,.3);
  border-radius:20px;
  font-family:'JetBrains Mono';font-size:8px;
  color:var(--crb);font-weight:600;
  box-shadow:0 0 8px rgba(192,57,43,.15);
}

/* Sort / filter mini-row */
.lp-filters{
  display:flex;gap:5px;margin-bottom:11px;
}
.lp-filter-btn{
  flex:1;padding:5px 0;
  background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.06);
  border-radius:6px;
  font-family:'JetBrains Mono';font-size:7.5px;
  color:var(--muted);cursor:pointer;
  transition:all .18s;letter-spacing:.5px;text-align:center;
}
.lp-filter-btn:hover{border-color:rgba(192,57,43,.25);color:var(--sub)}
.lp-filter-btn.active{
  background:rgba(192,57,43,.12);
  border-color:rgba(192,57,43,.32);
  color:var(--crb);
  box-shadow:0 0 8px rgba(192,57,43,.12);
}

/* Divider */
.lp-div{
  height:1px;background:var(--bdr);margin:0 0 0 0;flex-shrink:0;
}

/* Threat list scroll area */
.lp-scroll{flex:1;overflow-y:auto}

/* Individual threat row */
.ac{
  padding:11px 15px;
  border-bottom:1px solid rgba(255,255,255,.03);
  cursor:pointer;transition:all .15s;
  position:relative;overflow:hidden;
}
.ac::before{
  content:'';position:absolute;left:0;top:0;bottom:0;width:0;
  background:linear-gradient(90deg,rgba(192,57,43,.18),transparent);
  transition:width .2s;
}
.ac:hover::before{width:100%}
.ac.sel::before{width:100%}
.ac.sel{border-left:2px solid var(--crb);background:rgba(192,57,43,.07);box-shadow:inset 0 0 24px rgba(192,57,43,.06)}

/* Score pill — left edge indicator */
.ac-severity-bar{
  position:absolute;left:0;top:0;bottom:0;width:3px;
  border-radius:0 2px 2px 0;
}
.ac-severity-bar.critical{background:linear-gradient(180deg,#ff4444,#c0392b);box-shadow:2px 0 8px rgba(192,57,43,.4)}
.ac-severity-bar.high{background:linear-gradient(180deg,#ff8800,#c06000)}
.ac-severity-bar.medium{background:linear-gradient(180deg,#f59e0b,#b57300)}
.ac-severity-bar.low{background:linear-gradient(180deg,#22c55e,#158a3e)}

.ac-main{padding-left:8px}
.ac-row1{display:flex;align-items:center;justify-content:space-between;margin-bottom:2px}
.ac-ip{font-family:'JetBrains Mono';font-size:10.5px;font-weight:500;color:var(--text)}
.ac-score{
  font-family:'Mechsuit',sans-serif;font-size:13px;letter-spacing:.5px;
}
.ac-score.critical{color:#ff4444;text-shadow:0 0 8px rgba(255,68,68,.5)}
.ac-score.high{color:#ff8800}
.ac-score.medium{color:#f59e0b}
.ac-score.low{color:#22c55e}

.ac-row2{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}
.ac-loc{font-family:'JetBrains Mono';font-size:8px;color:var(--muted)}
.ac-rv{padding:1px 6px;border-radius:4px;font-family:'JetBrains Mono';font-size:7px;font-weight:700;letter-spacing:.5px}
.rv-critical{background:rgba(192,57,43,.2);color:#ff5555;border:1px solid rgba(192,57,43,.35);box-shadow:0 0 5px rgba(192,57,43,.18)}
.rv-high{background:rgba(192,100,0,.2);color:#ff8800;border:1px solid rgba(192,100,0,.3)}
.rv-medium{background:rgba(192,150,0,.15);color:#ddaa00;border:1px solid rgba(192,150,0,.22)}
.rv-low{background:rgba(0,160,0,.1);color:#44cc44;border:1px solid rgba(0,160,0,.2)}

.ac-tags{display:flex;gap:3px;flex-wrap:wrap;margin-bottom:6px}
.ac-tag{
  font-family:'JetBrains Mono';font-size:7px;padding:2px 6px;border-radius:4px;
  background:rgba(255,255,255,.05);color:rgba(255,255,255,.3);
  border:1px solid rgba(255,255,255,.07);
}

.ac-progress{
  height:2px;background:rgba(255,255,255,.05);border-radius:1px;overflow:hidden;
}
.ac-progress-fill{
  height:2px;border-radius:1px;
  background:linear-gradient(90deg,#c0392b,#ff3b2f,#ff6b6b);
  transition:width 1s cubic-bezier(.4,0,.2,1);
}

/* Deep dive hover button */
.ac-actions{
  display:flex;gap:5px;margin-top:7px;
  opacity:0;transform:translateY(3px);
  transition:opacity .15s,transform .15s;
  pointer-events:none;
}
.ac:hover .ac-actions{opacity:1;transform:none;pointer-events:all}
.ac-dive-btn{
  flex:1;padding:4px 0;
  background:rgba(192,57,43,.12);
  border:1px solid rgba(192,57,43,.28);
  border-radius:5px;
  font-family:'JetBrains Mono';font-size:7.5px;
  color:var(--crb);cursor:pointer;
  transition:all .15s;text-align:center;
}
.ac-dive-btn:hover{background:rgba(192,57,43,.25);box-shadow:0 0 10px rgba(192,57,43,.25)}
.ac-select-btn{
  padding:4px 10px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  border-radius:5px;
  font-family:'JetBrains Mono';font-size:7.5px;
  color:var(--muted);cursor:pointer;
  transition:all .15s;
}
.ac-select-btn:hover{border-color:rgba(255,255,255,.15);color:var(--sub)}

/* Empty state */
.lp-empty{padding:50px 16px;text-align:center;font-family:'JetBrains Mono';font-size:9.5px;color:rgba(255,255,255,.12);line-height:2.6;letter-spacing:1px}

/* Left footer */
.lp-footer{
  padding:10px 15px;
  border-top:1px solid var(--bdr);flex-shrink:0;
  background:rgba(0,0,0,.3);
  display:flex;align-items:center;justify-content:space-between;
}
.lp-footer-stat{font-family:'JetBrains Mono';font-size:8px;color:var(--muted);letter-spacing:1px}
.lp-footer-stat span{color:var(--crb);font-weight:600}


/* ─── MID PANEL ─── */
#mid{display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}

/* ─── TABS — slimmer, no purple ─── */
.tabs{
  display:flex;
  border-bottom:1px solid var(--bdr);
  flex-shrink:0;
  background:rgba(4,4,10,.92);
  backdrop-filter:blur(20px);
  overflow-x:auto;
  gap:0;
}
.tabs::-webkit-scrollbar{height:0}
.tab{
  padding:13px 16px;
  font-family:'JetBrains Mono';font-size:8px;letter-spacing:1.8px;
  color:var(--muted);cursor:pointer;
  border-bottom:2px solid transparent;
  transition:all .18s;white-space:nowrap;
  background:transparent;border-top:none;border-left:none;border-right:none;
  position:relative;
}
.tab::after{
  content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,rgba(231,76,60,.5),transparent);
  opacity:0;transition:opacity .18s;
}
.tab:hover{color:var(--sub);background:rgba(255,255,255,.015)}
.tab:hover::after{opacity:.5}
.tab.on{color:var(--crb);border-bottom-color:var(--crb)}
.tab.on::after{opacity:0}

.tb-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px}

/* ─── STAT CARDS — 4 distinct colors ─── */
.stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.sc{
  background:var(--s1);border:1px solid var(--bdr);border-radius:var(--r2);
  padding:14px 15px;position:relative;overflow:hidden;
  transition:border-color .3s,box-shadow .3s,transform .2s;cursor:default;
}
.sc::before{content:'';position:absolute;inset:0;background:var(--grad-card);border-radius:inherit;pointer-events:none}
.sc:hover{transform:translateY(-1px)}
/* Card: red */
.sc.red{background:linear-gradient(135deg,rgba(192,57,43,.12) 0%,rgba(8,8,16,.7) 100%);border-color:rgba(192,57,43,.24);box-shadow:0 0 22px rgba(192,57,43,.1)}
.sc.red:hover{border-color:rgba(192,57,43,.4);box-shadow:0 4px 24px rgba(192,57,43,.22)}
/* Card: teal */
.sc.blue{background:linear-gradient(135deg,rgba(6,182,212,.1) 0%,rgba(8,8,16,.7) 100%);border-color:rgba(6,182,212,.2)}
.sc.blue:hover{border-color:rgba(6,182,212,.38);box-shadow:0 4px 24px rgba(6,182,212,.15)}
/* Card: green */
.sc.green{background:linear-gradient(135deg,rgba(34,197,94,.1) 0%,rgba(8,8,16,.7) 100%);border-color:rgba(34,197,94,.2)}
.sc.green:hover{border-color:rgba(34,197,94,.38);box-shadow:0 4px 24px rgba(34,197,94,.15)}
/* Card: amber */
.sc.amber{background:linear-gradient(135deg,rgba(245,158,11,.1) 0%,rgba(8,8,16,.7) 100%);border-color:rgba(245,158,11,.2)}
.sc.amber:hover{border-color:rgba(245,158,11,.38);box-shadow:0 4px 24px rgba(245,158,11,.15)}

.sc-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;flex-shrink:0}
.sc-icon.red{background:rgba(192,57,43,.22);border:1px solid rgba(192,57,43,.32);box-shadow:0 0 10px rgba(192,57,43,.2)}
.sc-icon.blue{background:rgba(6,182,212,.18);border:1px solid rgba(6,182,212,.3)}
.sc-icon.green{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.28)}
.sc-icon.amber{background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.28)}
.sc-icon svg{width:13px;height:13px;fill:none;stroke-width:2}
.sc-icon.red svg{stroke:#e74c3c}.sc-icon.blue svg{stroke:#22d3ee}.sc-icon.green svg{stroke:#22c55e}.sc-icon.amber svg{stroke:#f59e0b}
.sc-l{font-family:'JetBrains Mono';font-size:7px;color:var(--muted);letter-spacing:2px;margin-bottom:4px;text-transform:uppercase}
.sc-v{font-family:'Mechsuit',sans-serif;font-size:24px;line-height:1;letter-spacing:1px}
.sc-v.red{color:var(--crb);text-shadow:0 0 20px rgba(255,59,47,.35)}
.sc-v.blue{color:#22d3ee;text-shadow:0 0 18px rgba(6,182,212,.3)}
.sc-v.green{color:#22c55e;text-shadow:0 0 18px rgba(34,197,94,.3)}
.sc-v.amber{color:#f59e0b;text-shadow:0 0 18px rgba(245,158,11,.3)}
.sc-s{font-family:'JetBrains Mono';font-size:8px;color:var(--muted);margin-top:4px;letter-spacing:.5px}

/* ─── MAP — brighter, readable, full zoom ─── */
.map-card{
  background:rgba(5,3,12,.75);
  border:1px solid rgba(231,76,60,.28);
  border-radius:var(--r2);overflow:hidden;
  backdrop-filter:blur(16px);
  box-shadow:var(--shadow-red),inset 0 1px 0 rgba(255,255,255,.04);
  position:relative;
}
.map-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;z-index:2;
  background:linear-gradient(90deg,transparent,rgba(231,76,60,.7),rgba(6,182,212,.3),transparent);
}
.map-hd{
  padding:11px 16px;border-bottom:1px solid rgba(231,76,60,.15);
  display:flex;align-items:center;gap:9px;
  background:linear-gradient(90deg,rgba(192,57,43,.1),rgba(0,0,0,0));
  position:relative;z-index:2;
}
.map-ttl{font-size:12px;font-weight:700;letter-spacing:.5px;text-shadow:0 0 12px rgba(231,76,60,.3)}
.map-live{display:flex;align-items:center;gap:5px;font-family:'JetBrains Mono';font-size:8px;color:var(--green);letter-spacing:2px;margin-left:auto}
.map-ldot{width:5px;height:5px;border-radius:50%;background:var(--green);animation:mapPulse 2s ease infinite;box-shadow:0 0 7px var(--green)}
@keyframes mapPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.65)}70%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}

#db-map{height:240px;width:100%;background:#070308}
.leaflet-container{background:#070308 !important}

/* Brighter map tiles — reddish tone but readable */
.leaflet-tile{
  filter:
    saturate(0)
    brightness(.22)
    sepia(.9)
    hue-rotate(310deg)
    brightness(1.4)
    contrast(1.1)
    !important;
}

/* Zoom controls — themed */
.leaflet-control-zoom{
  display:flex !important;
  flex-direction:column;
  border:1px solid rgba(192,57,43,.35) !important;
  border-radius:8px !important;
  overflow:hidden;
  box-shadow:0 4px 16px rgba(0,0,0,.5) !important;
}
.leaflet-control-zoom a{
  background:rgba(5,3,10,.9) !important;
  color:rgba(255,255,255,.7) !important;
  border-bottom:1px solid rgba(192,57,43,.2) !important;
  font-size:16px !important;
  width:28px !important;
  height:28px !important;
  line-height:28px !important;
  text-align:center !important;
  transition:all .15s !important;
  backdrop-filter:blur(8px);
}
.leaflet-control-zoom a:last-child{border-bottom:none !important}
.leaflet-control-zoom a:hover{background:rgba(192,57,43,.2) !important;color:#fff !important}
.leaflet-control-attribution{display:none !important}

/* Tooltips — now readable with proper contrast */
.leaflet-tooltip{
  background:rgba(4,2,10,.92) !important;
  border:1px solid rgba(231,76,60,.4) !important;
  border-radius:7px !important;
  color:rgba(255,230,220,.95) !important;
  font-family:'JetBrains Mono' !important;
  font-size:9.5px !important;
  padding:5px 10px !important;
  box-shadow:0 6px 22px rgba(0,0,0,.75),0 0 12px rgba(192,57,43,.18) !important;
  backdrop-filter:blur(18px);
  white-space:nowrap;
  letter-spacing:.3px;
}
.leaflet-tooltip::before{border-top-color:rgba(192,57,43,.4) !important}
.leaflet-popup-content-wrapper{
  background:rgba(5,3,12,.96) !important;
  border:1px solid rgba(192,57,43,.38) !important;
  border-radius:12px !important;
  box-shadow:0 16px 48px rgba(0,0,0,.85),0 0 24px rgba(192,57,43,.18) !important;
  backdrop-filter:blur(28px);
}
.leaflet-popup-content{margin:12px 16px !important;font-family:'JetBrains Mono';font-size:9.5px;color:rgba(255,230,220,.9);line-height:2}
.leaflet-popup-tip{background:rgba(192,57,43,.55) !important}
.leaflet-popup-close-button{color:rgba(255,255,255,.4) !important;font-size:16px !important}

/* Map legend */
.map-legend{
  position:absolute;bottom:10px;left:14px;z-index:1000;
  display:flex;gap:12px;
  background:rgba(3,2,8,.88);
  padding:7px 13px;border-radius:8px;
  border:1px solid rgba(255,255,255,.09);
  backdrop-filter:blur(24px);
  font-family:'JetBrains Mono';font-size:8px;
}
.map-legend-item{display:flex;align-items:center;gap:5px}
.map-legend-dot{width:7px;height:7px;border-radius:50%}
.map-legend-lbl{color:rgba(255,220,210,.6);letter-spacing:.5px}
.map-stats{position:absolute;top:50px;right:12px;z-index:1000;display:flex;flex-direction:column;gap:5px}
.map-stat-pill{
  background:rgba(3,2,8,.88);padding:5px 10px;border-radius:6px;
  border:1px solid rgba(255,255,255,.09);backdrop-filter:blur(24px);
  font-family:'JetBrains Mono';font-size:8px;display:flex;gap:6px;align-items:center;
}
.map-stat-v{color:var(--crb);font-weight:600}
.map-stat-l{color:var(--muted)}

/* ─── CHARTS ─── */
.charts-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.chart-card{
  background:var(--s1);border:1px solid var(--bdr);border-radius:var(--r2);padding:14px;position:relative;overflow:hidden;
}
.chart-card::before{content:'';position:absolute;inset:0;background:var(--grad-card);pointer-events:none}
.chart-ttl{font-size:11px;font-weight:700;margin-bottom:11px;color:var(--sub);letter-spacing:.3px}
.bar-row{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.bar-lbl{font-family:'JetBrains Mono';font-size:8.5px;color:var(--muted);width:96px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar-track{flex:1;height:5px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden}
.bar-fill{height:5px;border-radius:3px;background:linear-gradient(90deg,rgba(192,57,43,.8),#e74c3c,#ff6b6b);transition:width 1.2s cubic-bezier(.4,0,.2,1);box-shadow:0 0 6px rgba(192,57,43,.4)}
.bar-val{font-family:'JetBrains Mono';font-size:8px;color:var(--muted);width:26px;text-align:right}
.timeline{display:flex;align-items:flex-end;gap:2px;height:58px}
.tc{flex:1;border-radius:2px 2px 0 0;background:rgba(192,57,43,.16);min-width:3px;transition:background .2s;cursor:pointer}
.tc:hover{background:rgba(255,59,47,.55)}
.tc.hi{background:linear-gradient(to top,rgba(192,57,43,.7),rgba(255,59,47,1));box-shadow:0 -2px 8px rgba(192,57,43,.3)}
.tc-lx{display:flex;justify-content:space-between;margin-top:6px}
.tc-lx span{font-family:'JetBrains Mono';font-size:7px;color:rgba(255,255,255,.18)}

/* ─── AI SUMMARY CARD ─── */
.ai-card{
  background:linear-gradient(135deg,#210808 0%,#110303 45%,#060101 100%);
  border:1px solid rgba(175,30,30,.3);
  border-radius:var(--r2);padding:14px;
  box-shadow:0 0 28px rgba(150,15,15,.2);
}
.ai-hd{display:flex;align-items:center;gap:9px;margin-bottom:10px}
.ai-ico{
  width:30px;height:30px;background:#160505;
  border:1px solid rgba(185,35,35,.38);border-radius:9px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  box-shadow:0 0 16px rgba(185,35,35,.24);
}
.ai-ico svg{width:13px;height:13px;stroke:#ff6b6b;fill:none;stroke-width:1.5}
.ai-ttl{font-size:12px;font-weight:700;letter-spacing:.3px;color:#ffd6d6}
.ai-sub{font-family:'JetBrains Mono';font-size:8px;color:rgba(255,140,140,.55);letter-spacing:1.5px;margin-top:1px}
.ai-msg{
  font-size:12px;color:rgba(255,220,220,.72);line-height:1.8;font-style:italic;
  padding:10px 12px;background:rgba(255,70,70,.04);border-radius:8px;
  border-left:2px solid rgba(215,55,55,.58);margin-bottom:10px;
}
.ai-confidence{
  display:flex;align-items:center;gap:10px;padding:9px 12px;
  background:rgba(80,8,8,.58);border:1px solid rgba(175,30,30,.3);border-radius:8px;margin-bottom:9px;
}
.ai-conf-label{font-family:'JetBrains Mono';font-size:8px;color:#ff8f8f;letter-spacing:1.5px;white-space:nowrap}
.ai-conf-bar{flex:1;height:4px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden}
.ai-conf-fill{
  height:4px;border-radius:2px;
  background:linear-gradient(90deg,#7a0d0d,#b91c1c,#ef4444,#ff9c9c);
  transition:width 1s ease;box-shadow:0 0 8px rgba(239,68,68,.45);
}
.ai-conf-val{font-family:'JetBrains Mono';font-size:9px;color:#ffb4b4;font-weight:600;white-space:nowrap}
.ai-conf-why{font-size:10px;color:rgba(255,140,140,.58);font-style:italic;margin-top:4px}
.ai-chips{display:flex;gap:5px;flex-wrap:wrap}
.ai-chip{
  display:flex;align-items:center;gap:4px;padding:4px 9px;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,90,90,.1);
  border-radius:7px;font-family:'JetBrains Mono';font-size:8.5px;color:rgba(255,220,220,.45);
  transition:border-color .2s,background .2s;
}
.ai-chip:hover{border-color:rgba(255,90,90,.22);background:rgba(255,70,70,.05)}
.ai-chip.local{border-color:rgba(255,90,90,.3);color:#ff7b7b}
.ai-chip.flag{border-color:rgba(215,45,45,.38);color:#ff5e5e}

/* ─── DETAIL CARD ─── */
.detail-card{
  background:var(--s1);border:1px solid var(--bdr);border-radius:var(--r2);overflow:hidden;position:relative;
}
.detail-card::before{content:'';position:absolute;inset:0;background:var(--grad-card);pointer-events:none;border-radius:inherit}
.dh{
  padding:12px 14px;
  background:linear-gradient(135deg,rgba(192,57,43,.07),rgba(0,0,0,0));
  border-bottom:1px solid rgba(192,57,43,.12);
  display:flex;align-items:flex-start;justify-content:space-between;gap:10px;
}
.dh-ip{font-family:'JetBrains Mono';font-size:13px;font-weight:600;color:#fff}
.dh-loc{font-family:'JetBrains Mono';font-size:8.5px;color:var(--muted);margin-top:3px}
.dh-score{font-family:'Mechsuit',sans-serif;font-size:32px;line-height:1;letter-spacing:1px;text-align:right}
.dh-score.critical{color:#ff4444;text-shadow:0 0 24px rgba(255,68,68,.4)}
.dh-score.high{color:#ff8800;text-shadow:0 0 18px rgba(255,136,0,.3)}
.dh-score.medium{color:#f59e0b}.dh-score.low{color:var(--green)}
.dh-slbl{font-family:'JetBrains Mono';font-size:8px;color:var(--muted);letter-spacing:1px;text-align:right;margin-top:2px}
.db{padding:12px 14px}
.dr{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.03)}
.dr:last-child{border-bottom:none}
.dr-k{font-family:'JetBrains Mono';font-size:8.5px;color:var(--muted);letter-spacing:1px}
.dr-v{font-family:'JetBrains Mono';font-size:8.5px;color:var(--text);text-align:right;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dr-v.danger{color:var(--crb)}
.mitigation-row{padding:12px 14px;border-top:1px solid rgba(255,255,255,.05);display:flex;gap:7px;flex-wrap:wrap}
.mit-btn{padding:6px 12px;border-radius:7px;font-family:'JetBrains Mono';font-size:8px;letter-spacing:1px;cursor:pointer;transition:all .2s;border:1px solid}
.mit-btn.block{background:rgba(192,57,43,.12);border-color:rgba(192,57,43,.3);color:#e74c3c}
.mit-btn.block:hover{background:rgba(192,57,43,.25);box-shadow:0 0 12px rgba(192,57,43,.3)}
.mit-btn.shadow{background:rgba(6,182,212,.08);border-color:rgba(6,182,212,.22);color:#22d3ee}
.mit-btn.shadow:hover{background:rgba(6,182,212,.18);box-shadow:0 0 12px rgba(6,182,212,.2)}
.mit-btn.throttle{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.25);color:#f59e0b}
.mit-btn.throttle:hover{background:rgba(245,158,11,.2);box-shadow:0 0 12px rgba(245,158,11,.2)}

.cred-row{font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,.45);padding:5px 0;border-bottom:1px solid rgba(255,255,255,.03)}

/* ─── HONEYPOT PANEL — red/teal tone only ─── */
.honeypot-panel{
  background:linear-gradient(135deg,rgba(192,57,43,.06) 0%,rgba(6,182,212,.04) 50%,rgba(8,8,16,.92) 100%);
  border:1px solid rgba(192,57,43,.2);
  border-radius:var(--r2);padding:14px;
  box-shadow:0 0 20px rgba(192,57,43,.06);
}
.hp-header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.hp-icon{
  width:28px;height:28px;background:rgba(192,57,43,.15);
  border:1px solid rgba(192,57,43,.28);border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 10px rgba(192,57,43,.18);
}
.hp-icon svg{width:13px;height:13px;stroke:#e74c3c;fill:none;stroke-width:2}
.hp-ttl{font-size:12px;font-weight:700;color:#fca5a5}
.hp-sub{font-family:'JetBrains Mono';font-size:8px;color:rgba(192,57,43,.55);letter-spacing:1.5px;margin-top:1px}
.hp-items{display:flex;flex-direction:column;gap:6px}
.hp-item{
  display:flex;align-items:center;gap:10px;padding:9px 11px;
  background:rgba(192,57,43,.05);border:1px solid rgba(192,57,43,.1);
  border-radius:8px;transition:all .2s;cursor:default;
}
.hp-item:hover{background:rgba(192,57,43,.09);border-color:rgba(192,57,43,.2)}
.hp-item-icon{font-size:14px;flex-shrink:0}
.hp-item-info{flex:1;min-width:0}
.hp-item-name{font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,.8);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hp-item-detail{font-family:'JetBrains Mono';font-size:8px;color:rgba(255,255,255,.35);margin-top:2px}
.hp-item-count{font-family:'Mechsuit',sans-serif;font-size:16px;color:#e74c3c;text-shadow:0 0 10px rgba(192,57,43,.4)}
.hp-item-badge{
  padding:2px 8px;border-radius:4px;font-family:'JetBrains Mono';font-size:7.5px;font-weight:600;
  background:rgba(192,57,43,.18);color:#e74c3c;border:1px solid rgba(192,57,43,.25);white-space:nowrap;
}
.hp-item-badge.safe{background:rgba(34,197,94,.1);color:#22c55e;border-color:rgba(34,197,94,.22)}

.breadcrumb-panel{margin-top:10px}
.bc-header{font-family:'JetBrains Mono';font-size:8px;color:var(--muted);letter-spacing:2px;margin-bottom:8px}
.bc-path{display:flex;align-items:center;flex-wrap:wrap;gap:0}
.bc-node{
  display:flex;align-items:center;gap:5px;padding:5px 10px;
  background:rgba(6,182,212,.07);border:1px solid rgba(6,182,212,.18);
  border-radius:6px;font-family:'JetBrains Mono';font-size:8px;color:#67e8f9;position:relative;
}
.bc-node.compromised{background:rgba(192,57,43,.1);border-color:rgba(192,57,43,.25);color:#fca5a5}
.bc-node.active{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.25);color:#fcd34d;animation:bcPulse 2s ease infinite}
@keyframes bcPulse{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,.3)}70%{box-shadow:0 0 0 6px rgba(245,158,11,0)}}
.bc-arrow{color:rgba(255,255,255,.2);font-size:10px;margin:0 4px}
.bc-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.bc-dot.cyan{background:#06b6d4}.bc-dot.red{background:#e74c3c}.bc-dot.amber{background:#f59e0b}

/* Decoy management — red/teal only */
.decoy-mgmt{
  background:rgba(6,182,212,.04);border:1px solid rgba(6,182,212,.14);
  border-radius:var(--r2);padding:12px;
}
.dm-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
.dm-ttl{font-family:'JetBrains Mono';font-size:9px;color:#67e8f9;letter-spacing:1.5px}
.dm-deploy{
  padding:4px 10px;background:rgba(6,182,212,.08);
  border:1px solid rgba(6,182,212,.22);border-radius:5px;
  font-family:'JetBrains Mono';font-size:7.5px;color:#67e8f9;
  cursor:pointer;transition:all .2s;
}
.dm-deploy:hover{background:rgba(6,182,212,.18);box-shadow:0 0 8px rgba(6,182,212,.2)}
.dm-list{display:flex;flex-direction:column;gap:5px}
.dm-item{display:flex;align-items:center;gap:8px;padding:6px 9px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:7px}
.dm-status{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.dm-status.active{background:var(--green);box-shadow:0 0 5px var(--green)}
.dm-status.armed{background:#f59e0b;box-shadow:0 0 5px rgba(245,158,11,.5);animation:tbPulse 2s ease infinite}
.dm-status.tripped{background:#e74c3c;box-shadow:0 0 6px rgba(231,76,60,.6)}
.dm-name{font-family:'JetBrains Mono';font-size:8.5px;color:var(--sub);flex:1}
.dm-hits{font-family:'JetBrains Mono';font-size:8px;color:var(--muted)}

/* ─── ATTACK PATH PREDICTOR ─── */
.predict-panel{
  background:linear-gradient(135deg,rgba(192,57,43,.06) 0%,rgba(8,8,16,.92) 100%);
  border:1px solid rgba(192,57,43,.2);
  border-radius:var(--r2);padding:14px;
}
.pp-header{display:flex;align-items:center;gap:8px;margin-bottom:11px}
.pp-icon{width:28px;height:28px;background:rgba(192,57,43,.14);border:1px solid rgba(192,57,43,.28);border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(192,57,43,.14)}
.pp-icon svg{width:13px;height:13px;stroke:#e74c3c;fill:none;stroke-width:2}
.pp-ttl{font-size:12px;font-weight:700;color:#fca5a5}
.pp-sub{font-family:'JetBrains Mono';font-size:8px;color:rgba(192,57,43,.55);letter-spacing:1.5px}
.pp-canvas{background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.06);border-radius:8px;overflow:hidden}
.pp-node{
  display:inline-flex;align-items:center;gap:5px;padding:5px 10px;
  border-radius:6px;font-family:'JetBrains Mono';font-size:8px;border:1px solid;white-space:nowrap;
}
.pp-node.done{background:rgba(192,57,43,.1);border-color:rgba(192,57,43,.25);color:#fca5a5}
.pp-node.current{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.3);color:#fcd34d;animation:bcPulse 2.5s ease infinite}
.pp-node.predicted{background:rgba(6,182,212,.06);border-color:rgba(6,182,212,.18);color:#67e8f9;opacity:.7}
.pp-arrow{color:rgba(255,255,255,.18);font-size:11px;margin:0 6px}

/* ─── MANAGER VIEW ─── */
.mgr-banner{
  background:linear-gradient(135deg,rgba(192,57,43,.08),rgba(255,255,255,.015));
  border:1px solid rgba(255,59,47,.14);border-radius:var(--r2);padding:18px 22px;
  display:flex;align-items:center;justify-content:space-between;
}
.mgr-ttl{font-size:16px;font-weight:700;letter-spacing:.3px}
.mgr-sub{font-size:12px;color:var(--muted);margin-top:3px;font-weight:400}
.mgr-badge{display:flex;align-items:center;gap:7px;padding:7px 15px;background:rgba(0,210,80,.06);border:1px solid rgba(0,210,80,.18);border-radius:20px;font-family:'JetBrains Mono';font-size:9px;letter-spacing:2px;color:rgba(0,210,80,.8)}
.mgr-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.mc{padding:16px;border:1px solid var(--bdr);border-radius:var(--r2);transition:all .25s;cursor:default;position:relative;overflow:hidden}
.mc::before{content:'';position:absolute;inset:0;background:var(--grad-card);pointer-events:none}
.mc:hover{border-color:rgba(255,59,47,.22);box-shadow:0 4px 20px rgba(0,0,0,.45);transform:translateY(-1px)}
.mc.red{background:linear-gradient(135deg,rgba(192,57,43,.1),rgba(8,8,16,.8));border-color:rgba(192,57,43,.18)}
.mc.blue{background:linear-gradient(135deg,rgba(6,182,212,.1),rgba(8,8,16,.8));border-color:rgba(6,182,212,.15)}
.mc.green{background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(8,8,16,.8));border-color:rgba(34,197,94,.15)}
.mc.amber{background:linear-gradient(135deg,rgba(245,158,11,.1),rgba(8,8,16,.8));border-color:rgba(245,158,11,.15)}
.mc-l{font-size:11px;color:var(--muted);font-weight:400;margin-bottom:5px}
.mc-n{font-family:'Mechsuit',sans-serif;font-size:32px;color:#fff;line-height:1;letter-spacing:1px}
.mc-n.red{color:var(--crb);text-shadow:0 0 20px rgba(255,59,47,.3)}
.mc-n.blue{color:#22d3ee;text-shadow:0 0 18px rgba(6,182,212,.3)}
.mc-n.green{color:#22c55e;text-shadow:0 0 18px rgba(34,197,94,.3)}
.mc-n.amber{color:#f59e0b}
.mc-s{font-size:10.5px;color:var(--muted);margin-top:4px;font-weight:300}
.tr-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tr{padding:13px 15px;background:var(--s1);border:1px solid var(--bdr);border-radius:var(--r2);display:flex;gap:11px;align-items:flex-start;transition:all .25s}
.tr:hover{border-color:rgba(255,59,47,.18);background:rgba(255,255,255,.015)}
.tr-ic{font-size:18px;flex-shrink:0;margin-top:2px}
.tr-tech{font-family:'JetBrains Mono';font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:3px}
.tr-plain{font-size:11.5px;color:var(--sub);line-height:1.7;font-weight:400}
.ct-wrap{overflow-x:auto}
table.ct{width:100%;border-collapse:collapse}
table.ct th{font-family:'JetBrains Mono';font-size:8.5px;letter-spacing:1.5px;color:var(--muted);padding:10px 14px;text-align:left;border-bottom:1px solid var(--bdr)}
table.ct th:first-child{width:38%}
table.ct td{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px;color:var(--sub)}
table.ct td:first-child{color:var(--text);font-weight:500}
table.ct tr:hover td{background:rgba(255,255,255,.012)}
.ct-bad{color:rgba(255,80,80,.7);font-weight:600}.ct-good{color:rgba(0,210,80,.8);font-weight:600}
.ct-hl{background:rgba(255,59,47,.04) !important}

/* ─── EVENTS & ALERTS ─── */
.ev{
  background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:10px 13px;
  animation:fIn .3s cubic-bezier(.4,0,.2,1);transition:border-color .15s,background .15s;
}
.ev:hover{background:rgba(255,255,255,.018);border-color:rgba(255,255,255,.1)}
@keyframes fIn{from{opacity:0;transform:translateY(4px);background:rgba(192,57,43,.07)}to{opacity:1;transform:none;background:var(--s1)}}
.ev-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px}
.ev-proto{font-family:'JetBrains Mono';font-size:8px;color:var(--muted);letter-spacing:1px}
.ev-time{font-family:'JetBrains Mono';font-size:8px;color:rgba(255,255,255,.18)}
.ev-path{font-family:'JetBrains Mono';font-size:9px;color:var(--text);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ev-ai{font-size:10px;color:rgba(255,255,255,.36);font-style:italic;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical}
.al{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:10px 13px;animation:fIn .3s cubic-bezier(.4,0,.2,1)}
.al.fresh{background:rgba(192,57,43,.06);border-color:rgba(192,57,43,.22);box-shadow:0 0 12px rgba(192,57,43,.08)}
.al-sv{font-family:'JetBrains Mono';font-size:8px;letter-spacing:1.5px;font-weight:700;margin-bottom:3px}
.al-sv.CRITICAL{color:#ff4444}.al-sv.HIGH{color:#ff8800}.al-sv.MEDIUM{color:#f59e0b}.al-sv.INFO{color:#67e8f9}
.al-msg{font-size:11px;color:var(--text);margin-bottom:3px;line-height:1.5}
.al-plain{font-size:10px;color:rgba(255,59,47,.65);font-style:italic;margin-bottom:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.al-meta{font-family:'JetBrains Mono';font-size:8px;color:var(--muted);display:flex;gap:8px;align-items:center}
.al-xc{background:rgba(192,57,43,.15);color:var(--crb);padding:2px 7px;border-radius:10px}

/* ─── RIGHT PANEL ─── */
#right{border-left:1px solid var(--bdr);display:flex;flex-direction:column;background:var(--s1);overflow:hidden}
.fi{
  padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.03);
  display:flex;gap:8px;align-items:flex-start;
  animation:fIn .3s cubic-bezier(.4,0,.2,1);transition:background .15s;
}
.fi:hover{background:rgba(255,255,255,.018)}
.fi-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:4px}
.fi-dot.critical{background:#ff4444;box-shadow:0 0 8px #ff4444}
.fi-dot.high{background:#ff8800;box-shadow:0 0 6px #ff8800}
.fi-dot.medium{background:#f59e0b;box-shadow:0 0 5px rgba(245,158,11,.6)}
.fi-dot.low,.fi-dot.info{background:rgba(255,255,255,.22)}
.fi-bd{flex:1;min-width:0}
.fi-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px}
.fi-proto{font-family:'JetBrains Mono';font-size:7.5px;color:var(--muted);letter-spacing:1px}
.fi-time{font-family:'JetBrains Mono';font-size:7.5px;color:rgba(255,255,255,.18)}
.fi-path{font-family:'JetBrains Mono';font-size:9px;color:var(--text);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fi-ai{font-size:9.5px;color:rgba(255,255,255,.36);overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;font-style:italic}

/* Right stat strip */
.rstat-strip{
  padding:10px 14px;border-bottom:1px solid var(--bdr);
  display:grid;grid-template-columns:1fr 1fr;gap:7px;flex-shrink:0;
}
.rs{padding:9px 11px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);border-radius:9px;position:relative;overflow:hidden}
.rs::before{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(192,57,43,.22),transparent)}
.rs-l{font-family:'JetBrains Mono';font-size:7px;color:var(--muted);letter-spacing:1.5px;margin-bottom:4px;text-transform:uppercase}
.rs-v{font-family:'Mechsuit',sans-serif;font-size:20px;color:#fff;line-height:1;letter-spacing:1px}
.rs-v.red{color:var(--crb);text-shadow:0 0 14px rgba(231,76,60,.35)}
.rs-v.green{color:var(--green);text-shadow:0 0 12px rgba(34,197,94,.3)}

/* Risk gauge */
.gauge-wrap{
  padding:13px 14px;border-bottom:1px solid var(--bdr);flex-shrink:0;
  background:linear-gradient(180deg,rgba(192,57,43,.04) 0%,transparent 100%);
}
.gauge-ttl{font-size:10px;font-weight:700;margin-bottom:10px;color:var(--sub);letter-spacing:.5px;text-transform:uppercase}
.gauge-row{display:flex;align-items:center;gap:12px}
.gauge-num{font-family:'Mechsuit',sans-serif;font-size:50px;line-height:1;letter-spacing:1px}
.gauge-num.critical{color:#ff4444;text-shadow:0 0 32px rgba(255,68,68,.45)}
.gauge-num.high{color:#ff8800;text-shadow:0 0 24px rgba(255,136,0,.35)}
.gauge-num.medium{color:#f59e0b}.gauge-num.low{color:var(--green)}
.gauge-info h4{font-family:'Mechsuit',sans-serif;font-size:15px;letter-spacing:1px;margin-bottom:4px}
.gauge-info p{font-size:11px;color:var(--sub);line-height:1.7;font-weight:300}
.gauge-ai-conf{
  display:flex;align-items:center;gap:6px;margin-top:7px;padding:5px 9px;
  background:rgba(192,57,43,.07);border:1px solid rgba(192,57,43,.18);border-radius:6px;
}
.gauge-ai-label{font-family:'JetBrains Mono';font-size:7.5px;color:#fca5a5;letter-spacing:1px}
.gauge-ai-val{font-family:'JetBrains Mono';font-size:9px;color:#ffb4b4;font-weight:600;margin-left:auto}
.sparkline{display:flex;align-items:flex-end;gap:2px;height:36px;margin-top:10px}
.sp{flex:1;border-radius:2px 2px 0 0;background:rgba(192,57,43,.2);min-height:2px}
.sp.hi{background:linear-gradient(to top,rgba(192,57,43,.8),rgba(255,59,47,.95));box-shadow:0 -2px 6px rgba(192,57,43,.3)}
.sp.md{background:rgba(192,57,43,.5)}

/* Right header */
.ph{padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.03);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:rgba(255,255,255,.01)}
.ph-t{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
.ph-b{padding:3px 9px;background:var(--crd);border:1px solid rgba(192,57,43,.25);border-radius:6px;font-family:'JetBrains Mono';font-size:8px;color:var(--crb);font-weight:600}
.ps{flex:1;overflow-y:auto}

/* Section label */
.sect-lbl{font-family:'JetBrains Mono';font-size:8px;color:var(--muted);letter-spacing:2px;margin-bottom:9px;display:flex;align-items:center;gap:9px;text-transform:uppercase}
.sect-lbl::after{content:'';flex:1;height:1px;background:var(--bdr)}
.info-card{background:var(--s1);border:1px solid var(--bdr);border-radius:var(--r2);padding:14px;font-size:11px;color:var(--sub);line-height:1.9;font-weight:300;text-align:center}
.live-dot{width:5px;height:5px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);animation:tbPulse 2s ease infinite;display:inline-block}

/* ─── MODAL — DEEP DIVE ─── */
.modal-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{
  width:520px;max-height:80vh;
  background:rgba(5,3,12,.97);
  border:1px solid rgba(231,76,60,.32);
  border-radius:18px;overflow:hidden;
  box-shadow:0 36px 88px rgba(0,0,0,.92),0 0 0 1px rgba(255,255,255,.04),0 0 65px rgba(192,57,43,.18);
  animation:slideUp .2s cubic-bezier(.4,0,.2,1);
  display:flex;flex-direction:column;
  backdrop-filter:blur(48px);
}
@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
.modal::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(231,76,60,.65),transparent)}
.modal-header{padding:16px 20px;background:linear-gradient(135deg,rgba(192,57,43,.1),rgba(0,0,0,0));border-bottom:1px solid rgba(192,57,43,.15);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.modal-title{font-family:'JetBrains Mono';font-size:13px;font-weight:600;color:#fff}
.modal-close{width:28px;height:28px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--sub);transition:all .2s}
.modal-close:hover{background:rgba(192,57,43,.2);border-color:rgba(192,57,43,.3);color:#fff}
.modal-body{padding:18px 20px;overflow-y:auto;flex:1}
.modal-section{margin-bottom:16px}
.modal-section-title{font-family:'JetBrains Mono';font-size:8px;letter-spacing:2px;color:var(--muted);margin-bottom:8px;text-transform:uppercase}
.whois-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.whois-item{padding:8px 10px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:7px}
.whois-k{font-family:'JetBrains Mono';font-size:7.5px;color:var(--muted);letter-spacing:1px;margin-bottom:2px}
.whois-v{font-family:'JetBrains Mono';font-size:9px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.modal-actions{display:flex;gap:8px;margin-top:16px}

/* ─── REPORT MODAL ─── */
.report-modal-overlay{position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);animation:fadeIn .2s ease}
.report-modal{width:460px;background:rgba(5,3,12,.97);border:1px solid rgba(6,182,212,.3);border-radius:18px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.92),0 0 40px rgba(6,182,212,.1);animation:slideUp .2s cubic-bezier(.4,0,.2,1);backdrop-filter:blur(48px)}
.report-modal-header{padding:16px 20px;border-bottom:1px solid rgba(6,182,212,.15);background:rgba(6,182,212,.05);display:flex;align-items:center;justify-content:space-between}
.report-modal-title{font-size:13px;font-weight:700;color:#67e8f9}
.report-options{padding:20px;display:flex;flex-direction:column;gap:9px}
.report-opt{display:flex;align-items:center;gap:12px;padding:11px 14px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:10px;cursor:pointer;transition:all .2s}
.report-opt:hover{background:rgba(6,182,212,.06);border-color:rgba(6,182,212,.2)}
.report-opt.active{background:rgba(6,182,212,.1);border-color:rgba(6,182,212,.32);box-shadow:0 0 12px rgba(6,182,212,.1)}
.report-opt-icon{font-size:18px}
.report-opt-label{font-size:12px;font-weight:600}
.report-opt-sub{font-family:'JetBrains Mono';font-size:8.5px;color:var(--muted);margin-top:2px}
.report-generate-btn{margin:0 20px 20px;padding:11px;width:calc(100% - 40px);background:linear-gradient(135deg,rgba(6,182,212,.28),rgba(6,182,212,.14));border:1px solid rgba(6,182,212,.38);border-radius:10px;font-family:'JetBrains Mono';font-size:10px;letter-spacing:2px;color:#67e8f9;cursor:pointer;transition:all .2s}
.report-generate-btn:hover{background:linear-gradient(135deg,rgba(6,182,212,.42),rgba(6,182,212,.22));box-shadow:0 0 20px rgba(6,182,212,.2)}

.tb-body > *:last-child{margin-bottom:14px}
`

/* ─── Helpers ─── */
const rc = s => s>=80?'critical':s>=60?'high':s>=40?'medium':'low'
const rl = s => s>=80?'CRITICAL':s>=60?'HIGH':s>=40?'MEDIUM':'LOW'
const timeAgo = ts => { if(!ts)return''; const d=Date.now()-new Date(ts).getTime(); if(d<60000)return`${Math.floor(d/1000)}s ago`; if(d<3600000)return`${Math.floor(d/60000)}m ago`; return`${Math.floor(d/3600000)}h ago` }
const fmt = ts => { if(!ts)return''; try{return new Date(ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}catch{return''} }

const SICONS = {
  CRITICAL:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  HIGH:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  MEDIUM:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  INFO:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
}

/* ─── Cyber Map ─── */
function CyberMap({ mapData }) {
  const mapRef = useRef(null)
  const instRef = useRef(null)
  const layRef = useRef(null)
  const KOL = [22.5726, 88.3639]

  useEffect(() => {
    let ok = true
    getL().then(L => {
      if (!ok || !mapRef.current || instRef.current) return
      const m = L.map(mapRef.current, {
        center: KOL, zoom: 2,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        preferCanvas: true,
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(m)
      layRef.current = L.layerGroup().addTo(m)
      instRef.current = m

      const homeIco = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:14px;height:14px">
          <div style="position:absolute;inset:0;background:#22c55e;border-radius:50%;box-shadow:0 0 18px #22c55e,0 0 34px rgba(34,197,94,.5);border:2px solid rgba(255,255,255,.55)"></div>
          <div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(34,197,94,.3);animation:mPulse 2s ease infinite"></div>
        </div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
      })
      L.marker(KOL, { icon: homeIco }).addTo(m)
        .bindTooltip('<b style="color:#22c55e">YOUR SYSTEM ✓</b><br/>Kolkata, India — Protected', { permanent: false, direction: 'top' })
    })
    return () => { ok = false }
  }, [])

  useEffect(() => {
    if (!instRef.current || !layRef.current) return
    getL().then(L => {
      layRef.current.clearLayers()
      mapData.forEach(a => {
        const lat = a.lat || a.mapLat, lon = a.lon || a.mapLon
        if (!lat || !lon) return
        const score = a.threat_score || a.threatScore || 0
        const col = score>=80 ? '#ff4444' : score>=60 ? '#ff8800' : score>=40 ? '#f59e0b' : '#22d3ee'
        const sz = score>=80 ? 12 : score>=60 ? 9 : 7
        const pulseSpeed = score>=80 ? '1.2s' : score>=60 ? '1.8s' : '2.5s'
        const isLocal = a.isLocal || a.intel?.isLocal
        const city = a.city || a.intel?.city || ''
        const country = a.country || a.intel?.country || ''
        const locLabel = isLocal ? 'LAN' : [city, country].filter(Boolean).join(', ') || 'Unknown'

        const ico = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:${sz}px;height:${sz}px">
            <div style="position:absolute;inset:0;background:${col};border-radius:50%;
              box-shadow:0 0 ${sz*2}px ${col},0 0 ${sz}px ${col};
              border:1px solid rgba(255,255,255,.35)">
            </div>
            <div style="position:absolute;inset:-5px;border-radius:50%;
              border:1px solid ${col};opacity:.5;
              animation:mPulse ${pulseSpeed} ease infinite">
            </div>
            <div style="position:absolute;inset:-10px;border-radius:50%;
              border:1px solid ${col};opacity:.22;
              animation:mPulse ${pulseSpeed} ease infinite;animation-delay:.3s">
            </div>
          </div>`,
          iconSize: [sz, sz], iconAnchor: [sz/2, sz/2]
        })

        const popupContent = `
          <div style="font-family:'JetBrains Mono';font-size:9.5px;line-height:2;color:rgba(255,230,220,.88)">
            <div style="color:${col};font-weight:700;font-size:11px;margin-bottom:4px">${a.ip}</div>
            <div style="color:rgba(255,220,210,.9)">${isLocal ? '📶 Inside WiFi/LAN' : locLabel}</div>
            ${a.isp ? `<div style="color:rgba(255,200,190,.4);font-size:8.5px">ISP: ${a.isp}</div>` : ''}
            <div style="color:${col};margin-top:4px;font-weight:600">Score: ${score}/100 — ${rl(score)}</div>
            ${score>=60 ? `<div style="margin-top:6px;padding:4px 8px;background:rgba(192,57,43,.18);border-radius:5px;color:#fca5a5;font-size:8.5px">⚠ HIGH RISK ATTACKER</div>` : ''}
          </div>`

        L.marker([lat, lon], { icon: ico }).addTo(layRef.current)
          .bindPopup(popupContent)
          .bindTooltip(`${isLocal ? '📶 LAN' : locLabel || 'Unknown'} — ${rl(score)}`, {
            direction: 'top', permanent: false, offset: [0, -sz/2 - 2]
          })

        if (!isLocal && !(Math.abs(lat-KOL[0])<0.3 && Math.abs(lon-KOL[1])<0.3)) {
          L.polyline([[lat, lon], KOL], {
            color: col,
            weight: score>=80 ? 1.5 : 1,
            opacity: score>=80 ? 0.5 : 0.2,
            dashArray: score>=80 ? '4 4' : '3 6'
          }).addTo(layRef.current)
        }
      })
    })
  }, [mapData])

  return <div ref={mapRef} id="db-map"/>
}

/* ─── NotifPanel ─── */
function NotifPanel({ open, notifs, unread, onClear }) {
  const sev2cls = s => { const u=s.toUpperCase(); return u==='CRITICAL'?'critical':u==='HIGH'?'high':u==='MEDIUM'?'medium':'info' }
  return (
    <div className={`np ${open ? '' : 'closed'}`}>
      <div className="np-hd">
        <div style={{display:'flex',alignItems:'center'}}>
          <span className="np-ttl">Alerts</span>
          {unread > 0 && <span className="np-cnt">{unread} NEW</span>}
        </div>
        <button className="np-clr" onClick={onClear}>Clear all</button>
      </div>
      <div className="np-list">
        {notifs.length === 0
          ? <div className="np-empty">NO ALERTS<br/>MONITORING ACTIVE...</div>
          : notifs.map((n, i) => {
            const sv = (n.severity || n.alertType || 'INFO').toUpperCase().replace(/_THREAT/, '')
            const cls = sev2cls(sv)
            const plain = n.plainEnglish || n.profileSnapshot?.plainEnglish || n.profileSnapshot?.aiSummary?.plainEnglish
            return (
              <div key={n.id || i} className={`np-item ${n.isNew ? 'fresh' : ''}`}>
                <div className={`np-ico ${cls}`}>{SICONS[sv] || SICONS.INFO}</div>
                <div className="np-bd">
                  <div className="np-r1">
                    <span className={`np-sv ${cls}`}>{n.alertType || sv}</span>
                    {n.count > 1 && <span className="np-xc">×{n.count}</span>}
                  </div>
                  <div className="np-msg">{n.message || n.msg || 'Alert detected'}</div>
                  {plain && <div className="np-ai">"{plain}"</div>}
                  <div className="np-meta">{n.ip} · {fmt(n.timestamp || n.lastTs)}</div>
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

/* ─── BarChart ─── */
function BarChart({ data, max: maxProp }) {
  if (!data || !data.length) return <div style={{fontSize:9,padding:20,textAlign:'center',fontFamily:"'JetBrains Mono'",color:'rgba(255,255,255,.12)',letterSpacing:2}}>NO DATA YET</div>
  const max = maxProp || Math.max(...data.map(d => d.v || 0), 1)
  return data.map(({ l, v }, i) => (
    <div key={i} className="bar-row">
      <div className="bar-lbl" title={l}>{l}</div>
      <div className="bar-track"><div className="bar-fill" style={{width:`${(v/max)*100}%`}}/></div>
      <div className="bar-val">{v}</div>
    </div>
  ))
}

/* ─── HourlyChart ─── */
function HourlyChart({ events }) {
  const hrs = new Array(24).fill(0)
  events.forEach(e => { if(e.timestamp){const h=new Date(e.timestamp).getHours();hrs[h]++} })
  const max = Math.max(...hrs, 1)
  return (
    <>
      <div className="timeline">
        {hrs.map((h, i) => <div key={i} className={`tc ${h>=max*.7?'hi':''}`} style={{height:`${Math.max((h/max)*100,4)}%`}} title={`${i}:00 — ${h} events`}/>)}
      </div>
      <div className="tc-lx">
        {['00:00','06:00','12:00','18:00','23:59'].map(t => <span key={t}>{t}</span>)}
      </div>
    </>
  )
}

/* ─── Sparkline ─── */
function Sparkline({ scores }) {
  const max = Math.max(...scores, 1)
  return (
    <div className="sparkline">
      {scores.map((s, i) => <div key={i} className={`sp ${s>=75?'hi':s>=50?'md':''}`} style={{height:`${Math.max((s/max)*100,4)}%`}}/>)}
    </div>
  )
}

/* ─── AI Confidence ─── */
function AIConfidence({ score, reason }) {
  const conf = Math.min(95, 40 + score * 0.55)
  return (
    <div className="ai-confidence">
      <div style={{flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
          <span className="ai-conf-label">AI CONFIDENCE</span>
          <div className="ai-conf-bar">
            <div className="ai-conf-fill" style={{width:`${conf}%`}}/>
          </div>
          <span className="ai-conf-val">{Math.round(conf)}%</span>
        </div>
        {reason && <div className="ai-conf-why">"{reason}"</div>}
      </div>
    </div>
  )
}

/* ─── Attack Path Predictor ─── */
function AttackPathPredictor({ attacker }) {
  if (!attacker) return null
  const score = attacker.threat_score || attacker.threatScore || 0
  const types = [...(JSON.parse(attacker.attack_types_json || '[]')), ...(attacker.attackTypes || [])].filter(Boolean)
  const paths = {
    PORT_SCAN: ['Port Scan', 'Service Enum', 'Exploit Attempt', 'Persistence'],
    BRUTE_FORCE: ['SSH Brute Force', 'Credential Dump', 'Privilege Escalation', 'Data Exfil'],
    SQL_INJECTION: ['SQL Probe', 'DB Enumeration', 'Data Dump', 'Backdoor'],
    WEB_FUZZING: ['Path Discovery', 'Vuln Scanning', 'Payload Injection', 'RCE'],
    CANARY_TRAP: ['Trap Triggered', 'False Path', 'Deeper Honeypot', 'Logged'],
    DEFAULT: ['Recon', 'Exploitation', 'Lateral Movement', 'Exfiltration'],
  }
  const pathKey = types[0] || 'DEFAULT'
  const path = paths[pathKey] || paths.DEFAULT
  const progress = score >= 80 ? 2 : score >= 60 ? 1 : 0
  return (
    <div className="predict-panel">
      <div className="pp-header">
        <div className="pp-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
        </div>
        <div>
          <div className="pp-ttl">Attack Path Prediction</div>
          <div className="pp-sub">AI-MODELED NEXT MOVE</div>
        </div>
      </div>
      <div className="pp-canvas" style={{padding:'12px 14px'}}>
        <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:4}}>
          {path.map((step, i) => (
            <span key={step} style={{display:'flex',alignItems:'center',gap:4}}>
              <span className={`pp-node ${i<progress?'done':i===progress?'current':'predicted'}`}>
                <span style={{width:5,height:5,borderRadius:'50%',background:'currentColor',flexShrink:0,display:'inline-block'}}/>
                {step}
              </span>
              {i < path.length-1 && <span className="pp-arrow">→</span>}
            </span>
          ))}
        </div>
        <div style={{marginTop:10,fontFamily:"'JetBrains Mono'",fontSize:8,color:'rgba(103,232,249,.55)'}}>
          CURRENT STAGE: <span style={{color:'#fcd34d'}}>{path[progress]}</span> · Based on {types[0] || 'recon'} pattern
        </div>
      </div>
    </div>
  )
}

/* ─── Honeypot Panel ─── */
const FAKE_DECOYS = [
  { icon: '🗝️', name: '/.env credentials file', detail: 'Fake AWS keys + DB passwords', hits: 0, status: 'armed' },
  { icon: '📁', name: '/admin/config.json', detail: 'False system configuration', hits: 0, status: 'active' },
  { icon: '🔑', name: 'SSH honeypot :2222', detail: 'Captures brute-force attempts', hits: 0, status: 'active' },
  { icon: '🕸️', name: '/wp-admin login page', detail: 'Fake WordPress instance', hits: 0, status: 'armed' },
  { icon: '💳', name: '/api/tokens endpoint', detail: 'False JWT token store', hits: 0, status: 'active' },
]

function HoneypotPanel({ events, attackers }) {
  const decoys = useMemo(() => FAKE_DECOYS.map(d => {
    const hits = events.filter(e => e.path && (
      (d.name.includes('.env') && e.path.includes('.env')) ||
      (d.name.includes('admin') && (e.path.includes('admin') || e.path.includes('config'))) ||
      (d.name.includes('SSH') && e.protocol === 'SSH') ||
      (d.name.includes('wp-admin') && e.path.includes('wp-')) ||
      (d.name.includes('tokens') && e.path.includes('token'))
    )).length
    return { ...d, hits, status: hits > 0 ? 'tripped' : d.status }
  }), [events])

  const topAttacker = attackers[0]
  const attackerEvents = topAttacker ? events.filter(e => e.ip === topAttacker.ip).slice(0, 5).reverse() : []
  const breadcrumbs = attackerEvents.map((e, i) => ({
    label: (e.path || '/').split('/').slice(0, 2).join('/') || '/',
    type: i < attackerEvents.length - 1 ? 'compromised' : 'active'
  }))
  if (!breadcrumbs.length) breadcrumbs.push({ label: 'Scanning...', type: 'active' })

  return (
    <div className="honeypot-panel">
      <div className="hp-header">
        <div className="hp-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <div className="hp-ttl">Honeypot Engagement</div>
          <div className="hp-sub">DECOY INTERACTION MONITOR</div>
        </div>
      </div>
      <div className="hp-items">
        {decoys.map((d, i) => (
          <div key={i} className="hp-item">
            <div className="hp-item-icon">{d.icon}</div>
            <div className="hp-item-info">
              <div className="hp-item-name">{d.name}</div>
              <div className="hp-item-detail">{d.detail}</div>
            </div>
            <div className="hp-item-count">{d.hits}</div>
            <div className={`hp-item-badge ${d.status === 'active' ? 'safe' : ''}`}>
              {d.status === 'tripped' ? '🔥 TRIPPED' : d.status === 'armed' ? '⚡ ARMED' : '✓ ACTIVE'}
            </div>
          </div>
        ))}
      </div>
      {breadcrumbs.length > 0 && (
        <div className="breadcrumb-panel">
          <div className="bc-header">ATTACKER BREADCRUMB — {topAttacker?.ip || 'MONITORING'}</div>
          <div className="bc-path">
            {breadcrumbs.map((bc, i) => (
              <span key={i} style={{display:'flex',alignItems:'center'}}>
                <div className={`bc-node ${bc.type}`}>
                  <span className={`bc-dot ${bc.type === 'compromised' ? 'red' : bc.type === 'active' ? 'amber' : 'cyan'}`}/>
                  {bc.label}
                </div>
                {i < breadcrumbs.length - 1 && <span className="bc-arrow">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Decoy Manager ─── */
function DecoyManager() {
  const [decoys, setDecoys] = useState([
    { name: '/.env', status: 'active', hits: 0 },
    { name: '/phpMyAdmin', status: 'armed', hits: 0 },
    { name: 'SSH :22', status: 'active', hits: 0 },
    { name: '/wp-admin', status: 'armed', hits: 0 },
    { name: '/admin/users', status: 'tripped', hits: 3 },
  ])
  const deploy = () => {
    const names = ['/db-backup.sql', '/.git/config', '/api/v2/secrets', '/dashboard/export']
    setDecoys(prev => [{ name: names[Math.floor(Math.random()*names.length)], status: 'armed', hits: 0 }, ...prev].slice(0, 8))
  }
  return (
    <div className="decoy-mgmt">
      <div className="dm-header">
        <span className="dm-ttl">HONEYTOKEN LAYER</span>
        <button className="dm-deploy" onClick={deploy}>+ DEPLOY</button>
      </div>
      <div className="dm-list">
        {decoys.map((d, i) => (
          <div key={i} className="dm-item">
            <div className={`dm-status ${d.status}`}/>
            <div className="dm-name">{d.name}</div>
            <div className="dm-hits" style={{color: d.hits>0?'#e74c3c':'var(--muted)'}}>
              {d.hits > 0 ? `${d.hits} hits` : d.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Deep Dive Modal ─── */
function DeepDiveModal({ attacker, onClose }) {
  if (!attacker) return null
  const score = attacker.threat_score || attacker.threatScore || 0
  const cls = rc(score)
  const types = [...(JSON.parse(attacker.attack_types_json || '[]')), ...(attacker.attackTypes || [])].filter(Boolean)
  const whoisData = [
    { k: 'IP ADDRESS', v: attacker.ip || 'N/A' },
    { k: 'COUNTRY', v: attacker.country || 'Unknown' },
    { k: 'CITY', v: attacker.city || 'Unknown' },
    { k: 'ISP', v: attacker.isp || 'Unknown' },
    { k: 'ASN', v: attacker.asn || 'N/A' },
    { k: 'RDNS', v: attacker.rdns || 'N/A' },
    { k: 'TOR EXIT', v: attacker.isTor ? 'YES' : 'NO' },
    { k: 'DATACENTER', v: (attacker.isDatacenter || attacker.is_datacenter) ? 'YES' : 'NO' },
    { k: 'THREAT SCORE', v: `${score}/100` },
    { k: 'CLASS', v: attacker.attacker_class || attacker.attackerClass || 'Unknown' },
  ]
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{position:'relative'}}>
        <div className="modal-header">
          <span className="modal-title">⚡ Deep Dive — {attacker.ip}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-section">
            <div className="modal-section-title">WHOIS Intelligence</div>
            <div className="whois-grid">
              {whoisData.map(({ k, v }) => (
                <div key={k} className="whois-item">
                  <div className="whois-k">{k}</div>
                  <div className="whois-v" style={{color: k==='TOR EXIT'&&v==='YES'?'#fca5a5':k==='THREAT SCORE'?'var(--crb)':undefined}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          {types.length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">Attack Signatures</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {types.map(t => (
                  <span key={t} style={{padding:'4px 10px',background:'rgba(192,57,43,.12)',border:'1px solid rgba(192,57,43,.25)',borderRadius:6,fontFamily:"'JetBrains Mono'",fontSize:8.5,color:'#fca5a5'}}>{t}</span>
                ))}
              </div>
            </div>
          )}
          <div className="modal-section">
            <div className="modal-section-title">AI Analysis</div>
            <AIConfidence score={score} reason={
              score >= 80 ? 'Pattern matches known APT group behavior — aggressive multi-vector' :
              score >= 60 ? 'Behavioral signature consistent with automated exploit toolkit' :
              score >= 40 ? 'Moderate reconnaissance patterns detected' :
              'Low-risk probe — likely automated scanner'
            }/>
          </div>
          <div className="modal-section">
            <div className="modal-section-title">Mitigation Actions</div>
            <div className="modal-actions">
              <button className="mit-btn block" onClick={() => { alert(`Blocked ${attacker.ip}`); onClose() }}>🚫 BLOCK</button>
              <button className="mit-btn shadow" onClick={() => { alert(`Shadow-banned ${attacker.ip}`); onClose() }}>👁 SHADOW BAN</button>
              <button className="mit-btn throttle" onClick={() => { alert(`Throttling ${attacker.ip}`); onClose() }}>⏱ THROTTLE</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Report Modal ─── */
function ReportModal({ onClose, stats, attackers, events, alerts }) {
  const [selected, setSelected] = useState('1h')
  const [generating, setGenerating] = useState(false)
  const options = [
    { v: '30m', label: 'Past 30 Minutes', sub: 'Recent threat activity snapshot' },
    { v: '1h', label: 'Past 1 Hour', sub: 'Hourly security digest' },
    { v: '6h', label: 'Past 6 Hours', sub: 'Half-day threat overview' },
    { v: '24h', label: 'Past 24 Hours', sub: 'Daily security report' },
    { v: '7d', label: 'Past 7 Days', sub: 'Weekly threat analysis' },
  ]
  const generateReport = () => {
    setGenerating(true)
    setTimeout(() => {
      const now = new Date()
      const dur = options.find(o => o.v === selected)?.label || selected
      const totalAtk = stats.total_events || events.length || 0
      const critCnt = alerts.filter(a => a.severity === 'CRITICAL').length
      const avgScore = attackers.length
        ? Math.round(attackers.reduce((s, a) => s + (a.threat_score || a.threatScore || 0), 0) / attackers.length)
        : 0
      const html = `<!DOCTYPE html><html><head><title>IntruSense Report — ${dur}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#04040a;color:#e2e8f0;font-family:'Syne',sans-serif;padding:40px}
  .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid rgba(231,76,60,.3)}
  .logo{display:flex;align-items:center;gap:12px}
  .logo-box{width:44px;height:44px;background:linear-gradient(135deg,#c0392b,#e74c3c);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px}
  .logo-name{font-size:24px;font-weight:800;letter-spacing:3px}
  .meta{text-align:right;font-family:'JetBrains Mono';font-size:10px;color:rgba(255,255,255,.4);line-height:2}
  .meta b{color:rgba(231,76,60,.8)}
  h2{font-size:13px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.4);margin:28px 0 14px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
  .card{padding:18px;border-radius:12px;border:1px solid rgba(255,255,255,.08)}
  .card.r{background:linear-gradient(135deg,rgba(192,57,43,.14),rgba(4,4,10,.8));border-color:rgba(192,57,43,.22)}
  .card.b{background:linear-gradient(135deg,rgba(6,182,212,.1),rgba(4,4,10,.8));border-color:rgba(6,182,212,.18)}
  .card.g{background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(4,4,10,.8));border-color:rgba(34,197,94,.18)}
  .card.a{background:linear-gradient(135deg,rgba(245,158,11,.1),rgba(4,4,10,.8));border-color:rgba(245,158,11,.18)}
  .lbl{font-family:'JetBrains Mono';font-size:8px;letter-spacing:2px;color:rgba(255,255,255,.3);margin-bottom:7px}
  .val{font-family:'Syne';font-size:34px;font-weight:800;line-height:1}
  .card.r .val{color:#e74c3c}.card.b .val{color:#22d3ee}.card.g .val{color:#22c55e}.card.a .val{color:#f59e0b}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  th{font-family:'JetBrains Mono';font-size:8.5px;letter-spacing:1.5px;color:rgba(255,255,255,.3);text-align:left;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.07)}
  td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px;color:rgba(255,255,255,.6);font-family:'JetBrains Mono'}
  .footer{margin-top:36px;padding-top:18px;border-top:1px solid rgba(255,255,255,.06);font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,.2);display:flex;justify-content:space-between}
</style></head><body>
<div class="header">
  <div class="logo"><div class="logo-box">🛡</div><div><div class="logo-name">INTRUSENSE</div><div style="font-family:'JetBrains Mono';font-size:9px;color:rgba(231,76,60,.7);letter-spacing:3px">DECEPTION-BASED IDS</div></div></div>
  <div class="meta"><div>Period: <b>${dur}</b></div><div>Generated: ${now.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</div></div>
</div>
<h2>EXECUTIVE SUMMARY</h2>
<div class="grid">
  <div class="card r"><div class="lbl">TOTAL ATTACKS</div><div class="val">${totalAtk}</div></div>
  <div class="card b"><div class="lbl">UNIQUE ATTACKERS</div><div class="val">${attackers.length}</div></div>
  <div class="card r"><div class="lbl">CRITICAL ALERTS</div><div class="val">${critCnt}</div></div>
  <div class="card a"><div class="lbl">AVG THREAT SCORE</div><div class="val">${avgScore}</div></div>
</div>
<h2>TOP ATTACKERS</h2>
<table><thead><tr><th>IP</th><th>LOCATION</th><th>SCORE</th><th>HITS</th><th>TYPE</th></tr></thead><tbody>
${attackers.slice(0,15).map(a=>{
  const sc=a.threat_score||a.threatScore||0
  const types=[...JSON.parse(a.attack_types_json||'[]'),...(a.attackTypes||[])].filter(Boolean)
  const loc=[a.city,a.country].filter(Boolean).join(', ')||'Unknown'
  return`<tr><td style="color:#fff">${a.ip}</td><td>${loc}</td><td>${sc}/100</td><td>${(a.hit_count||a.hitCount||0)}</td><td>${types.slice(0,2).join(', ')||'Unknown'}</td></tr>`
}).join('')}
</tbody></table>
<div class="footer"><div>IntruSense — Confidential Security Report</div><div>${now.toLocaleDateString('en-IN')}</div></div>
</body></html>`
      const win = window.open('', '_blank')
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 800)
      setGenerating(false)
      onClose()
    }, 1200)
  }
  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        <div className="report-modal-header">
          <span className="report-modal-title">📄 Download Security Report</span>
          <button className="modal-close" onClick={onClose} style={{border:'1px solid rgba(6,182,212,.2)'}}>✕</button>
        </div>
        <div className="report-options">
          <div style={{fontFamily:"'JetBrains Mono'",fontSize:9,color:'var(--muted)',letterSpacing:1.5,marginBottom:4}}>SELECT TIME RANGE</div>
          {options.map(o => (
            <div key={o.v} className={`report-opt ${selected === o.v ? 'active' : ''}`} onClick={() => setSelected(o.v)}>
              <div className="report-opt-icon">{o.v==='30m'?'⚡':o.v==='1h'?'🕐':o.v==='6h'?'🕕':o.v==='24h'?'📅':'📊'}</div>
              <div>
                <div className="report-opt-label">{o.label}</div>
                <div className="report-opt-sub">{o.sub}</div>
              </div>
              {selected === o.v && <div style={{marginLeft:'auto',color:'#22d3ee',fontSize:16}}>✓</div>}
            </div>
          ))}
        </div>
        <button className="report-generate-btn" onClick={generateReport} disabled={generating}>
          {generating ? '⏳ GENERATING...' : '⬇ GENERATE & DOWNLOAD PDF'}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════ */
export default function Dashboard() {
  const { connected, stats, attackers, events, alerts, mapData, notifications, unreadCount, clearUnread } = useSocket()
  const [tab, setTab] = useState('overview')
  const [selIP, setSelIP] = useState(null)
  const [sortBy, setSortBy] = useState('score')
  const [notifOpen, setNotifOpen] = useState(false)
  const [clock, setClock] = useState(new Date().toLocaleTimeString('en-IN', {hour12:false}))
  const [deepDiveTarget, setDeepDiveTarget] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    const id = 'db-css-v7'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id
      s.textContent = CSS + `@keyframes mPulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(4);opacity:0}}`
      document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString('en-IN', {hour12:false})), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const crit = notifications.find(n => n.isNew && (n.severity==='CRITICAL' || n.alertType==='CRITICAL_THREAT'))
    if (crit) setNotifOpen(true)
  }, [notifications])

  const toggleNotif = () => { const next = !notifOpen; setNotifOpen(next); if (next) clearUnread() }

  const sel = attackers.find(a => a.ip === selIP) || null
  const totalAtk = stats.total_events || events.length || 0
  const uniqAtk = stats.unique_ips || attackers.length || 0
  const critCnt = alerts.filter(a => a.severity==='CRITICAL' || a.alert_type==='CRITICAL').length
  const avgScore = attackers.length
    ? Math.round(attackers.reduce((s, a) => s + (a.threat_score||a.threatScore||0), 0) / attackers.length)
    : 0

  // Sort attackers
  const sortedAttackers = useMemo(() => {
    const arr = [...attackers]
    if (sortBy === 'score') return arr.sort((a, b) => (b.threat_score||b.threatScore||0) - (a.threat_score||a.threatScore||0))
    if (sortBy === 'hits') return arr.sort((a, b) => (b.hit_count||b.hitCount||0) - (a.hit_count||a.hitCount||0))
    if (sortBy === 'new') return arr.sort((a, b) => new Date(b.last_seen||b.lastSeen||0) - new Date(a.last_seen||a.lastSeen||0))
    return arr
  }, [attackers, sortBy])

  const typeMap = {}
  attackers.forEach(a => {
    const types = [...JSON.parse(a.attack_types_json || '[]'), ...(a.attackTypes || [])]
    types.forEach(t => { if (t) typeMap[t] = (typeMap[t] || 0) + 1 })
  })
  const topTypes = Object.entries(typeMap).sort((a, b) => b[1]-a[1]).slice(0, 6).map(([l, v]) => ({l, v}))
  const maxType = topTypes[0]?.v || 1

  const getIntel = a => {
    if (a.intel) return a.intel
    const isLocal = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.)/.test(a.ip)
    return {
      isLocal,
      displayLocation: isLocal ? '📶 Inside WiFi/LAN' : [a.city, a.country].filter(Boolean).join(', ') || 'Unknown',
      device: { type: 'Unknown', icon: '❓' },
      riskFlags: [isLocal && '⚠️ Internal'].filter(Boolean)
    }
  }

  const recentScores = sel
    ? events.filter(e => e.ip===sel.ip).slice(0, 12).map(e => e.profile?.threatScore||e.profile?.threat_score||0).reverse()
    : attackers.slice(0, 12).map(a => a.threat_score||a.threatScore||0)

  const TABS = [
    ['overview', 'OVERVIEW'],
    ['honeypot', 'HONEYPOT'],
   
    ['attacker', 'ATTACKER'],
    ['events', 'EVENTS'],
    ['alerts', 'ALERTS'],
    ['manager', 'MANAGER'],
  ]

  const MANAGER_DATA = [
    { icon:'🔐', tech:'SQL Injection from 192.168.1.5', plain:'Someone on your WiFi tried to trick your database into revealing passwords — like an automated lockpick tool.' },
    { icon:'🌏', tech:'Port Scan from external IP', plain:'A computer is systematically checking which doors are open on your server — a classic pre-attack reconnaissance move.' },
    { icon:'⚠️', tech:'Honeyfile /.env accessed', plain:'A trap was sprung. Someone accessed a fake secrets file. This is a confirmed intruder — caught in the act.' },
    { icon:'🔑', tech:'SSH Brute Force — 47 attempts', plain:'Rapid automated password guessing on your server login. IntruSense detected and logged it before any access was granted.' },
  ]

  return (
    <div id="db-root">
      {deepDiveTarget && <DeepDiveModal attacker={deepDiveTarget} onClose={() => setDeepDiveTarget(null)}/>}
      {reportOpen && <ReportModal onClose={() => setReportOpen(false)} stats={stats} attackers={attackers} events={events} alerts={alerts}/>}

      {/* ─── TOPBAR ─── */}
      <div id="tb">
        <a href="/" className="tb-logo">
          <div className="tb-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span className="tb-brand">IntruSense</span>
        </a>
        <div className="tb-sep"/>
        <div className="tb-status">
          <div className={`tb-pulse ${connected ? '' : 'off'}`}/>
          {connected ? 'LIVE' : 'OFFLINE'}
        </div>
        <div className="tb-r">
          <span className="tb-time">{clock}</span>
          <button className="tb-btn report" onClick={() => setReportOpen(true)}>⬇ REPORT</button>
          <a href="http://localhost:8080" target="_blank" rel="noreferrer" className="tb-btn danger">Honeypot ↗</a>
          <a href="/" className="tb-btn">← Landing</a>
          <div className="nb-wrap">
            <button className={`nb-btn ${unreadCount>0?'has':''} ${notifOpen?'open':''}`} onClick={toggleNotif}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              {unreadCount > 0 && <span className="nb-badge">{unreadCount>99?'99+':unreadCount}</span>}
            </button>
            <NotifPanel open={notifOpen} notifs={notifications} unread={unreadCount} onClear={() => { clearUnread(); setNotifOpen(false) }}/>
            {notifOpen && <div style={{position:'fixed',inset:0,zIndex:9997}} onClick={() => setNotifOpen(false)}/>}
          </div>
        </div>
      </div>

      {/* ─── LAYOUT ─── */}
      <div id="layout">

        {/* ══ LEFT: REDESIGNED THREAT PANEL ══ */}
        <div id="left">
          <div className="lp-header">
            <div className="lp-title-row">
              <span className="lp-title">Active Threats</span>
              <span className="lp-count-badge">{attackers.length}</span>
            </div>
            <div className="lp-filters">
              {[['score','SCORE'],['hits','HITS'],['new','RECENT']].map(([v, l]) => (
                <button key={v} className={`lp-filter-btn ${sortBy===v?'active':''}`} onClick={() => setSortBy(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="lp-div"/>

          <div className="lp-scroll">
            {sortedAttackers.length === 0
              ? <div className="lp-empty">NO THREATS DETECTED<br/>MONITORING ACTIVE...<br/><br/>Deploy honeypot on<br/>port 8080</div>
              : sortedAttackers.map(a => {
                const score = a.threat_score || a.threatScore || 0
                const cls = rc(score)
                const intel = getIntel(a)
                const types = [...JSON.parse(a.attack_types_json||'[]'), ...(a.attackTypes||[])].filter(Boolean)
                const isSelected = selIP === a.ip
                return (
                  <div
                    key={a.ip}
                    className={`ac ${isSelected ? 'sel' : ''}`}
                    onClick={() => setSelIP(isSelected ? null : a.ip)}
                  >
                    <div className={`ac-severity-bar ${cls}`}/>
                    <div className="ac-main">
                      <div className="ac-row1">
                        <span className="ac-ip">{a.ip}</span>
                        <span className={`ac-score ${cls}`}>{score}</span>
                      </div>
                      <div className="ac-row2">
                        <span className="ac-loc">{intel.displayLocation}</span>
                        <span className={`ac-rv rv-${cls}`}>{rl(score)}</span>
                      </div>
                      {types.length > 0 && (
                        <div className="ac-tags">
                          {types.slice(0, 3).map(t => <span key={t} className="ac-tag">{t}</span>)}
                        </div>
                      )}
                      <div className="ac-progress">
                        <div className="ac-progress-fill" style={{width:`${score}%`}}/>
                      </div>
                      <div className="ac-actions">
                        <button className="ac-dive-btn" onClick={e => { e.stopPropagation(); setDeepDiveTarget(a) }}>⚡ DEEP DIVE</button>
                        <button className="ac-select-btn" onClick={e => { e.stopPropagation(); setSelIP(isSelected?null:a.ip); setTab('attacker') }}>PROFILE →</button>
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </div>

          <div className="lp-footer">
            <span className="lp-footer-stat">CRITICAL: <span>{attackers.filter(a=>(a.threat_score||a.threatScore||0)>=80).length}</span></span>
            <span className="lp-footer-stat">TOTAL HITS: <span>{attackers.reduce((s,a)=>s+(a.hit_count||a.hitCount||0),0).toLocaleString()}</span></span>
          </div>
        </div>

        {/* ══ MID: MAIN CONTENT ══ */}
        <div id="mid">
          <div className="tabs">
            {TABS.map(([v, l]) => (
              <button key={v} className={`tab ${tab===v?'on':''}`} onClick={() => setTab(v)}>{l}</button>
            ))}
          </div>

          <div className="tb-body">

            {/* ════ OVERVIEW ════ */}
            {tab === 'overview' && <>
              <div className="stat-row">
                {[
                  { l:'TOTAL ATTACKS', v:totalAtk.toLocaleString(), s:'All time events', color:'red',
                    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg> },
                  { l:'UNIQUE ATTACKERS', v:uniqAtk.toLocaleString(), s:'Distinct IPs tracked', color:'blue',
                    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
                  { l:'CRITICAL ALERTS', v:critCnt, s:'Require attention', color: critCnt>0?'red':'green',
                    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
                  { l:'AVG THREAT SCORE', v:avgScore, s:'Out of 100', color: avgScore>=70?'red':avgScore>=40?'amber':'green',
                    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg> },
                ].map(({ l, v, s, color, icon }) => (
                  <div key={l} className={`sc ${color}`}>
                    <div className={`sc-icon ${color}`}>{icon}</div>
                    <div className="sc-l">{l}</div>
                    <div className={`sc-v ${color}`}>{v}</div>
                    <div className="sc-s">{s}</div>
                  </div>
                ))}
              </div>

              <div className="map-card" style={{position:'relative'}}>
                <div className="map-hd">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--crb)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
                  </svg>
                  <span className="map-ttl">LIVE THREAT MAP</span>
                  <div className="map-live"><div className="map-ldot"/>REAL-TIME</div>
                </div>
                <CyberMap mapData={mapData}/>
                <div className="map-legend">
                  {[['#ff4444','CRITICAL'],['#ff8800','HIGH'],['#f59e0b','MEDIUM'],['#22d3ee','LOW'],['#22c55e','HOME']].map(([c,l]) => (
                    <div key={l} className="map-legend-item">
                      <div className="map-legend-dot" style={{background:c,boxShadow:`0 0 5px ${c}`}}/>
                      <span className="map-legend-lbl">{l}</span>
                    </div>
                  ))}
                </div>
                {mapData.length > 0 && (
                  <div className="map-stats">
                    <div className="map-stat-pill"><span className="map-stat-v">{mapData.length}</span><span className="map-stat-l">ORIGINS</span></div>
                    <div className="map-stat-pill"><span className="map-stat-v" style={{color:'#ff4444'}}>{mapData.filter(a=>(a.threat_score||a.threatScore||0)>=80).length}</span><span className="map-stat-l">CRITICAL</span></div>
                  </div>
                )}
              </div>

              <div className="charts-row">
                <div className="chart-card">
                  <div className="chart-ttl">ATTACK TYPE DISTRIBUTION</div>
                  {topTypes.length > 0
                    ? <BarChart data={topTypes} max={maxType}/>
                    : <div style={{fontSize:9,padding:'16px 0',textAlign:'center',fontFamily:"'JetBrains Mono'",color:'rgba(255,255,255,.12)',letterSpacing:2}}>AWAITING DATA</div>
                  }
                </div>
                <div className="chart-card">
                  <div className="chart-ttl">ACTIVITY TIMELINE (24h)</div>
                  <HourlyChart events={events}/>
                </div>
              </div>
            </>}

            {/* ════ HONEYPOT ════ */}
            {tab === 'honeypot' && <>
              <HoneypotPanel events={events} attackers={attackers}/>
              <DecoyManager/>
            </>}

                       {/* ════ ATTACKER DETAIL ════ */}
            {tab === 'attacker' && <>
              {!sel
                ? <div className="info-card" style={{marginTop:60}}>
                    <div style={{fontSize:36,marginBottom:12}}>🎯</div>
                    <div style={{fontFamily:"'JetBrains Mono'",fontSize:10,letterSpacing:2,lineHeight:2.5,color:'var(--muted)'}}>SELECT AN ATTACKER<br/>FROM THE LEFT PANEL<br/>TO VIEW FULL PROFILE</div>
                  </div>
                : (() => {
                  const score = sel.threat_score || sel.threatScore || 0
                  const cls = rc(score)
                  const intel = getIntel(sel)
                  const aiSum = sel.aiSummary || sel.intel?.aiSummary
                  const plain = aiSum?.plainEnglish || sel.plainEnglish
                  const types = [...JSON.parse(sel.attack_types_json||'[]'), ...(sel.attackTypes||[])].filter(Boolean)
                  const creds = [...JSON.parse(sel.credentials_tried_json||'[]'), ...(sel.credentialsTried||[])]
                  return <>
                    {plain && (
                      <div className="ai-card">
                        <div className="ai-hd">
                          <div className="ai-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
                          <div>
                            <div className="ai-ttl">AI Security Summary</div>
                            <div className="ai-sub">PLAIN ENGLISH ANALYSIS</div>
                          </div>
                        </div>
                        <div className="ai-msg">"{plain}"</div>
                        <AIConfidence score={score} reason={
                          score >= 80 ? 'Pattern matches known APT group behavior — aggressive multi-vector attack' :
                          score >= 60 ? 'Behavioral signature matches automated exploit toolkit' :
                          'Reconnaissance patterns — early-stage threat actor'
                        }/>
                        <div className="ai-chips">
                          <div className={`ai-chip ${intel.isLocal?'local':''}`}>📍 {intel.displayLocation}</div>
                          <div className="ai-chip">{intel.device?.icon} {intel.device?.type || 'Unknown'}</div>
                          {intel.riskFlags?.map(f => <div key={f} className="ai-chip flag">{f}</div>)}
                        </div>
                      </div>
                    )}
                    <div className="detail-card">
                      <div className="dh">
                        <div>
                          <div className="dh-ip">{sel.ip}</div>
                          <div className="dh-loc">{intel.displayLocation}</div>
                        </div>
                        <div>
                          <div className={`dh-score ${cls}`}>{score}</div>
                          <div className="dh-slbl">THREAT SCORE</div>
                        </div>
                      </div>
                      <div className="db">
                        {[
                          ['FIRST SEEN', timeAgo(sel.first_seen||sel.firstSeen)],
                          ['LAST SEEN', timeAgo(sel.last_seen||sel.lastSeen)],
                          ['HIT COUNT', (sel.hit_count||sel.hitCount||0).toLocaleString()],
                          ['ISP', sel.isp||'Unknown'],
                          ['ASN', sel.asn||'Unknown'],
                          ['RDNS', sel.rdns||'N/A'],
                          ['CLASS', sel.attacker_class||sel.attackerClass||'Unknown'],
                          types.length > 0 && ['ATTACK TYPES', types.join(', ')],
                          sel.isTor && ['TOR EXIT', 'YES — Anonymized'],
                          (sel.isDatacenter||sel.is_datacenter) && ['VPN/HOSTING', 'YES — Datacenter IP'],
                        ].filter(Boolean).map(([k, v]) => (
                          <div key={k} className="dr">
                            <span className="dr-k">{k}</span>
                            <span className={`dr-v ${k==='ATTACK TYPES'||k==='TOR EXIT'||k==='VPN/HOSTING'?'danger':''}`}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mitigation-row">
                        <button className="mit-btn block" onClick={() => alert(`Blocked ${sel.ip}`)}>🚫 BLOCK IP</button>
                        <button className="mit-btn shadow" onClick={() => alert(`Shadow banned ${sel.ip}`)}>👁 SHADOW BAN</button>
                        <button className="mit-btn throttle" onClick={() => alert(`Throttling ${sel.ip}`)}>⏱ THROTTLE</button>
                      </div>
                    </div>
                    {creds.length > 0 && (
                      <div className="chart-card">
                        <div className="chart-ttl" style={{color:'#ff4444'}}>⚠ CREDENTIALS ATTEMPTED</div>
                        {creds.slice(0, 6).map((c, i) => (
                          <div key={i} className="cred-row">{c.username||'—'} / {c.password?'••••••':'—'} · {c.path||''}</div>
                        ))}
                      </div>
                    )}
                  </>
                })()
              }
            </>}

            {/* ════ EVENTS ════ */}
            {tab === 'events' && <>
              <div className="sect-lbl">SHOWING {Math.min(events.length, 100)} RECENT EVENTS</div>
              {events.length === 0
                ? <div className="info-card"><div style={{fontSize:9,fontFamily:"'JetBrains Mono'",letterSpacing:2,lineHeight:2.5,color:'var(--muted)'}}>NO EVENTS YET<br/>AWAITING HONEYPOT HITS</div></div>
                : events.slice(0, 100).map((e, i) => {
                  const plain = e.aiSummary?.plainEnglish || e.profile?.aiSummary?.plainEnglish
                  return (
                    <div key={e.id||i} className="ev">
                      <div className="ev-top">
                        <span className="ev-proto">{e.protocol||'HTTP'} · {e.ip}</span>
                        <span className="ev-time">{fmt(e.timestamp)}</span>
                      </div>
                      <div className="ev-path">{e.method||'GET'} {e.path||'/'}</div>
                      {plain && <div className="ev-ai">"{plain}"</div>}
                    </div>
                  )
                })
              }
            </>}

            {/* ════ ALERTS ════ */}
            {tab === 'alerts' && <>
              <div className="sect-lbl">{alerts.length} TOTAL ALERTS</div>
              {alerts.length === 0
                ? <div className="info-card"><div style={{fontSize:9,fontFamily:"'JetBrains Mono'",letterSpacing:2,lineHeight:2.5,color:'var(--muted)'}}>NO ALERTS<br/>SYSTEM IS CLEAN ✓</div></div>
                : alerts.slice(0, 80).map((al, i) => {
                  const sv = al.severity || (al.alert_type?.includes('CRITICAL') ? 'CRITICAL' : 'HIGH')
                  const plain = al.plainEnglish || al.profileSnapshot?.plainEnglish
                  return (
                    <div key={al.id||i} className={`al ${al.isNew?'fresh':''}`}>
                      <div className={`al-sv ${sv}`}>{al.alert_type||al.alertType||sv}</div>
                      <div className="al-msg">{al.message||al.msg||'Alert'}</div>
                      {plain && <div className="al-plain">"{plain}"</div>}
                      <div className="al-meta">
                        <span>{al.ip}</span>
                        <span>{fmt(al.timestamp)}</span>
                        {al.count > 1 && <span className="al-xc">×{al.count}</span>}
                      </div>
                    </div>
                  )
                })
              }
            </>}

            {/* ════ MANAGER VIEW ════ */}
            {tab === 'manager' && <>
              <div className="mgr-banner">
                <div>
                  <div className="mgr-ttl">Security Status — Non-Technical Overview</div>
                  <div className="mgr-sub">Plain-English summary for business leaders and managers</div>
                </div>
                <div className="mgr-badge"><span className="live-dot" style={{marginRight:5}}/> SYSTEM PROTECTED</div>
              </div>
              <div className="mgr-cards">
                {[
                  { l:'Threats This Week', n:'12', s:'3 critical, 9 medium', color:'red' },
                  { l:'Attackers Identified', n:'7', s:'All traced & blocked', color:'blue' },
                  { l:'Files Kept Safe', n:'43', s:'Would have been stolen', color:'green' },
                  { l:'Detection Speed', n:'1.4s', s:'Industry avg: 207 days', color:'amber' },
                ].map(({ l, n, s, color }) => (
                  <div key={l} className={`mc ${color}`}>
                    <div className="mc-l">{l}</div>
                    <div className={`mc-n ${color}`}>{n}</div>
                    <div className="mc-s">{s}</div>
                  </div>
                ))}
              </div>
              <div className="sect-lbl">WHAT THESE ALERTS MEAN IN PLAIN ENGLISH</div>
              <div className="tr-grid">
                {MANAGER_DATA.map(({ icon, tech, plain }) => (
                  <div key={tech} className="tr">
                    <div className="tr-ic">{icon}</div>
                    <div>
                      <div className="tr-tech">{tech}</div>
                      <div className="tr-plain">{plain}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="sect-lbl" style={{marginTop:4}}>INTRUSENSE vs ALTERNATIVES</div>
              <div className="ct-wrap">
                <table className="ct">
                  <thead>
                    <tr>
                      <th>FEATURE</th><th>Traditional IDS/IPS</th><th>Enterprise SIEM</th>
                      <th style={{color:'var(--crb)',background:'rgba(255,59,47,.04)'}}>INTRUSENSE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Post-breach detection','❌ Blind inside','⚠️ Partial','✅ Core feature'],
                      ['False positives','High — daily noise','Very high','Near zero'],
                      ['Non-technical users','❌ Experts only','❌ Experts only','✅ AI Plain-English'],
                      ['Setup time','Weeks','Months','5 minutes'],
                      ['Annual cost','₹5–20 lakhs','₹40–80 lakhs','Free / Open Source'],
                    ].map(([f, a, b, c]) => (
                      <tr key={f}>
                        <td>{f}</td>
                        <td><span className={a.includes('❌')?'ct-bad':a.includes('✅')?'ct-good':''}>{a}</span></td>
                        <td><span className={b.includes('❌')?'ct-bad':b.includes('✅')?'ct-good':''}>{b}</span></td>
                        <td className="ct-hl"><span className="ct-good">{c}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>}

          </div>
        </div>

        {/* ══ RIGHT: LIVE FEED + STATS ══ */}
        <div id="right">
          <div className="ph">
            <span className="ph-t">Live Feed</span>
            <div style={{display:'flex',alignItems:'center',gap:5,fontFamily:"'JetBrains Mono'",fontSize:8,color:'var(--green)',letterSpacing:2}}>
              <div className="live-dot"/>LIVE
            </div>
          </div>

          <div className="rstat-strip">
            <div className="rs"><div className="rs-l">ATTACKS</div><div className={`rs-v ${totalAtk>0?'red':''}`}>{totalAtk}</div></div>
            <div className="rs"><div className="rs-l">BLOCKED</div><div className="rs-v green">{critCnt}</div></div>
            <div className="rs"><div className="rs-l">ATTACKERS</div><div className="rs-v">{uniqAtk}</div></div>
            <div className="rs"><div className="rs-l">AVG SCORE</div><div className={`rs-v ${avgScore>=80?'red':''}`}>{avgScore}</div></div>
          </div>

          {(sel || attackers[0]) && (() => {
            const a = sel || attackers[0]
            const score = a.threat_score || a.threatScore || 0
            const cls = rc(score)
            const intel = getIntel(a)
            const conf = Math.min(97, 38 + score * 0.59)
            return (
              <div className="gauge-wrap">
                <div className="gauge-ttl">RISK MONITOR — {sel ? sel.ip : 'TOP THREAT'}</div>
                <div className="gauge-row">
                  <div className={`gauge-num ${cls}`}>{score}</div>
                  <div className="gauge-info">
                    <h4 style={{color: cls==='critical'?'#ff4444':cls==='high'?'#ff8800':cls==='medium'?'#f59e0b':'var(--green)'}}>{rl(score)}</h4>
                    <p>{intel.displayLocation}<br/>Score: {score}/100</p>
                    <div className="gauge-ai-conf">
                      <span className="gauge-ai-label">AI CONF</span>
                      <span className="gauge-ai-val">{Math.round(conf)}%</span>
                    </div>
                  </div>
                </div>
                <Sparkline scores={recentScores.length ? recentScores : [0,0,0,0,0,0,0,0,score]}/>
              </div>
            )
          })()}

          <div className="ps">
            {events.length === 0
              ? <div style={{padding:'40px 14px',textAlign:'center',fontFamily:"'JetBrains Mono'",fontSize:9.5,color:'rgba(255,255,255,.12)',lineHeight:2.5,letterSpacing:1}}>MONITORING...<br/>Awaiting events</div>
              : events.slice(0, 60).map((e, i) => {
                const score = e.profile?.threatScore || e.profile?.threat_score || 0
                const cls = rc(score)
                const plain = e.aiSummary?.plainEnglish || e.profile?.aiSummary?.plainEnglish
                return (
                  <div key={e.id||i} className="fi">
                    <div className={`fi-dot ${cls}`}/>
                    <div className="fi-bd">
                      <div className="fi-top">
                        <span className="fi-proto">{e.protocol||'HTTP'} · {e.ip}</span>
                        <span className="fi-time">{fmt(e.timestamp)}</span>
                      </div>
                      <div className="fi-path">{e.method||'GET'} {e.path||'/'}</div>
                      {plain && <div className="fi-ai">"{plain}"</div>}
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>

      </div>
    </div>
  )
}
