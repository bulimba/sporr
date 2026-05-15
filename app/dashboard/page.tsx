'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Organisation = { id: string; name: string; tier: string; sport?: string }
type Stats = { sponsors: number; sessions: number; obligations_pending: number }

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [org, setOrg] = useState<Organisation | null>(null)
  const [stats, setStats] = useState<Stats>({ sponsors: 0, sessions: 0, obligations_pending: 0 })
  const [activeSession, setActiveSession] = useState<{ id: string; token: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [nextDueDate, setNextDueDate] = useState<{ date: string; sponsor: string } | null>(null)
  const currentSeason = '2025/26'

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: userData } = await supabase.from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }

      const { data: orgData } = await supabase.from('organisations').select('id, name, tier').eq('id', userData.org_id).single()
      setOrg(orgData)

      const [sponsorsRes, sessionsRes, obligationsRes, activeSessionRes, contractsRes] = await Promise.all([
        supabase.from('sponsors').select('id', { count: 'exact' }).eq('org_id', userData.org_id),
        supabase.from('audit_sessions').select('id', { count: 'exact' }).eq('org_id', userData.org_id),
        supabase.from('obligations').select('id', { count: 'exact' }).eq('org_id', userData.org_id).eq('status', 'pending'),
        supabase.from('audit_sessions').select('id, session_token').eq('org_id', userData.org_id).eq('status', 'active').order('created_at', { ascending: false }).limit(1),
        supabase.from('contracts').select('end_date, sponsors(company_name)').eq('org_id', userData.org_id).eq('status', 'active').not('end_date', 'is', null).order('end_date', { ascending: true }).limit(1),
      ])

      setStats({
        sponsors: sponsorsRes.count || 0,
        sessions: sessionsRes.count || 0,
        obligations_pending: obligationsRes.count || 0,
      })

      if (activeSessionRes.data && activeSessionRes.data.length > 0) {
        setActiveSession({ id: activeSessionRes.data[0].id, token: activeSessionRes.data[0].session_token })
      }

      if (contractsRes.data && contractsRes.data.length > 0) {
        const contract = contractsRes.data[0] as any
        if (contract.end_date) {
          const endDate = new Date(contract.end_date)
          const formatted = endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          setNextDueDate({ date: formatted, sponsor: contract.sponsors?.company_name || '' })
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-sporr-cream flex items-center justify-center">
        <div className="text-sporr-muted text-sm">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sporr-cream flex flex-col">

      {/* Nav */}
      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" />
        <div className="flex items-center gap-6">
          <span className="text-sporr-cream text-sm capitalize">{org?.tier} plan</span>
          <button onClick={handleSignOut} className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 flex-1 w-full flex flex-col">

        {/* Header strip */}
        <div className="mb-10">
          <h1 className="text-sporr-dark text-3xl font-medium mb-2">{org?.name || 'Your club'}</h1>
          <div className="flex items-center gap-2 text-sporr-muted text-sm flex-wrap">
            <span>Season <strong className="text-sporr-dark">{currentSeason}</strong></span>
            <span className="text-sporr-sage-lt">·</span>
            <span><strong className="text-sporr-dark">{stats.sessions}</strong> session{stats.sessions !== 1 ? 's' : ''} logged</span>
            <span className="text-sporr-sage-lt">·</span>
            <span><strong className="text-sporr-dark">{stats.sponsors}</strong> active sponsor{stats.sponsors !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Quick actions label */}
        <p className="text-sporr-muted text-xs font-medium uppercase tracking-widest mb-4">Quick actions</p>

        {/* Three action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 flex-1">

          {/* Your sponsors */}
          <Link href="/dashboard/sponsors" className="bg-white rounded-2xl border border-sporr-sage-lt p-6 hover:border-sporr-dark transition-colors flex flex-col">
            <h2 className="text-sporr-dark text-2xl font-medium mb-3">Your sponsors</h2>
            <p className="text-sporr-muted text-base leading-relaxed flex-1">
              Add and manage the sponsors supporting your club.
            </p>
            <div className="border-t border-sporr-sage-lt mt-6 pt-4">
              <Link href="/dashboard/obligations" className="flex items-center gap-2 text-sporr-muted text-sm hover:text-sporr-dark transition-colors">
                Manage obligations →
              </Link>
            </div>
          </Link>

          {/* Today's event — featured */}
          <div className="bg-white rounded-2xl border-2 border-sporr-dark p-6 flex flex-col">
            <h2 className="text-sporr-dark text-2xl font-medium mb-3">Today's event</h2>
            <p className="text-sporr-muted text-base leading-relaxed flex-1">
              Capture and store proof of match days and events.
            </p>
            <div className="border-t border-sporr-sage-lt mt-6 pt-4">
              <Link href="/dashboard/audit" className="bg-sporr-dark text-sporr-cream text-sm font-medium px-4 py-2 rounded-lg hover:bg-sporr-mid transition-colors whitespace-nowrap">
                {activeSession ? 'Start session →' : 'Start session →'}
              </Link>
            </div>
          </div>

          {/* Your club */}
          <Link href="/dashboard/club" className="bg-white rounded-2xl border border-sporr-sage-lt p-6 hover:border-sporr-dark transition-colors flex flex-col">
            <h2 className="text-sporr-dark text-2xl font-medium mb-3">Your club</h2>
            <p className="text-sporr-muted text-base leading-relaxed flex-1">
              Manage your club profile and administrator access.
            </p>
          </Link>

        </div>

        {/* Proof Pack banner */}
        <Link href="/proof-pack" className="bg-sporr-dark rounded-2xl px-6 py-5 flex items-center justify-between hover:bg-sporr-mid transition-colors mt-auto">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sporr-cream text-xs uppercase tracking-widest mb-0.5">Proof Pack</p>
              <p className="text-sporr-cream font-medium">
                {nextDueDate
                  ? `Next Proof of Performance Report · due ${nextDueDate.date}`
                  : stats.sessions > 0
                  ? "Send your sponsor's Proof Pack"
                  : 'Generate your first Proof Pack when ready'}
              </p>
            </div>
          </div>
          <span className="text-sporr-cream font-medium whitespace-nowrap ml-6">Send Proof Pack →</span>
        </Link>

      </div>
    </main>
  )
}
