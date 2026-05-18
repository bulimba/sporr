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
  contact_phone: string | null
  industry: string | null
  notes: string | null
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Sponsor>>({})
  const [savingEdit, setSavingEdit] = useState(false)

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

  const updateEdit = (field: string, value: string) =>
    setEditForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: userData } = await supabase
        .from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }

      setOrgId(userData.org_id)

      const { data: orgData } = await supabase
        .from('organisations').select('tier').eq('id', userData.org_id).single()
      setOrgTier(orgData?.tier || 'free')

      const { data: sponsorsData } = await supabase
        .from('sponsors')
        .select('id, company_name, contact_name, contact_email, contact_phone, industry, notes, health_score')
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
    if (atSponsorLimit) { setError('Free plan is limited to 1 sponsor. Upgrade to add more.'); return }

    setSaving(true); setError(null)

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
      .select().single()

    if (saveError) { setError(saveError.message); setSaving(false); return }

    setSponsors(prev => [...prev, data as Sponsor])
    setForm({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', industry: '', notes: '' })
    setShowForm(false); setSaving(false)
  }

  function startEdit(sponsor: Sponsor) {
    setEditingId(sponsor.id)
    setEditForm({
      company_name: sponsor.company_name,
      contact_name: sponsor.contact_name || '',
      contact_email: sponsor.contact_email || '',
      contact_phone: sponsor.contact_phone || '',
      industry: sponsor.industry || '',
      notes: sponsor.notes || '',
    })
  }

  async function handleSaveEdit(sponsorId: string) {
    setSavingEdit(true)
    const { error: updateError } = await supabase
      .from('sponsors')
      .update({
        company_name: editForm.company_name || '',
        contact_name: editForm.contact_name || null,
        contact_email: editForm.contact_email || null,
        contact_phone: editForm.contact_phone || null,
        industry: editForm.industry || null,
        notes: editForm.notes || null,
      })
      .eq('id', sponsorId)

    if (updateError) { alert(updateError.message); setSavingEdit(false); return }

    setSponsors(prev => prev.map(s =>
      s.id === sponsorId ? { ...s, ...editForm as Sponsor } : s
    ))
    setEditingId(null); setSavingEdit(false)
  }

  async function handleDelete(sponsorId: string) {
    setDeleting(true)
    // Delete linked contracts first (which cascade to obligations and proofs)
    await supabase.from('contracts').delete().eq('sponsor_id', sponsorId)
    // Then delete the sponsor
    const { error } = await supabase.from('sponsors').delete().eq('id', sponsorId)
    if (error) {
      alert('Could not delete sponsor: ' + error.message)
      setDeleting(false)
      return
    }
    setSponsors(prev => prev.filter(s => s.id !== sponsorId))
    setExpandedId(null); setConfirmDeleteId(null); setDeleting(false)
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
        <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">← Dashboard</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-sporr-dark text-2xl font-medium mb-1">Sponsors</h1>
            <p className="text-sporr-muted text-sm">{sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''}</p>
          </div>
          {atSponsorLimit ? (
            <Link href="/dashboard/club" className="btn-primary">Upgrade to add more →</Link>
          ) : (
            <button onClick={() => setShowForm(true)} className="btn-primary">Add sponsor</button>
          )}
        </div>

        {atSponsorLimit && (
          <div className="bg-sporr-dark rounded-2xl px-6 py-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sporr-cream text-sm font-medium mb-0.5">Free plan — 1 sponsor limit reached</p>
              <p className="text-sporr-sage text-xs">Upgrade to Club (490NOK/mnd) to add up to 5 sponsors.</p>
            </div>
            <Link href="/dashboard/club" className="bg-sporr-cream text-sporr-dark text-xs font-medium px-4 py-2 rounded-lg hover:bg-sporr-sage-lt transition-colors whitespace-nowrap flex-shrink-0">
              Upgrade plan →
            </Link>
          </div>
        )}

        {/* Add sponsor form */}
        {showForm && !atSponsorLimit && (
          <div className="card mb-8">
            <h2 className="text-sporr-dark text-lg font-medium mb-6">New sponsor</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
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
              <button onClick={() => { setShowForm(false); setError(null) }} className="btn-secondary">Cancel</button>
            </div>

            {/* Flow prompt — next logical step */}
            <div className="mt-6 pt-5 border-t border-sporr-sage-lt">
              <p className="text-sporr-muted text-xs uppercase tracking-widest mb-2">Next step</p>
              <p className="text-sporr-dark text-sm font-medium mb-1">Create a contract for this sponsor</p>
              <p className="text-sporr-muted text-xs leading-relaxed mb-3">
                A contract links your sponsor to a season, a package value, and the specific obligations they've paid for — like a banner, kit logo, or PA announcement.
              </p>
              <Link
                href="/dashboard/contracts"
                className="inline-flex items-center gap-2 text-sm font-medium text-sporr-dark underline underline-offset-2 hover:text-sporr-mid transition-colors"
              >
                Go to Contracts →
              </Link>
            </div>
          </div>
        )}

        {/* Sponsors list */}
        {sponsors.length === 0 && !showForm ? (
          <div className="card text-center py-16">
            <p className="text-sporr-muted text-lg mb-2">No sponsors yet</p>
            <p className="text-sporr-muted text-sm mb-6">Add your first sponsor to get started</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Add your first sponsor</button>
          </div>
        ) : (
          <div className="space-y-3">
            {sponsors.map(sponsor => (
              <div key={sponsor.id} className="card">

                {/* Row header — click to expand */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => {
                    setExpandedId(expandedId === sponsor.id ? null : sponsor.id)
                    setEditingId(null)
                    setConfirmDeleteId(null)
                  }}
                >
                  <div>
                    <p className="text-sporr-dark font-medium">{sponsor.company_name}</p>
                    <p className="text-sporr-muted text-sm mt-0.5">
                      {[sponsor.contact_name, sponsor.industry].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-sporr-muted uppercase tracking-widest mb-1">Health</p>
                      <p className={`text-sm font-medium ${
                        sponsor.health_score >= 70 ? 'text-sporr-dark' :
                        sponsor.health_score >= 40 ? 'text-amber-600' : 'text-red-600'
                      }`}>{sponsor.health_score}</p>
                    </div>
                    <span className="text-sporr-muted text-lg transition-transform duration-200" style={{
                      display: 'inline-block',
                      transform: expandedId === sponsor.id ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>→</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === sponsor.id && (
                  <div className="mt-6 pt-6 border-t border-sporr-sage-lt">

                    {/* Delete confirmation */}
                    {confirmDeleteId === sponsor.id ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 mb-4">
                        <p className="text-red-700 text-sm font-medium mb-1">Delete {sponsor.company_name}?</p>
                        <p className="text-red-600 text-xs mb-4 leading-relaxed">
                          This will permanently remove the sponsor and all contracts linked to them, including obligations and any logged media hits. This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(sponsor.id)}
                            disabled={deleting}
                            className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {deleting ? 'Deleting...' : 'Yes, delete'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="btn-secondary text-sm py-2 px-4"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Edit form */}
                    {editingId === sponsor.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="label">Company name</label>
                            <input className="input" value={editForm.company_name || ''} onChange={e => updateEdit('company_name', e.target.value)} />
                          </div>
                          <div>
                            <label className="label">Industry</label>
                            <input className="input" value={editForm.industry || ''} onChange={e => updateEdit('industry', e.target.value)} />
                          </div>
                          <div>
                            <label className="label">Contact name</label>
                            <input className="input" value={editForm.contact_name || ''} onChange={e => updateEdit('contact_name', e.target.value)} />
                          </div>
                          <div>
                            <label className="label">Contact email</label>
                            <input type="email" className="input" value={editForm.contact_email || ''} onChange={e => updateEdit('contact_email', e.target.value)} />
                          </div>
                          <div>
                            <label className="label">Contact phone</label>
                            <input className="input" value={editForm.contact_phone || ''} onChange={e => updateEdit('contact_phone', e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="label">Notes</label>
                          <textarea className="input h-20 resize-none" value={editForm.notes || ''} onChange={e => updateEdit('notes', e.target.value)} />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleSaveEdit(sponsor.id)} disabled={savingEdit} className="btn-primary disabled:opacity-50 text-sm py-2 px-4">
                            {savingEdit ? 'Saving...' : 'Save changes'}
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      /* Read-only detail view */
                      <div>
                        <div className="space-y-2 mb-6">
                          {sponsor.contact_email && (
                            <div className="flex items-center justify-between py-1.5">
                              <span className="text-sporr-muted text-sm">Email</span>
                              <a href={`mailto:${sponsor.contact_email}`} className="text-sporr-dark text-sm font-medium hover:text-sporr-mid transition-colors">{sponsor.contact_email}</a>
                            </div>
                          )}
                          {sponsor.contact_phone && (
                            <div className="flex items-center justify-between py-1.5 border-t border-sporr-sage-lt">
                              <span className="text-sporr-muted text-sm">Phone</span>
                              <a href={`tel:${sponsor.contact_phone}`} className="text-sporr-dark text-sm font-medium">{sponsor.contact_phone}</a>
                            </div>
                          )}
                          {sponsor.notes && (
                            <div className="pt-2 border-t border-sporr-sage-lt">
                              <p className="text-sporr-muted text-xs uppercase tracking-widest mb-1">Notes</p>
                              <p className="text-sporr-dark text-sm leading-relaxed">{sponsor.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => startEdit(sponsor)}
                            className="btn-secondary text-sm py-2 px-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(sponsor.id)}
                            className="text-red-500 hover:text-red-700 text-sm transition-colors px-2 py-2"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
