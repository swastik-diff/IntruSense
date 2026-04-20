import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const BACKEND = import.meta.env.VITE_API_URL || ''

export default function useSocket() {
  const [connected, setConnected]     = useState(false)
  const [stats, setStats]             = useState({})
  const [attackers, setAttackers]     = useState([])
  const [events, setEvents]           = useState([])
  const [alerts, setAlerts]           = useState([])
  const [mapData, setMapData]         = useState([])
  const [notifications, setNotifs]    = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef(null)
  const fetchedRef = useRef(false)

  // ── REST bootstrap ──────────────────────────────────────────────────────
  const bootstrap = useCallback(async () => {
    try {
      const [s, a, ev, al, md] = await Promise.all([
        fetch(`${BACKEND}/api/stats`).then(r => r.json()),
        fetch(`${BACKEND}/api/attackers`).then(r => r.json()),
        fetch(`${BACKEND}/api/events`).then(r => r.json()),
        fetch(`${BACKEND}/api/alerts`).then(r => r.json()),
        fetch(`${BACKEND}/api/map-data`).then(r => r.json()),
      ])
      setStats(s || {})
      setAttackers(a || [])
      setEvents(ev || [])
      setAlerts(al || [])
      setMapData(md || [])
      // Build initial notifications from recent alerts
      const notifs = (al || []).slice(0, 20).map(alert => ({
        ...alert,
        key: `${alert.ip}::${alert.alert_type}`,
        count: 1,
        isNew: false,
      }))
      setNotifs(notifs)
    } catch (e) {
      console.warn('[IntruSense] Bootstrap failed:', e.message)
    }
  }, [])

  // ── Socket.io ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(BACKEND, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      if (!fetchedRef.current) { bootstrap(); fetchedRef.current = true }
    })
    socket.on('disconnect', () => setConnected(false))

    socket.on('initial_state', ({ stats: s, attackers: a, alerts: al, events: ev }) => {
      if (s) setStats(s)
      if (a) setAttackers(a)
      if (al) setAlerts(al)
      if (ev) setEvents(ev)
    })

    socket.on('event', ({ profile, event, aiSummary, intel }) => {
      setEvents(prev => [{ ...event, profile, aiSummary, intel, id: Date.now() }, ...prev].slice(0, 200))
      // Refresh stats + map periodically
      fetch(`${BACKEND}/api/stats`).then(r => r.json()).then(setStats).catch(() => {})
      fetch(`${BACKEND}/api/map-data`).then(r => r.json()).then(setMapData).catch(() => {})
    })

    socket.on('profile_update', (profile) => {
      setAttackers(prev => {
        const idx = prev.findIndex(a => a.ip === profile.ip)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], ...profile }
          return next.sort((a, b) => (b.threat_score || b.threatScore || 0) - (a.threat_score || a.threatScore || 0))
        }
        return [profile, ...prev].slice(0, 100)
      })
    })

    socket.on('alert', (alert) => {
      const incoming = { ...alert, isNew: true }
      setAlerts(prev => [incoming, ...prev].slice(0, 200))

      // Smart grouping for UI notifications
      setNotifs(prev => {
        const key = `${alert.ip}::${alert.alertType}`
        const existingIdx = prev.findIndex(n => n.key === key)
        if (existingIdx >= 0) {
          const next = [...prev]
          next[existingIdx] = { ...next[existingIdx], count: (next[existingIdx].count || 1) + 1, lastTs: alert.timestamp, isNew: true }
          return next
        }
        return [{ ...incoming, key, count: 1 }, ...prev].slice(0, 50)
      })
      setUnreadCount(c => c + 1)
    })

    socket.on('notification_update', ({ key, count, alert }) => {
      setNotifs(prev => prev.map(n => n.key === key ? { ...n, count, alert, lastTs: alert.timestamp } : n))
    })

    socket.on('alert_acknowledged', ({ id }) => {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
    })

    // Fallback polling if socket doesn't connect quickly
    const pollTimer = setTimeout(() => {
      if (!fetchedRef.current) { bootstrap(); fetchedRef.current = true }
    }, 3000)

    return () => { socket.disconnect(); clearTimeout(pollTimer) }
  }, [bootstrap])

  const clearUnread = useCallback(() => {
    setUnreadCount(0)
    setNotifs(prev => prev.map(n => ({ ...n, isNew: false })))
  }, [])

  const acknowledgeAlert = useCallback(async (id) => {
    try {
      await fetch(`${BACKEND}/api/alerts/${id}/acknowledge`, { method: 'POST' })
    } catch (_) {}
  }, [])

  return { connected, stats, attackers, events, alerts, mapData, notifications, unreadCount, clearUnread, acknowledgeAlert }
}
