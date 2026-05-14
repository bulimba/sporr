'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type OrgData = {
  id: string
  name: string
  tier: string
  sport: string | null
  division: string | null
  country: string | null
}

type UserData = {
  id: string
  full_name: string | null
  email: string | null
  role: string
}

export default function ClubPage() {
  const router = useRouter()
  const supabase = createClient()

  const [org, setOrg] = useState<OrgData | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', sport: '', division: '', country: 'NO',
  })

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: userData } = await supabase.from('users').select('id, org_id, full_name, email, role').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }

      setUser(userData as UserData)
      setOrgId(userData.org_id)

      const { data: orgData } = await supabase.from('organisations').select('id, name, tier, sport, division, country').eq('id', userData.org_id).single()
      if (orgData) {
        setOrg(orgData as OrgData)
        setForm({
          name: orgData.name || '',
          sport: (orgData as any).sport || '',
          division: (orgData as any).division || '',
          country: (orgData as any).country || 'NO',
        })
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!orgId) return
    setSaving(true)
    setError(null)
    setSaved(false)

    const { error: saveError } = await supabase
      .from('organisations')
      .update({ name: form.name, country: form.country })
      .eq('id', orgId)

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    setOrg(prev => prev ? { ...prev, name: form.name, country: form.country } : null)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

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
        <Link href="/dashboard">
          <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" />
        </Link>
        <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">← Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-10">
          <h1 className="text-sporr-dark text-2xl font-medium mb-1">Your club</h1>
          <p className="text-sporr-muted text-sm">Club profile and account settings</p>
        </div>

        {/* Club profile */}
        <div className="card mb-6">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Club profile</h2>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>}
          {saved && <div className="bg-sporr-sage-lt border border-sporr-sage text-sporr-dark text-sm rounded-lg px-4 py-3 mb-6">✓ Changes saved</div>}

          <div className="space-y-4 mb-6">
            <div>
              <label className="label">Club name</label>
              <input className="input" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Sport</label>
                <input className="input" placeholder="Football, handball, volleyball..." value={form.sport} onChange={e => update('sport', e.target.value)} />
              </div>
              <div>
                <label className="label">Division or level</label>
                <input className="input" placeholder="Eliteserien, Division 1..." value={form.division} onChange={e => update('division', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Country</label>
              <select className="input" value={form.country} onChange={e => update('country', e.target.value)}>
                <option value="NO">Norway</option>
                <option value="SE">Sweden</option>
                <option value="DK">Denmark</option>
                <option value="FI">Finland</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="NZ">New Zealand</option>
                <option value="DE">Germany</option>
                <option value="NL">Netherlands</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        {/* Account info */}
        <div className="card mb-6">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Your account</h2>
          <div className="space-y-3">
            {[
              ['Name', user?.full_name || '—'],
              ['Email', user?.email || '—'],
              ['Role', user?.role || '—'],
              ['Plan', org?.tier || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-sporr-sage-lt last:border-0">
                <span className="text-sporr-muted text-sm">{label}</span>
                <span className="text-sporr-dark text-sm font-medium capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card border-red-100">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">Account</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sporr-dark text-sm font-medium">Sign out</p>
                <p className="text-sporr-muted text-xs mt-0.5">Sign out of your Sporr account on this device</p>
              </div>
              <button onClick={handleSignOut} className="btn-secondary text-sm py-2 px-4">Sign out</button>
            </div>
            <div className="border-t border-sporr-sage-lt pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sporr-dark text-sm font-medium">Request data deletion</p>
                  <p className="text-sporr-muted text-xs mt-0.5">To delete your account and all data, contact us</p>
                </div>
                <a href="mailto:privacy@sporr.io" className="btn-secondary text-sm py-2 px-4">Contact us</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
