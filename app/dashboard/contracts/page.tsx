'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Sponsor = { id: string; company_name: string }
type Contract = {
  id: string; title: string; value_nok: number; season: string
  status: string; start_date: string; end_date: string
  sponsorship_tier: string
  sponsors: { company_name: string }
}
type Obligation = {
  id: string; description: string | null; proof_type: string
  delivery_context: string; status: string; contract_id: string
}
type MediaHit = {
  id: string
  contract_id: string
  media_type: string
  outlet_name: string
  reach: number
  cpm_override: number | null
  notes: string | null
  hit_date: string | null
}

const PROOF_TYPES = [
  { value: 'photo', label: 'Photo — field capture on match day' },
  { value: 'link', label: 'Link — social media post or digital asset' },
  { value: 'timestamp', label: 'Timestamp — confirmed presence or announcement' },
  { value: 'note', label: 'Note — written confirmation of delivery' },
]
const ASSET_TYPES = ['LED board', 'Jersey / kit', 'Banner / signage', 'Social media post', 'PA announcement', 'Digital screen', 'Hospitality', 'Programme', 'Other']
const DELIVERY_CONTEXTS = [
  { value: 'match_day', label: 'Match day — captured at fixtures' },
  { value: 'training', label: 'Training — captured at training sessions' },
  { value: 'digital', label: 'Digital — online posts and content' },
  { value: 'season_long', label: 'Season-long — ongoing throughout season' },
  { value: 'event', label: 'Event — specific club event or function' },
]
const SPONSORSHIP_TIERS = [
  { value: 'community', label: 'Bronze', sublabel: 'Community sponsor', free: true },
  { value: 'official', label: 'Silver', sublabel: 'Official sponsor', free: false },
  { value: 'principal', label: 'Gold', sublabel: 'Principal sponsor', free: false },
  { value: 'title', label: 'Platinum', sublabel: 'Title sponsor', free: false },
]

// Default CPM rates (NOK) — indicative, based on international benchmarks
const MEDIA_TYPES = [
  { value: 'newspaper', label: 'Newspaper / print', defaultCpm: 50, unit: 'circulation' },
  { value: 'tv', label: 'Television', defaultCpm: 200, unit: 'viewership' },
  { value: 'radio', label: 'Radio', defaultCpm: 35, unit: 'listeners' },
  { value: 'online', label: 'Online / digital news', defaultCpm: 40, unit: 'page views' },
  { value: 'podcast', label: 'Podcast', defaultCpm: 80, unit: 'listeners' },
  { value: 'social_3p', label: 'Third-party social media', defaultCpm: 25, unit: 'impressions' },
  { value: 'event_signage', label: 'Event signage / outdoor', defaultCpm: 15, unit: 'footfall' },
  { value: 'other', label: 'Other', defaultCpm: 30, unit: 'reach' },
]

export default function ContractsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [obligations, setObligations] = useState<Record<string, Obligation[]>>({})
  const [mediaHits, setMediaHits] = useState<Record<string, MediaHit[]>>({})
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgTier, setOrgTier] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedContract, setExpandedContract] = useState<string | null>(null)
  const [showObligationForm, setShowObligationForm] = useState<string | null>(null)
  const [showMediaForm, setShowMediaForm] = useState<string | null>(null)
  const [savingObligation, setSavingObligation] = useState(false)
  const [savingMedia, setSavingMedia] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [form, setForm] = useState({
    title: '', sponsor_id: '', value_nok: '', season: '2025-2026',
    start_date: '', end_date: '', sponsorship_tier: 'community',
  })
  const [obligationForm, setObligationForm] = useState({
    description: '', asset_type: 'Banner / signage', proof_type: 'photo', delivery_context: 'match_day',
  })
  const [mediaForm, setMediaForm] = useState({
    media_type: 'newspaper',
    outlet_name: '',
    reach: '',
    cpm_override: '',
    notes: '',
    hit_date: '',
  })

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))
  const updateOb = (f: string, v: string) => setObligationForm(p => ({ ...p, [f]: v }))
  const updateMedia = (f: string, v: string) => setMediaForm(p => ({ ...p, [f]: v }))

  const isFree = orgTier === 'free'
  const atContractLimit = isFree && contracts.length >= 1

  const selectedMediaType = MEDIA_TYPES.find(m => m.value === mediaForm.media_type) || MEDIA_TYPES[0]

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      setOrgId(userData.org_id)
      const { data: orgData } = await supabase.from('organisations').select('tier').eq('id', userData.org_id).single()
      setOrgTier(orgData?.tier || 'free')
      const [contractsRes, sponsorsRes] = await Promise.all([
        supabase.from('contracts').select('id, title, value_nok, season, status, start_date, end_date, sponsorship_tier, sponsors(company_name)').eq('org_id', userData.org_id).order('created_at', { ascending: false }),
        supabase.from('sponsors').select('id, company_name').eq('org_id', userData.org_id).order('company_name'),
      ])
      const contractList = (contractsRes.data as unknown as Contract[]) || []
      setContracts(contractList)
      setSponsors(sponsorsRes.data || [])
      if (contractList.length > 0) {
        const ids = contractList.map(c => c.id)
        const [oblRes, mediaRes] = await Promise.all([
          supabase.from('obligations').select('id, description, proof_type, delivery_context, status, contract_id').in('contract_id', ids),
          supabase.from('media_hits').select('*').in('contract_id', ids).order('hit_date', { ascending: false }),
        ])
        const groupedObl: Record<string, Obligation[]> = {}
        for (const ob of oblRes.data || []) {
          if (!groupedObl[ob.contract_id]) groupedObl[ob.contract_id] = []
          groupedObl[ob.contract_id].push(ob)
        }
        const groupedMedia: Record<string, MediaHit[]> = {}
        for (const hit of mediaRes.data || []) {
          if (!groupedMedia[hit.contract_id]) groupedMedia[hit.contract_id] = []
          groupedMedia[hit.contract_id].push(hit)
        }
        setObligations(groupedObl)
        setMediaHits(groupedMedia)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!form.title) { setError('Contract title is required'); return }
    if (!form.sponsor_id) { setError('Please select a sponsor'); return }
    if (atContractLimit) { setError('Free plan is limited to 1 contract. Upgrade to add more.'); return }
    if (isFree && form.sponsorship_tier !== 'community') {
      setError('Free plan is limited to Bronze (Community) tier. Upgrade to add higher-tier sponsors.')
      return
    }
    if (!orgId) return
    setSaving(true); setError(null)
    const { data, error: saveError } = await supabase.from('contracts').insert({
      org_id: orgId, sponsor_id: form.sponsor_id, title: form.title,
      value_nok: form.value_nok ? parseFloat(form.value_nok) : 0,
      season: form.season, start_date: form.start_date || null,
      end_date: form.end_date || null, status: 'active',
      sponsorship_tier: form.sponsorship_tier,
    }).select('id, title, value_nok, season, status, start_date, end_date, sponsorship_tier, sponsors(company_name)').single()
    if (saveError) { setError(saveError.message); setSaving(false); return }
    setContracts(prev => [data as unknown as Contract, ...prev])
    setForm({ title: '', sponsor_id: '', value_nok: '', season: '2025-2026', start_date: '', end_date: '', sponsorship_tier: 'community' })
    setShowForm(false); setSaving(false)
    setExpandedContract((data as any).id)
  }

  async function handleAddObligation(contractId: string) {
    if (!orgId) return
    setSavingObligation(true)
    const contextName = DELIVERY_CONTEXTS.find(d => d.value === obligationForm.delivery_context)?.label.split(' —')[0].toLowerCase() || ''
    const description = obligationForm.description || `${obligationForm.asset_type} — ${contextName}`
    const { data, error: obError } = await supabase.from('obligations').insert({
      contract_id: contractId, org_id: orgId, description,
      proof_type: obligationForm.proof_type, delivery_context: obligationForm.delivery_context, status: 'pending',
    }).select().single()
    if (obError) { alert(obError.message); setSavingObligation(false); return }
    setObligations(prev => ({ ...prev, [contractId]: [...(prev[contractId] || []), data] }))
    setObligationForm({ description: '', asset_type: 'Banner / signage', proof_type: 'photo', delivery_context: 'match_day' })
    setShowObligationForm(null); setSavingObligation(false)
  }

  async function handleAddMediaHit(contractId: string) {
    if (!orgId || !mediaForm.outlet_name || !mediaForm.reach) return
    setSavingMedia(true)
    const { data, error: mediaError } = await supabase.from('media_hits').insert({
      contract_id: contractId,
      org_id: orgId,
      media_type: mediaForm.media_type,
      outlet_name: mediaForm.outlet_name,
      reach: parseInt(mediaForm.reach),
      cpm_override: mediaForm.cpm_override ? parseInt(mediaForm.cpm_override) : null,
      notes: mediaForm.notes || null,
      hit_date: mediaForm.hit_date || null,
    }).select().single()
    if (mediaError) { alert(mediaError.message); setSavingMedia(false); return }
    setMediaHits(prev => ({ ...prev, [contractId]: [data as MediaHit, ...(prev[contractId] || [])] }))
    setMediaForm({ media_type: 'newspaper', outlet_name: '', reach: '', cpm_override: '', notes: '', hit_date: '' })
    setShowMediaForm(null); setSavingMedia(false)
  }

  async function deleteMediaHit(hitId: string, contractId: string) {
    await supabase.from('media_hits').delete().eq('id', hitId)
    setMediaHits(prev => ({ ...prev, [contractId]: prev[contractId].filter(h => h.id !== hitId) }))
  }

  async function deleteObligation(obligationId: string, contractId: string) {
    await supabase.from('obligations').delete().eq('id', obligationId)
    setObligations(prev => ({ ...prev, [contractId]: prev[contractId].filter(o => o.id !== obligationId) }))
  }

  const contextLabel = (val: string) => DELIVERY_CONTEXTS.find(d => d.value === val)?.label.split(' —')[0] || val

  const mediaValue = (hit: MediaHit) => {
    const cpm = hit.cpm_override ?? (MEDIA_TYPES.find(m => m.value === hit.media_type)?.defaultCpm || 30)
    return Math.round(hit.reach * cpm / 1000)
  }

  const totalMediaValue = (contractId: string) =>
    (mediaHits[contractId] || []).reduce((sum, hit) => sum + mediaValue(hit), 0)

  if (loading) return <main className="min-h-screen bg-sporr-cream flex items-center justify-center"><div className="text-sporr-muted text-sm">Loading...</div></main>

  return (
    <main className="min-h-screen bg-sporr-cream">
      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard"><img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" /></Link>
        <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">← Dashboard</Link>
      </nav>

      {/* Upgrade prompt modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <p className="text-sporr-sage text-xs uppercase tracking-widest mb-1">Free plan limit</p>
            <h2 className="text-sporr-dark text-xl font-medium mb-3">Upgrade to add higher-tier sponsors</h2>
            <p className="text-sporr-muted text-sm leading-relaxed mb-6">
              The free plan supports Bronze (Community) tier only. Upgrade to Club to add Silver, Gold, or Platinum tier sponsors.
            </p>
            <div className="bg-sporr-light rounded-xl p-4 mb-6">
              <p className="text-sporr-dark font-medium mb-1">Club — Kr 490/mnd</p>
              <p className="text-sporr-muted text-sm">Unlimited sponsors · All tiers · 10GB storage · Unlimited Proof Packs</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/club" className="flex-1 bg-sporr-dark text-sporr-cream text-sm font-medium px-4 py-3 rounded-lg text-center hover:bg-sporr-mid transition-colors">
                Upgrade now →
              </Link>
              <button onClick={() => setShowUpgradePrompt(false)} className="flex-1 btn-secondary text-sm py-3">Maybe later</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-sporr-dark text-2xl font-medium mb-1">Contracts</h1>
            <p className="text-sporr-muted text-sm">{contracts.length} contract{contracts.length !== 1 ? 's' : ''}</p>
          </div>
          {atContractLimit ? (
            <Link href="/dashboard/club" className="btn-primary">Upgrade to add more →</Link>
          ) : (
            <button onClick={() => setShowForm(true)} className="btn-primary">New contract</button>
          )}
        </div>

        {atContractLimit && (
          <div className="bg-sporr-dark rounded-2xl px-6 py-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sporr-cream text-sm font-medium mb-0.5">Free plan — 1 contract limit reached</p>
              <p className="text-sporr-sage text-xs">Upgrade to Club (Kr 490/mnd) to add unlimited contracts at any sponsorship tier.</p>
            </div>
            <Link href="/dashboard/club" className="bg-sporr-cream text-sporr-dark text-xs font-medium px-4 py-2 rounded-lg hover:bg-sporr-sage-lt transition-colors whitespace-nowrap flex-shrink-0">
              Upgrade plan →
            </Link>
          </div>
        )}

        {showForm && !atContractLimit && (
          <div className="card mb-8">
            <h2 className="text-sporr-dark text-lg font-medium mb-6">New contract</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>}
            {sponsors.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6">
                Add a sponsor first. <Link href="/dashboard/sponsors" className="underline">Add a sponsor</Link>
              </div>
            )}
            <div className="mb-6">
              <label className="label">Sponsorship tier</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SPONSORSHIP_TIERS.map(tier => {
                  const locked = isFree && !tier.free
                  const selected = form.sponsorship_tier === tier.value
                  return (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => {
                        if (locked) { setShowUpgradePrompt(true); return }
                        update('sponsorship_tier', tier.value)
                      }}
                      className={`relative text-left rounded-xl p-4 border-2 transition-colors ${
                        selected ? 'border-sporr-dark bg-sporr-dark text-sporr-cream'
                        : locked ? 'border-sporr-sage-lt bg-sporr-light opacity-60 cursor-not-allowed'
                        : 'border-sporr-sage-lt hover:border-sporr-dark bg-white'
                      }`}
                    >
                      {locked && <span className="absolute top-2 right-2 text-xs bg-sporr-sage-lt text-sporr-muted px-1.5 py-0.5 rounded-full">Club</span>}
                      <p className={`font-medium text-sm mb-0.5 ${selected ? 'text-sporr-cream' : 'text-sporr-dark'}`}>{tier.label}</p>
                      <p className={`text-xs ${selected ? 'text-sporr-sage' : 'text-sporr-muted'}`}>{tier.sublabel}</p>
                    </button>
                  )
                })}
              </div>
              {isFree && <p className="text-sporr-muted text-xs mt-2">Free plan includes Bronze tier only. <Link href="/dashboard/club" className="text-sporr-dark underline">Upgrade</Link> to add higher-tier sponsors.</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2"><label className="label">Contract title</label><input className="input" placeholder="2025/26 Season Partnership" value={form.title} onChange={e => update('title', e.target.value)} /></div>
              <div><label className="label">Sponsor</label><select className="input" value={form.sponsor_id} onChange={e => update('sponsor_id', e.target.value)}><option value="">Select a sponsor...</option>{sponsors.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}</select></div>
              <div><label className="label">Total value (NOK)</label><input type="number" className="input" placeholder="50 000" value={form.value_nok} onChange={e => update('value_nok', e.target.value)} /></div>
              <div><label className="label">Season</label><input className="input" placeholder="2025-2026" value={form.season} onChange={e => update('season', e.target.value)} /></div>
              <div><label className="label">Start date</label><input type="date" className="input" value={form.start_date} onChange={e => update('start_date', e.target.value)} /></div>
              <div><label className="label">End date</label><input type="date" className="input" value={form.end_date} onChange={e => update('end_date', e.target.value)} /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || sponsors.length === 0} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save contract'}</button>
              <button onClick={() => { setShowForm(false); setError(null) }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {contracts.length === 0 && !showForm ? (
          <div className="card text-center py-16">
            <p className="text-sporr-muted text-lg mb-2">No contracts yet</p>
            <p className="text-sporr-muted text-sm mb-6">Create your first contract to start tracking obligations</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Create first contract</button>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map(contract => {
              const tier = SPONSORSHIP_TIERS.find(t => t.value === contract.sponsorship_tier)
              const hits = mediaHits[contract.id] || []
              const totalMediaVal = totalMediaValue(contract.id)
              return (
                <div key={contract.id} className="card">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedContract(expandedContract === contract.id ? null : contract.id)}>
                    <div>
                      <p className="text-sporr-dark font-medium">{contract.title}</p>
                      <p className="text-sporr-muted text-sm mt-0.5">
                        {contract.sponsors?.company_name}
                        {contract.season && <span> · {contract.season}</span>}
                        <span> · {obligations[contract.id]?.length || 0} obligation{obligations[contract.id]?.length !== 1 ? 's' : ''}</span>
                        {hits.length > 0 && <span> · {hits.length} media hit{hits.length !== 1 ? 's' : ''}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                      {tier && <span className="text-xs font-medium px-2 py-1 rounded-full bg-sporr-sage-lt text-sporr-dark">{tier.label}</span>}
                      {contract.value_nok > 0 && <p className="text-sporr-dark font-medium text-sm">Kr {contract.value_nok.toLocaleString('nb-NO')}</p>}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${contract.status === 'active' ? 'bg-sporr-sage-lt text-sporr-dark' : 'bg-sporr-light text-sporr-muted'}`}>{contract.status}</span>
                      <span className="text-sporr-muted text-lg">{expandedContract === contract.id ? '↑' : '↓'}</span>
                    </div>
                  </div>

                  {expandedContract === contract.id && (
                    <div className="mt-6 pt-6 border-t border-sporr-sage-lt space-y-6">

                      {/* Obligations */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sporr-dark text-sm font-medium uppercase tracking-widest">Obligations</h3>
                          <button onClick={() => setShowObligationForm(showObligationForm === contract.id ? null : contract.id)} className="text-sporr-dark text-sm font-medium hover:text-sporr-mid transition-colors">+ Add obligation</button>
                        </div>
                        {showObligationForm === contract.id && (
                          <div className="bg-sporr-light rounded-xl p-4 mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div><label className="label">Asset type</label><select className="input" value={obligationForm.asset_type} onChange={e => updateOb('asset_type', e.target.value)}>{ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                              <div><label className="label">When is it delivered?</label><select className="input" value={obligationForm.delivery_context} onChange={e => updateOb('delivery_context', e.target.value)}>{DELIVERY_CONTEXTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
                              <div><label className="label">Proof required</label><select className="input" value={obligationForm.proof_type} onChange={e => updateOb('proof_type', e.target.value)}>{PROOF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                              <div><label className="label">Description (optional)</label><input className="input" placeholder="e.g. North stand banner, visible throughout match" value={obligationForm.description} onChange={e => updateOb('description', e.target.value)} /></div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleAddObligation(contract.id)} disabled={savingObligation} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">{savingObligation ? 'Saving...' : 'Add obligation'}</button>
                              <button onClick={() => setShowObligationForm(null)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                            </div>
                          </div>
                        )}
                        {(obligations[contract.id] || []).length === 0 ? (
                          <p className="text-sporr-muted text-sm py-2">No obligations yet — add the assets this sponsor expects to see delivered.</p>
                        ) : (
                          <div className="space-y-2">
                            {(obligations[contract.id] || []).map(ob => (
                              <div key={ob.id} className="flex items-center justify-between bg-sporr-light rounded-lg px-4 py-3">
                                <div>
                                  <p className="text-sporr-dark text-sm font-medium">{ob.description}</p>
                                  <p className="text-sporr-muted text-xs mt-0.5 capitalize">{ob.proof_type} proof · {contextLabel(ob.delivery_context)}</p>
                                </div>
                                <button onClick={() => deleteObligation(ob.id, contract.id)} className="text-sporr-muted hover:text-red-500 text-sm transition-colors ml-4">✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Media hits */}
                      <div className="border-t border-sporr-sage-lt pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sporr-dark text-sm font-medium uppercase tracking-widest">Media coverage</h3>
                            {totalMediaVal > 0 && (
                              <p className="text-sporr-muted text-xs mt-0.5">
                                Estimated media value: <strong className="text-sporr-dark">Kr {totalMediaVal.toLocaleString('nb-NO')}</strong>
                              </p>
                            )}
                          </div>
                          <button onClick={() => setShowMediaForm(showMediaForm === contract.id ? null : contract.id)} className="text-sporr-dark text-sm font-medium hover:text-sporr-mid transition-colors">+ Log media hit</button>
                        </div>

                        {showMediaForm === contract.id && (
                          <div className="bg-sporr-light rounded-xl p-4 mb-4">
                            <p className="text-sporr-muted text-xs mb-4">Log media coverage as it happens — TV, newspaper, radio, online, and more. Estimated values are calculated automatically and included in your Proof Pack ROI.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="label">Media type</label>
                                <select className="input" value={mediaForm.media_type} onChange={e => updateMedia('media_type', e.target.value)}>
                                  {MEDIA_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="label">Outlet / publication name</label>
                                <input className="input" placeholder="e.g. Sandnesposten, TV2 Sport..." value={mediaForm.outlet_name} onChange={e => updateMedia('outlet_name', e.target.value)} />
                              </div>
                              <div>
                                <label className="label">Estimated {selectedMediaType.unit}</label>
                                <input type="number" className="input" placeholder="e.g. 12 000" value={mediaForm.reach} onChange={e => updateMedia('reach', e.target.value)} />
                                <p className="text-sporr-muted text-xs mt-1">
                                  Default CPM: Kr {selectedMediaType.defaultCpm} · Estimated value: Kr {mediaForm.reach ? Math.round(parseInt(mediaForm.reach) * (mediaForm.cpm_override ? parseInt(mediaForm.cpm_override) : selectedMediaType.defaultCpm) / 1000).toLocaleString('nb-NO') : '—'}
                                </p>
                              </div>
                              <div>
                                <label className="label">CPM override (optional)</label>
                                <input type="number" className="input" placeholder={`Default: ${selectedMediaType.defaultCpm}`} value={mediaForm.cpm_override} onChange={e => updateMedia('cpm_override', e.target.value)} />
                                <p className="text-sporr-muted text-xs mt-1">Leave blank to use the default rate</p>
                              </div>
                              <div>
                                <label className="label">Date of coverage</label>
                                <input type="date" className="input" value={mediaForm.hit_date} onChange={e => updateMedia('hit_date', e.target.value)} />
                              </div>
                              <div>
                                <label className="label">Notes (optional)</label>
                                <input className="input" placeholder="e.g. Front page feature, 3-minute segment..." value={mediaForm.notes} onChange={e => updateMedia('notes', e.target.value)} />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleAddMediaHit(contract.id)} disabled={savingMedia || !mediaForm.outlet_name || !mediaForm.reach} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">{savingMedia ? 'Saving...' : 'Log media hit'}</button>
                              <button onClick={() => setShowMediaForm(null)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                            </div>
                          </div>
                        )}

                        {hits.length === 0 ? (
                          <p className="text-sporr-muted text-sm py-2">No media hits logged yet. Log coverage as it happens — TV, newspaper, radio, online.</p>
                        ) : (
                          <div className="space-y-2">
                            {hits.map(hit => {
                              const val = mediaValue(hit)
                              const mt = MEDIA_TYPES.find(m => m.value === hit.media_type)
                              return (
                                <div key={hit.id} className="flex items-center justify-between bg-sporr-light rounded-lg px-4 py-3">
                                  <div>
                                    <p className="text-sporr-dark text-sm font-medium">{hit.outlet_name}</p>
                                    <p className="text-sporr-muted text-xs mt-0.5">
                                      {mt?.label} · {hit.reach.toLocaleString('nb-NO')} {mt?.unit}
                                      {hit.hit_date && ` · ${new Date(hit.hit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                    </p>
                                    {hit.notes && <p className="text-sporr-muted text-xs mt-0.5 italic">{hit.notes}</p>}
                                  </div>
                                  <div className="flex items-center gap-3 ml-4">
                                    <span className="text-sporr-dark text-sm font-medium whitespace-nowrap">Kr {val.toLocaleString('nb-NO')}</span>
                                    <button onClick={() => deleteMediaHit(hit.id, contract.id)} className="text-sporr-muted hover:text-red-500 text-sm transition-colors">✕</button>
                                  </div>
                                </div>
                              )
                            })}
                            <div className="flex justify-between items-center px-4 py-2 border-t border-sporr-sage-lt">
                              <span className="text-sporr-muted text-xs uppercase tracking-widest">Total estimated media value</span>
                              <span className="text-sporr-dark font-medium text-sm">Kr {totalMediaVal.toLocaleString('nb-NO')}</span>
                            </div>
                          </div>
                        )}
                        <p className="text-sporr-muted text-xs mt-3">Values are indicative estimates based on international CPM benchmarks. Actual value may vary.</p>
                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
