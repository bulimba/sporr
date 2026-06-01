'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────
type Event = {
  id: string
  title: string
  venue: string | null
  starts_at: string | null
}

type Session = {
  id: string
  session_token: string
  status: string
  created_at: string
  attendance: number | null
  delivery_context: string
  events: { title: string } | null
}

type OrgData = {
  id: string
  name: string
  tier: string
  logo_url: string | null
  show_logo_on_dashboard: boolean | null
  club_colour_primary: string | null
  club_colour_secondary: string | null
}

// ── Style tokens ──────────────────────────────────────────────────────────────
const INK    = '#081216'
const FOG    = '#E7ECEF'
const SLATE  = '#6E7F86'
const BLUE   = '#147BFF'
const COPPER = '#B8734A'
const GREEN  = '#36B37E'
const BG     = '#F5F2ED'
const WHITE  = '#FFFFFF'
const SIDE   = '#0A1A1F'
const BORDER = 'rgba(8,18,22,0.08)'

const CARD: React.CSSProperties = { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }
const inpStyle: React.CSSProperties = {
  width: '100%', background: WHITE, border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: '10px 14px', fontSize: 14, color: INK,
  outline: 'none', fontFamily: 'inherit',
}
const lblStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: SLATE,
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
}
const sectionHead: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: SLATE,
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16,
}

// Contrast helper — black/white text on a given fill
function textOnColour(hex: string): string {
  if (!hex || hex.length < 7) return '#FFFFFF'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000000' : '#FFFFFF'
}

// ── Plan tier system (operational complexity, never gated on participation) ───
const PLAN_TIER_LABELS: Record<string, string> = {
  foundation: 'Foundation', organisation: 'Organisation', portfolio: 'Portfolio', network: 'Network',
}
function normaliseTier(raw: string | null | undefined): string {
  const map: Record<string, string> = {
    free: 'foundation', club: 'organisation', pro: 'portfolio', agency: 'network',
  }
  return map[raw || ''] ?? raw ?? 'foundation'
}

// ── Delivery contexts ─────────────────────────────────────────────────────────
const DELIVERY_CONTEXTS = [
  { value: 'match_day',   label: 'Match day' },
  { value: 'training',    label: 'Training' },
  { value: 'digital',     label: 'Digital' },
  { value: 'season_long', label: 'Season long' },
  { value: 'event',       label: 'Event' },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CapturePage() {
  const router   = useRouter()
  const supabase = createClient()

  const [events, setEvents]       = useState<Event[]>([])
  const [sessions, setSessions]   = useState<Session[]>([])
  const [org, setOrg]             = useState<OrgData | null>(null)
  const [orgId, setOrgId]         = useState<string | null>(null)
  const [planTier, setPlanTier]   = useState('foundation')
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [launching, setLaunching] = useState(false)
  const [activeSession, setActiveSession] = useState<{ token: string; qrUrl: string } | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    event_id: '',
    new_event_title: '',
    new_event_venue: '',
    new_event_date: '',
    attendance: '',
    delivery_context: 'match_day',
  })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: userData } = await supabase
        .from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }

      setOrgId(userData.org_id)

      const [orgRes, eventsRes, sessionsRes] = await Promise.all([
        supabase.from('organisations')
          .select('id,name,tier,logo_url,show_logo_on_dashboard,club_colour_primary,club_colour_secondary')
          .eq('id', userData.org_id).single(),
        supabase.from('events')
          .select('id, title, venue, starts_at')
          .eq('org_id', userData.org_id)
          .order('starts_at', { ascending: false }),
        supabase.from('audit_sessions')
          .select('id, session_token, status, created_at, attendance, delivery_context, events(title)')
          .eq('org_id', userData.org_id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      if (orgRes.data) {
        const o = orgRes.data as OrgData
        setOrg(o)
        setPlanTier(normaliseTier(o.tier))
      }
      setEvents(eventsRes.data || [])
      setSessions((sessionsRes.data as unknown as Session[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleLaunch() {
    if (!orgId) return
    setLaunching(true)
    setError(null)
    let eventId = form.event_id

    if (!eventId && form.new_event_title) {
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          org_id: orgId,
          title: form.new_event_title,
          venue: form.new_event_venue || null,
          starts_at: form.new_event_date || null,
        })
        .select().single()
      if (eventError) { setError(eventError.message); setLaunching(false); return }
      eventId = newEvent.id
      setEvents(prev => [newEvent, ...prev])
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('audit_sessions')
      .insert({
        org_id: orgId,
        event_id: eventId || null,
        status: 'active',
        attendance: form.attendance ? parseInt(form.attendance) : null,
        delivery_context: form.delivery_context,
      })
      .select().single()

    if (sessionError) { setError(sessionError.message); setLaunching(false); return }

    const token = sessionData.session_token
    const auditUrl = `${window.location.origin}/audit/${token}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(auditUrl)}`
    setActiveSession({ token, qrUrl })
    setSessions(prev => [sessionData as unknown as Session, ...prev])
    setShowForm(false)
    setLaunching(false)
  }

  async function markComplete(sessionId: string) {
    setClosingId(sessionId)
    await supabase
      .from('audit_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId)
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'completed' } : s))
    setClosingId(null)
  }

  async function updateAttendance(sessionId: string, attendance: number) {
    await supabase.from('audit_sessions').update({ attendance }).eq('id', sessionId)
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, attendance } : s))
  }

  const activeSessions = sessions.filter(s => s.status === 'active')
  const totalSeasonAttendance = sessions.reduce((sum, s) => sum + (s.attendance || 0), 0)

  // ── Colour resolution ───────────────────────────────────────────────────────
  const accent    = org?.club_colour_primary || BLUE     // primary subtle accent
  const accent2   = org?.club_colour_secondary || COPPER // secondary subtle accent

  const btnPrimary: React.CSSProperties = { background: BLUE, color: '#FFFFFF', fontSize: 14, fontWeight: 600, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }
  const btnNeutral: React.CSSProperties = { background: 'rgba(8,18,22,0.06)', color: INK, fontSize: 14, fontWeight: 500, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div style={{ color: SLATE, fontSize: 13 }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <main className="pb-16">
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '36px 24px' }}>

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="font-bold tracking-tight mb-1" style={{ fontSize: 26, color: INK, letterSpacing: '-0.02em' }}>Capture</h1>
              <p style={{ fontSize: 14, color: SLATE }}>Launch a session to capture evidence of sponsor deliverables in the field.</p>
            </div>
            <button onClick={() => { setShowForm(true); setActiveSession(null) }} style={btnPrimary}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0E6AE0')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = BLUE)}>
              Launch session
            </button>
          </div>

          {/* Active sessions — shown at top, in-brand emphasis */}
          {activeSessions.length > 0 && (
            <div className="mb-8">
              <h2 style={{ ...sectionHead, marginBottom: 12 }}>Active sessions</h2>
              <div className="space-y-3">
                {activeSessions.map(session => (
                  <div key={session.id}
                    style={{ background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${accent}`, borderRadius: 16, padding: '20px 24px' }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3">
                        <span className="mt-1.5 flex-shrink-0" style={{ width: 8, height: 8, borderRadius: '50%', background: accent2 }} />
                        <div>
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-medium" style={{ color: INK }}>{session.events?.title || 'No event linked'}</p>
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                              style={{ background: accent, color: textOnColour(accent) }}>Active</span>
                          </div>
                          <p className="text-xs" style={{ color: SLATE }}>
                            {DELIVERY_CONTEXTS.find(c => c.value === session.delivery_context)?.label || 'Match day'}
                            {' · '}
                            {new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <a href={`/audit/${session.session_token}`} style={btnPrimary}
                          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#0E6AE0')}
                          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = BLUE)}>
                          Open field mode →
                        </a>
                        <button onClick={() => markComplete(session.id)} disabled={closingId === session.id}
                          style={{ ...btnNeutral, opacity: closingId === session.id ? 0.5 : 1 }}>
                          {closingId === session.id ? 'Closing...' : 'Mark complete'}
                        </button>
                      </div>
                    </div>

                    {/* Attendance inline */}
                    <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <label className="text-xs whitespace-nowrap" style={{ color: SLATE }}>Attendance</label>
                      <input type="number" style={{ ...inpStyle, width: 96, padding: '6px 12px' }} placeholder="0"
                        defaultValue={session.attendance || ''}
                        onBlur={e => { const val = parseInt(e.target.value); if (!isNaN(val)) updateAttendance(session.id, val) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Season attendance total */}
          {totalSeasonAttendance > 0 && (
            <div style={{ ...CARD, marginBottom: 24 }} className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: SLATE }}>Season attendance total</p>
                <p className="text-3xl font-bold" style={{ color: INK }}>{totalSeasonAttendance.toLocaleString('nb-NO')}</p>
              </div>
              <p className="text-sm max-w-xs text-right" style={{ color: SLATE }}>Used automatically in your Proof Pack audience calculations</p>
            </div>
          )}

          {/* QR — session active confirmation */}
          {activeSession && (
            <div style={{ ...CARD, marginBottom: 32 }} className="text-center">
              <div className="inline-block rounded-xl p-6 mb-6" style={{ background: INK }}>
                <img src={activeSession.qrUrl} alt="Capture session QR code" className="w-48 h-48 mx-auto" />
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: INK }}>Session active</h2>
              <p className="text-sm mb-4" style={{ color: SLATE }}>Scan this QR code on your phone to open Capture field mode</p>
              <div className="rounded-lg px-4 py-3 mb-6" style={{ background: BG }}>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: SLATE }}>Direct link</p>
                <a href={`/audit/${activeSession.token}`} className="text-sm font-medium break-all" style={{ color: INK }}>
                  {typeof window !== 'undefined' ? window.location.origin : ''}/audit/{activeSession.token}
                </a>
              </div>
              <button onClick={() => setActiveSession(null)} style={btnNeutral}>Done</button>
            </div>
          )}

          {/* Launch form */}
          {showForm && (
            <div style={{ ...CARD, marginBottom: 32 }}>
              <h2 className="text-lg font-bold mb-6" style={{ color: INK }}>Launch session</h2>
              {error && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0"><path d="M8 2v7M8 11v2" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <p style={{ fontSize: 13, color: '#92400E' }}>{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label style={lblStyle}>Session type</label>
                <select style={inpStyle} value={form.delivery_context} onChange={e => update('delivery_context', e.target.value)}>
                  {DELIVERY_CONTEXTS.map(ctx => <option key={ctx.value} value={ctx.value}>{ctx.label}</option>)}
                </select>
                <p className="text-xs mt-1" style={{ color: SLATE }}>Only deliverables matching this context will be available to capture in this session</p>
              </div>

              <div className="mb-6">
                <label style={lblStyle}>Link to an event (optional)</label>
                <select style={inpStyle} value={form.event_id} onChange={e => update('event_id', e.target.value)}>
                  <option value="">No event linked</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}{e.venue ? ` — ${e.venue}` : ''}</option>)}
                </select>
              </div>

              {!form.event_id && (
                <div className="pt-6 mb-6" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <p className="text-sm mb-4" style={{ color: SLATE }}>Or create a new event:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label style={lblStyle}>Event name</label>
                      <input style={inpStyle} placeholder="vs Brann — Eliteserien" value={form.new_event_title} onChange={e => update('new_event_title', e.target.value)} />
                    </div>
                    <div>
                      <label style={lblStyle}>Venue</label>
                      <input style={inpStyle} placeholder="Color Line Stadion" value={form.new_event_venue} onChange={e => update('new_event_venue', e.target.value)} />
                    </div>
                    <div>
                      <label style={lblStyle}>Date</label>
                      <input type="date" style={inpStyle} value={form.new_event_date} onChange={e => update('new_event_date', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 mb-6" style={{ borderTop: `1px solid ${BORDER}` }}>
                <label style={lblStyle}>Attendance</label>
                <input type="number" style={{ ...inpStyle, maxWidth: 240 }} placeholder="600" value={form.attendance} onChange={e => update('attendance', e.target.value)} />
                <p className="text-xs mt-1" style={{ color: SLATE }}>Tallied across all sessions for your Proof Pack</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handleLaunch} disabled={launching} style={{ ...btnPrimary, opacity: launching ? 0.5 : 1 }}
                  onMouseEnter={e => { if (!launching) (e.currentTarget as HTMLButtonElement).style.background = '#0E6AE0' }}
                  onMouseLeave={e => { if (!launching) (e.currentTarget as HTMLButtonElement).style.background = BLUE }}>
                  {launching ? 'Launching...' : 'Generate QR code'}
                </button>
                <button onClick={() => { setShowForm(false); setError(null) }} style={btnNeutral}>Cancel</button>
              </div>
            </div>
          )}

          {/* Session history */}
          {sessions.filter(s => s.status !== 'active').length > 0 && (
            <div>
              <h2 style={{ ...sectionHead, marginBottom: 16 }}>Session history</h2>
              <div className="space-y-3">
                {sessions.filter(s => s.status !== 'active').map(session => (
                  <div key={session.id} style={CARD}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-medium" style={{ color: INK }}>{session.events?.title || 'No event linked'}</p>
                        <p className="text-xs mt-0.5" style={{ color: SLATE }}>
                          {DELIVERY_CONTEXTS.find(c => c.value === session.delivery_context)?.label || 'Match day'}
                          {' · '}
                          {new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className="text-xs whitespace-nowrap" style={{ color: SLATE }}>Attendance</label>
                          <input type="number" style={{ ...inpStyle, width: 96, padding: '6px 12px' }} placeholder="0"
                            defaultValue={session.attendance || ''}
                            onBlur={e => { const val = parseInt(e.target.value); if (!isNaN(val)) updateAttendance(session.id, val) }} />
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize" style={{ background: 'rgba(8,18,22,0.06)', color: SLATE }}>
                          {session.status}
                        </span>
                        <a href={`/audit/${session.session_token}`} className="text-sm transition-colors" style={{ color: SLATE }}
                          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = INK)}
                          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = SLATE)}>Open →</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state — no sessions at all */}
          {sessions.length === 0 && !showForm && (
            <div style={{ ...CARD, padding: '40px 24px' }} className="text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: accent + '14' }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="6" width="16" height="12" rx="2" stroke={accent} strokeWidth="1.5"/><circle cx="10" cy="12" r="3" stroke={accent} strokeWidth="1.5"/><path d="M7 6l1.2-2h3.6L13 6" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: INK }}>No capture sessions yet</p>
              <p className="text-sm mb-4" style={{ color: SLATE }}>Launch your first session to start capturing evidence in the field.</p>
              <button onClick={() => { setShowForm(true); setActiveSession(null) }} style={btnPrimary}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0E6AE0')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = BLUE)}>
                Launch session
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
