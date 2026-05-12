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
        <Link href="/dashboard" className="text-sporr-sage hover:text-sporr-cream text-sm transition-colors">
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
              
                href={`/audit/${activeSession.token}`}
                target="_blank"
