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
  events: { title: string } | null
}

export default function AuditPage() {
  const router = useRouter()
  const supabase = createClient()

  const [events, setEvents] = useState<Event[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [activeSession, setActiveSession] = useState<{ token: string, qrUrl: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    event_id: '',
    new_event_title: '',
    new_event_venue: '',
    new_event_date: '',
  })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
  if (!session) { router.push('/login'); return }
  if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return

        const { data: userData } = await supabase
          .from('users')
          .select('org_id')
          .eq('id', session.user.id)
          .single()

        if (!userData) { setLoading(false); return }

        setOrgId(userData.org_id)

        const [eventsRes, sessionsRes] = await Promise.all([
          supabase
            .from('events')
            .select('id, title, venue, starts_at')
            .eq('org_id', userData.org_id)
            .order('starts_at', { ascending: false }),
          supabase
            .from('audit_sessions')
            .select('id, session_token, status, created_at, events(title)')
            .eq('org_id', userData.org_id)
            .order('created_at', { ascending: false })
            .limit(10),
        ])

        setEvents(eventsRes.data || [])
        setSessions((sessionsRes.data as unknown as Session[]) || [])
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
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
        .select()
        .single()

      if (eventError) {
        setError(eventError.message)
        setLaunching(false)
        return
      }

      eventId = newEvent.id
      setEvents(prev => [newEvent, ...prev])
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('audit_sessions')
      .insert({
        org_id: orgId,
        event_id: eventId || null,
        status: 'active',
      })
      .select()
      .single()

    if (sessionError) {
      setError(sessionError.message)
      setLaunching(false)
      return
    }

    const token = sessionData.session_token
    const auditUrl = `${window.location.origin}/audit/${token}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(auditUrl)}`

    setActiveSession({ token, qrUrl })
    setSessions(prev => [sessionData as unknown as Session, ...prev])
    setShowForm(false)
    setLaunching(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-sporr-light flex items-center justify-center">
        <div className="text-sporr-muted text-sm">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sporr-light">
      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard">
          <span className="text-sporr-cream font-medium tracking-[0.2em] text-lg">SPORR</span>
        </Link>
        <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">
          ← Dashboard
        </Link>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-sporr-ink text-2xl font-medium mb-1">Audit sessions</h1>
            <p className="text-sporr-muted text-sm">Launch a session to capture proof on match day</p>
          </div>
          <button onClick={() => { setShowForm(true); setActiveSession(null) }} className="btn-primary">
            Launch session
          </button>
        </div>
{activeSession && (
          <div className="card mb-8 text-center border-sporr-sage">
            <div className="bg-sporr-dark rounded-xl p-6 mb-6 inline-block">
              <img
                src={activeSession.qrUrl}
                alt="Audit session QR code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <h2 className="text-sporr-ink text-lg font-medium mb-2">Session active</h2>
            <p className="text-sporr-muted text-sm mb-4">
              Scan this QR code on your phone to open the field auditor
            </p>
            <div className="bg-sporr-light rounded-lg px-4 py-3 mb-6">
              <p className="text-sporr-muted text-xs uppercase tracking-widest mb-1">Direct link</p>
              
                <a href={`/audit/${activeSession.token}`}
                target="_blank"
                className="text-sporr-dark text-sm font-medium hover:text-sporr-mid break-all"
              >
                {window.location.origin}/audit/{activeSession.token}
              </a>
            </div>
            <button onClick={() => setActiveSession(null)} className="btn-secondary">
              Done
            </button>
          </div>
        )}
        {showForm && (
          <div className="card mb-8">
            <h2 className="text-sporr-ink text-lg font-medium mb-6">Launch audit session</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}
            <div className="mb-6">
              <label className="label">Link to an existing event (optional)</label>
              <select
                className="input"
                value={form.event_id}
                onChange={e => update('event_id', e.target.value)}
              >
                <option value="">No event — or create one below</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.title}{e.venue ? ` — ${e.venue}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {!form.event_id && (
              <div className="border-t border-sporr-sage-lt pt-6">
                <p className="text-sporr-muted text-sm mb-4">Or create a new event:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Event name</label>
                    <input
                      className="input"
                      placeholder="vs Brann — Eliteserien"
                      value={form.new_event_title}
                      onChange={e => update('new_event_title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Venue</label>
                    <input
                      className="input"
                      placeholder="Color Line Stadion"
                      value={form.new_event_venue}
                      onChange={e => update('new_event_venue', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input
                      type="date"
                      className="input"
                      value={form.new_event_date}
                      onChange={e => update('new_event_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="btn-primary disabled:opacity-50"
              >
                {launching ? 'Launching...' : 'Generate QR code'}
              </button>
              <button
                onClick={() => { setShowForm(false); setError(null) }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {sessions.length > 0 && (
          <div>
            <h2 className="text-sporr-ink text-sm font-medium uppercase tracking-widest mb-4">
              Recent sessions
            </h2>
            <div className="space-y-3">
              {sessions.map(session => (
                <div key={session.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sporr-ink font-medium">
                        {session.events?.title || 'No event linked'}
                      </p>
                      <p className="text-sporr-muted text-xs mt-0.5">
                        {new Date(session.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        session.status === 'active' ? 'bg-sporr-sage-lt text-sporr-dark' :
                        session.status === 'completed' ? 'bg-sporr-light text-sporr-muted' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {session.status}
                      </span>
                      
                        <a href={`/audit/${session.session_token}`}
                        target="_blank"
                        className="text-sporr-sage hover:text-sporr-dark text-sm transition-colors"
                      >
                        Open →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}      </div>
    </main>
  )
}
