'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

const DELIVERY_CONTEXTS = [
  { value: 'match_day', label: 'Match day' },
  { value: 'training', label: 'Training' },
  { value: 'digital', label: 'Digital' },
  { value: 'season_long', label: 'Season long' },
  { value: 'event', label: 'Event' },
]

export default function AuditPage() {
  const router = useRouter()
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [activeSession, setActiveSession] = useState<{ token: string; qrUrl: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
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

      const [eventsRes, sessionsRes] = await Promise.all([
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

  if (loading) {
    return (
      <main className="min-h-screen bg-sporr-cream flex items-center justify-center">
        <div className="text-sporr-muted text-sm">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sporr-cream">
      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard">
          <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" />
        </Link>
        <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">← Dashboard</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-sporr-dark text-2xl font-medium mb-1">Sessions</h1>
            <p className="text-sporr-muted text-sm">Capture proof of match days, events, and other obligations</p>
          </div>
          <button onClick={() => { setShowForm(true); setActiveSession(null) }} className="btn-primary">
            Launch session
          </button>
        </div>

        {/* PROMINENT: Active sessions — shown at top, impossible to miss */}
        {activeSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-3">
              Active sessions
            </h2>
            <div className="space-y-3">
              {activeSessions.map(session => (
                <div
                  key={session.id}
                  className="rounded-2xl border-2 border-sporr-accent px-6 py-5"
                  style={{ backgroundColor: '#FFF5F5' }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-sporr-accent mt-1.5 flex-shrink-0 animate-pulse" />
                      <div>
                        <p className="text-sporr-dark font-medium">
                          {session.events?.title || 'No event linked'}
                        </p>
                        <p className="text-sporr-muted text-xs mt-0.5">
                          {DELIVERY_CONTEXTS.find(c => c.value === session.delivery_context)?.label || 'Match day'}
                          {' · '}
                          {new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={`/audit/${session.session_token}`}
                        className="bg-sporr-dark text-sporr-cream text-sm font-medium px-4 py-2 rounded-lg hover:bg-sporr-surface transition-colors"
                      >
                        Open field mode →
                      </a>
                      <button
                        onClick={() => markComplete(session.id)}
                        disabled={closingId === session.id}
                        className="bg-white border border-sporr-sage-lt text-sporr-dark text-sm font-medium px-4 py-2 rounded-lg hover:border-sporr-dark transition-colors disabled:opacity-50"
                      >
                        {closingId === session.id ? 'Closing...' : 'Mark complete'}
                      </button>
                    </div>
                  </div>

                  {/* Attendance inline */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-red-100">
                    <label className="text-sporr-muted text-xs whitespace-nowrap">Attendance</label>
                    <input
                      type="number"
                      className="border border-sporr-sage-lt rounded-lg px-3 py-1.5 text-sm w-24 text-sporr-dark focus:outline-none focus:border-sporr-dark bg-white"
                      placeholder="0"
                      defaultValue={session.attendance || ''}
                      onBlur={e => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val)) updateAttendance(session.id, val)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalSeasonAttendance > 0 && (
          <div className="card mb-6 flex items-center justify-between">
            <div>
              <p className="text-sporr-muted text-xs uppercase tracking-widest mb-1">Season attendance total</p>
              <p className="text-sporr-dark text-3xl font-medium">{totalSeasonAttendance.toLocaleString()}</p>
            </div>
            <p className="text-sporr-muted text-sm max-w-xs text-right">Used automatically in your Proof Pack audience calculations</p>
          </div>
        )}

        {activeSession && (
          <div className="card mb-8 text-center">
            <div className="bg-sporr-dark rounded-xl p-6 mb-6 inline-block">
              <img src={activeSession.qrUrl} alt="Audit QR code" className="w-48 h-48 mx-auto" />
            </div>
            <h2 className="text-sporr-dark text-lg font-medium mb-2">Session active</h2>
            <p className="text-sporr-muted text-sm mb-4">Scan this QR code on your phone to open the field auditor</p>
            <div className="bg-sporr-light rounded-lg px-4 py-3 mb-6">
              <p className="text-sporr-muted text-xs uppercase tracking-widest mb-1">Direct link</p>
              <a href={`/audit/${activeSession.token}`} className="text-sporr-dark text-sm font-medium break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}/audit/{activeSession.token}
              </a>
            </div>
            <button onClick={() => setActiveSession(null)} className="btn-secondary">Done</button>
          </div>
        )}

        {showForm && (
          <div className="card mb-8">
            <h2 className="text-sporr-dark text-lg font-medium mb-6">Launch session</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>}

            <div className="mb-6">
              <label className="label">Session type</label>
              <select className="input" value={form.delivery_context} onChange={e => update('delivery_context', e.target.value)}>
                {DELIVERY_CONTEXTS.map(ctx => (
                  <option key={ctx.value} value={ctx.value}>{ctx.label}</option>
                ))}
              </select>
              <p className="text-sporr-muted text-xs mt-1">Only obligations with this delivery context will be delivered in this session</p>
            </div>

            <div className="mb-6">
              <label className="label">Link to an event (optional)</label>
              <select className="input" value={form.event_id} onChange={e => update('event_id', e.target.value)}>
                <option value="">No event linked</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.title}{e.venue ? ` — ${e.venue}` : ''}</option>)}
              </select>
            </div>

            {!form.event_id && (
              <div className="border-t border-sporr-sage-lt pt-6 mb-6">
                <p className="text-sporr-muted text-sm mb-4">Or create a new event:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Event name</label>
                    <input className="input" placeholder="vs Brann — Eliteserien" value={form.new_event_title} onChange={e => update('new_event_title', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Venue</label>
                    <input className="input" placeholder="Color Line Stadion" value={form.new_event_venue} onChange={e => update('new_event_venue', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input type="date" className="input" value={form.new_event_date} onChange={e => update('new_event_date', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-sporr-sage-lt pt-6 mb-6">
              <label className="label">Attendance</label>
              <input type="number" className="input max-w-xs" placeholder="600" value={form.attendance} onChange={e => update('attendance', e.target.value)} />
              <p className="text-sporr-muted text-xs mt-1">Tallied across all sessions for your Proof Pack</p>
            </div>

            <div className="flex gap-3">
              <button onClick={handleLaunch} disabled={launching} className="btn-primary disabled:opacity-50">
                {launching ? 'Launching...' : 'Generate QR code'}
              </button>
              <button onClick={() => { setShowForm(false); setError(null) }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Completed / other sessions */}
        {sessions.filter(s => s.status !== 'active').length > 0 && (
          <div>
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">Session history</h2>
            <div className="space-y-3">
              {sessions.filter(s => s.status !== 'active').map(session => (
                <div key={session.id} className="card">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sporr-dark font-medium">{session.events?.title || 'No event linked'}</p>
                      <p className="text-sporr-muted text-xs mt-0.5">
                        {DELIVERY_CONTEXTS.find(c => c.value === session.delivery_context)?.label || 'Match day'}
                        {' · '}
                        {new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-sporr-muted text-xs whitespace-nowrap">Attendance</label>
                        <input
                          type="number"
                          className="border border-sporr-sage-lt rounded-lg px-3 py-1.5 text-sm w-24 text-sporr-dark focus:outline-none focus:border-sporr-dark"
                          placeholder="0"
                          defaultValue={session.attendance || ''}
                          onBlur={e => {
                            const val = parseInt(e.target.value)
                            if (!isNaN(val)) updateAttendance(session.id, val)
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-sporr-light text-sporr-muted">
                        {session.status}
                      </span>
                      <a href={`/audit/${session.session_token}`} className="text-sporr-sage hover:text-sporr-dark text-sm transition-colors">Open →</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
