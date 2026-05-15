'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Sponsor = {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string | null
  industry: string | null
  health_score: number
}

export default function SponsorsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgTier, setOrgTier] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    industry: '',
    notes: '',
  })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: userData } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', session.user.id)
        .single()

      if (!userData) { setLoading(false); return }

      setOrgId(userData.org_id)

      const { data: orgData } = await supabase
        .from('organisations')
        .select('tier')
        .eq('id', userData.org_id)
        .single()

      setOrgTier(orgData?.tier || 'free')

      const { data: sponsorsData } = await supabase
        .from('sponsors')
        .select('id, company_name, contact_name, contact_email, industry, health_score')
        .eq('org_id', userData.org_id)
        .order('company_name')

      setSponsors(sponsorsData || [])
      setLoading(false)
    }
    load()
  }, [])

  const isFree = orgTier === 'free'
  const atSponsorLimit = isFree && sponsors.length >= 1

  async function handleAddSponsor() {
    if (!form.company_name) { setError('Company name is required'); return }
    if (!orgId) return
    if (atSponsorLimit) {
      setError('Free plan is limited to 1 sponsor. Upgrade to add more.')
      return
    }

    setSaving(true)
    setError(null)

    const { data, error: saveError } = await supabase
      .from('sponsors')
      .insert({
        org_id: orgId,
        company_name: form.company_name,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        industry: form.industry || null,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    setSponsors(prev => [...prev, data])
    setForm({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', industry: '', notes: '' })
    setShowForm(false)
    setSaving(false)
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
          <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" />
        </Link>
        <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-sporr-ink text-2xl font-medium mb-1">Sponsors</h1>
            <p className="text-sporr-muted text-sm">{sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''}</p>
          </div>
          {atSponsorLimit ? (
            <Link href="/dashboard/club" className="btn-primary">
              Upgrade to add more →
            </Link>
          ) : (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add sponsor
            </button>
          )}
        </div>

        {/* Free tier limit banner */}
        {atSponsorLimit && (
          <div className="bg-sporr-dark rounded-2xl px-6 py-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sporr-cream text-sm font-medium mb-0.5">Free plan — 1 sponsor limit reached</p>
              <p className="text-sporr-sage text-xs">Upgrade to Club (Kr 490/mnd) to add unlimited sponsors at any tier.</p>
            </div>
            <Link href="/dashboard/club" className="bg-sporr-cream text-sporr-dark text-xs font-medium px-4 py-2 rounded-lg hover:bg-sporr-sage-lt transition-colors whitespace-nowrap flex-shrink-0">
              Upgrade plan →
            </Link>
          </div>
        )}

        {/* Add sponsor form */}
        {showForm && !atSponsorLimit && (
          <div className="card mb-8 border-sporr-sage">
            <h2 className="text-sporr-ink text-lg font-medium mb-6">New sponsor</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Company name *</label>
                <input className="input" placeholder="Equinor ASA" value={form.company_name} onChange={e => update('company_name', e.target.value)} />
              </div>
              <div>
                <label className="label">Industry</label>
                <input className="input" placeholder="Energy, Finance, Property..." value={form.industry} onChange={e => update('industry', e.target.value)} />
              </div>
              <div>
                <label className="label">Contact name</label>
                <input className="input" placeholder="Marketing manager" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} />
              </div>
              <div>
                <label className="label">Contact email</label>
                <input type="email" className="input" placeholder="contact@company.no" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} />
              </div>
              <div>
                <label className="label">Contact phone</label>
                <input className="input" placeholder="+47..." value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} />
              </div>
            </div>
            <div className="mb-6">
              <label className="label">Notes</label>
              <textarea className="input h-20 resize-none" placeholder="Any notes about this sponsor..." value={form.notes} onChange={e => update('notes', e.target.value)} />
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddSponsor} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving...' : 'Save sponsor'}
              </button>
              <button onClick={() => { setShowForm(false); setError(null) }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sponsors list */}
        {sponsors.length === 0 && !showForm ? (
          <div className="card text-center py-16">
            <p className="text-sporr-muted text-lg mb-2">No sponsors yet</p>
            <p className="text-sporr-muted text-sm mb-6">Add your first sponsor to get started</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add your first sponsor
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sponsors.map(sponsor => (
              <div key={sponsor.id} className="card hover:border-sporr-sage transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sporr-ink font-medium">{sponsor.company_name}</p>
                    <p className="text-sporr-muted text-sm mt-0.5">
                      {sponsor.contact_name && <span>{sponsor.contact_name}</span>}
                      {sponsor.contact_name && sponsor.industry && <span> · </span>}
                      {sponsor.industry && <span>{sponsor.industry}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-sporr-muted uppercase tracking-widest mb-1">Health</p>
                      <p className={`text-sm font-medium ${
                        sponsor.health_score >= 70 ? 'text-sporr-dark' :
                        sponsor.health_score >= 40 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {sponsor.health_score}
                      </p>
                    </div>
                    <span className="text-sporr-muted text-lg">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
