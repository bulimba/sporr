'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Organisation = {
  id: string
  name: string
  tier: string
}

type Stats = {
  sponsors: number
  contracts: number
  obligations_due: number
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [org, setOrg] = useState<Organisation | null>(null)
  const [stats, setStats] = useState<Stats>({ sponsors: 0, contracts: 0, obligations_due: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const user = session.user

      const { data: userData } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (!userData) {
        setLoading(false)
        return
      }

      const { data: orgData } = await supabase
        .from('organisations')
        .select('id, name, tier')
        .eq('id', userData.org_id)
        .single()

      setOrg(orgData)

      const [sponsorsRes, contractsRes, obligationsRes] = await Promise.all([
        supabase.from('sponsors').select('id', { count: 'exact' }).eq('org_id', userData.org_id),
        supabase.from('contracts').select('id', { count: 'exact' }).eq('org_id', userData.org_id).eq('status', 'active'),
        supabase.from('obligations').select('id', { count: 'exact' }).eq('org_id', userData.org_id).eq('status', 'pending'),
      ])

      setStats({
        sponsors: sponsorsRes.count || 0,
        contracts: contractsRes.count || 0,
        obligations_due: obligationsRes.count || 0,
      })

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
      <main className="min-h-screen bg-sporr-light flex items-center justify-center">
        <div className="text-sporr-muted text-sm">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sporr-light">

      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <span className="text-sporr-cream font-medium tracking-[0.2em] text-lg">
          SPORR
        </span>
        <div className="flex items-center gap-6">
          <span className="text-sporr-sage text-sm capitalize">
            {org?.tier} plan
          </span>
          <button
            onClick={handleSignOut}
            className="text-sporr-muted hover:text-sporr-cream text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-10">
          <h1 className="text-sporr-ink text-2xl font-medium mb-1">
            {org?.name || 'Your dashboard'}
          </h1>
          <p className="text-sporr-muted text-sm">
            Welcome t
