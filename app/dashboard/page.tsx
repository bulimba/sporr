'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Organisation = { id: string; name: string; tier: string }
type Stats = { sponsors: number; contracts: number; obligations_due: number }

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [org, setOrg] = useState<Organisation | null>(null)
  const [stats, setStats] = useState<Stats>({ sponsors: 0, contracts: 0, obligations_due: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      const { data: orgData } = await supabase.from('organisations').select('id, name, tier').eq('id', userData.org_id).single()
      setOrg(orgData)
      const [sponsorsRes, contractsRes, obligationsRes] = await Promise.all([
        supabase.from('sponsors').select('id', { count: 'exact' }).eq('org_id', userData.org_id),
        supabase.from('contracts').select('id', { count: 'exact' }).eq('org_id', userData.org_id).eq('status', 'active'),
        supabase.from('obligations').select('id', { count: 'exact' }).eq('org_id', userData.org_id).eq('status', 'pending'),
      ])
      setStats({ sponsors: sponsorsRes.count || 0, contracts: contractsRes.count || 0, obligations_due: obligationsRes.count || 0 })
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
    <main className="min-h-screen bg-sporr-cream">
      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" />
        <div className="flex items-center gap-6">
          <span className="text-sporr-cream text-sm capitalize">{org?.tier} plan</span>
          <button onClick={handleSignOut} className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">Sign out</button>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-sporr-dark text-2xl font-medium mb-1">{org?.name || 'Your dashboard'}</h1>
          <p className="text-sporr-muted text-sm">Welcome to your sponsorship dashboard</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="card">
            <p className="text-sporr-muted text-xs uppercase tracking-widest mb-2">Active sponsors</p>
            <p className="text-sporr-dark text-4xl font-medium">{stats.sponsors}</p>
          </div>
          <div className="card">
            <p className="text-sporr-muted text-xs uppercase tracking-widest mb-2">Active contracts</p>
            <p className="text-sporr-dark text-4xl font-medium">{stats.contracts}</p>
          </div>
          <div className="card border-l-4 border-l-sporr-dark">
            <p className="text-sporr-muted text-xs uppercase tracking-widest mb-2">Obligations pending</p>
            <p className="text-sporr-dark text-4xl font-medium">{stats.obligations_due}</p>
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/dashboard/sponsors" className="card hover:border-sporr-dark transition-colors text-left block">
              <p className="text-sporr-dark font-medium mb-1">Your sponsors</p>
              <p className="text-sporr-muted text-sm">View and manage your sponsor roster</p>
            </Link>
            <Link href="/dashboard/obligations" className="card hover:border-sporr-dark transition-colors text-left block">
              <p className="text-sporr-dark font-medium mb-1">Your obligations</p>
              <p className="text-sporr-muted text-sm">What you agreed to deliver and when</p>
            </Link>
            <Link href="/dashboard/audit" className="card hover:border-sporr-dark transition-colors text-left block">
              <p className="text-sporr-dark font-medium mb-1">Match day</p>
              <p className="text-sporr-muted text-sm">Photograph and confirm delivery</p>
            </Link>
          </div>
        </div>
        <div className="card">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Getting started</h2>
          <div className="space-y-4">
            {[
              { done: true, label: 'Create your account', sub: "You're in." },
              { done: stats.sponsors > 0, label: 'Add your first sponsor', sub: 'Add a company that supports your club.' },
              { done: stats.contracts > 0, label: 'Add your first obligation', sub: 'Tell Sporr what you agreed to deliver.' },
              { done: false, label: 'Capture your first proof', sub: 'Launch an audit session on match day.' },
              { done: false, label: 'Send your first Proof Pack', sub: 'Deliver timestamped evidence to your sponsor.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium ${item.done ? 'bg-sporr-dark text-sporr-cream' : 'bg-sporr-sage-lt text-sporr-muted'}`}>
                  {item.done ? '✓' : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-medium ${item.done ? 'text-sporr-muted line-through' : 'text-sporr-ink'}`}>{item.label}</p>
                  <p className="text-sporr-muted text-xs mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
