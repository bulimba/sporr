'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Sponsor = {
  id: string
  company_name: string
}

type Contract = {
  id: string
  title: string
  value_nok: number
  season: string
  status: string
  start_date: string
  end_date: string
  sponsors: { company_name: string }
}

export default function ContractsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    sponsor_id: '',
    value_nok: '',
    season: '2025-2026',
    start_date: '',
    end_date: '',
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

        const [contractsRes, sponsorsRes] = await Promise.all([
          supabase
            .from('contracts')
            .select('id, title, value_nok, season, status, start_date, end_date, sponsors(company_name)')
            .eq('org_id', userData.org_id)
            .order('created_at', { ascending: false }),
          supabase
            .from('sponsors')
            .select('id, company_name')
            .eq('org_id', userData.org_id)
            .order('company_name'),
        ])

        setContracts((contractsRes.data as unknown as Contract[]) || [])
        setSponsors(sponsorsRes.data || [])
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function handleSave() {
    if (!form.title) { setError('Contract title is required'); return }
    if (!form.sponsor_id) { setError('Please select a sponsor'); return }
    if (!orgId) return

    setSaving(true)
    setError(null)

    const { data, error: saveError } = await supabase
      .from('contracts')
      .insert({
        org_id: orgId,
        sponsor_id: form.sponsor_id,
        title: form.title,
        value_nok: form.value_nok ? parseFloat(form.value_nok) : 0,
        season: form.season,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: 'active',
      })
      .select('id, title, value_nok, season, status, start_date, end_date, sponsors(company_name)')
      .single()

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    setContracts(prev => [data as unknown as Contract, ...prev])
    setForm({ title: '', sponsor_id: '', value_nok: '', season: '2025-2026', start_date: '', end_date: '' })
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
          <img
  src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
  alt="Sporr"
  className="h-20"
/>
        </Link>
        <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">
  ← Dashboard
</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-sporr-ink text-2xl font-medium mb-1">Contracts</h1>
            <p className="text-sporr-muted text-sm">{contracts.length} contract{contracts.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            New contract
          </button>
        </div>

        {showForm && (
          <div className="card mb-8">
            <h2 className="text-sporr-ink text-lg font-medium mb-6">New contract</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}

            {sponsors.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6">
                You need to add a sponsor before creating a contract.{' '}
                <Link href="/dashboard/sponsors" className="underline">Add a sponsor</Link>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="label">Contract title</label>
                <input
                  className="input"
                  placeholder="2025/26 Season Partnership"
                  value={form.title}
                  onChange={e => update('title', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Sponsor</label>
                <select
                  className="input"
                  value={form.sponsor_id}
                  onChange={e => update('sponsor_id', e.target.value)}
                >
                  <option value="">Select a sponsor...</option>
                  {sponsors.map(s => (
                    <option key={s.id} value={s.id}>{s.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Total value (NOK)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="50000"
                  value={form.value_nok}
                  onChange={e => update('value_nok', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Season</label>
                <input
                  className="input"
                  placeholder="2025-2026"
                  value={form.season}
                  onChange={e => update('season', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Start date</label>
                <input
                  type="date"
                  className="input"
                  value={form.start_date}
                  onChange={e => update('start_date', e.target.value)}
                />
              </div>
              <div>
                <label className="label">End date</label>
                <input
                  type="date"
                  className="input"
                  value={form.end_date}
                  onChange={e => update('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || sponsors.length === 0} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving...' : 'Save contract'}
              </button>
              <button onClick={() => { setShowForm(false); setError(null) }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {contracts.length === 0 && !showForm ? (
          <div className="card text-center py-16">
            <p className="text-sporr-muted text-lg mb-2">No contracts yet</p>
            <p className="text-sporr-muted text-sm mb-6">Create your first contract to start tracking obligations</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Create first contract
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map(contract => (
              <div key={contract.id} className="card hover:border-sporr-sage transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sporr-ink font-medium">{contract.title}</p>
                    <p className="text-sporr-muted text-sm mt-0.5">
                      {contract.sponsors?.company_name}
                      {contract.season && <span> · {contract.season}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    {contract.value_nok > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-sporr-muted uppercase tracking-widest mb-1">Value</p>
                        <p className="text-sporr-dark font-medium text-sm">
                          Kr {contract.value_nok.toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-sporr-muted uppercase tracking-widest mb-1">Status</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        contract.status === 'active' ? 'bg-sporr-sage-lt text-sporr-dark' :
                        contract.status === 'draft' ? 'bg-sporr-light text-sporr-muted' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {contract.status}
                      </span>
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
