'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Tier system ───────────────────────────────────────────────────────────────
const PLAN_TIER_LABELS: Record<string, string> = {
  foundation: 'Foundation', organisation: 'Organisation',
  portfolio: 'Portfolio', network: 'Network',
  free: 'Foundation', club: 'Organisation', pro: 'Portfolio', agency: 'Network',
}

function normaliseTier(raw: string | null | undefined): string {
  const map: Record<string, string> = { free: 'foundation', club: 'organisation', pro: 'portfolio', agency: 'network' }
  return map[raw || ''] ?? raw ?? 'foundation'
}

const SPONSOR_TIERS: Record<string, { label: string; order: number; bg: string; text: string; border: string }> = {
  community: { label: 'Bronze',   order: 4, bg: '#FDF4EC', text: '#92400E', border: '#FCD9A8' },
  official:  { label: 'Silver',   order: 3, bg: '#F4F5F6', text: '#374151', border: '#D1D5DB' },
  principal: { label: 'Gold',     order: 2, bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  title:     { label: 'Platinum', order: 1, bg: '#F0F4FF', text: '#3730A3', border: '#C7D2FE' },
  diamond:   { label: 'Diamond',  order: 0, bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Sponsor    = { id: string; company_name: string }
type Contract   = { id: string; title: string; value_nok: number; season: string; status: string; start_date: string; end_date: string; sponsorship_tier: string; sponsor_id: string; sponsors: { company_name: string } }
type Asset      = { id: string; name: string; asset_type: string; sponsor_id: string | null }
type EventRow   = { id: string; event_type: string; club: string | null; starts_at: string | null; ends_at: string | null }
type Commitment = {
  id: string; contract_id: string; asset_id: string | null
  description: string | null; proof_type: string
  recurrence_rule: string; applies_to: string; quantity: number; active: boolean
  club: string | null
  assets?: { name: string | null; asset_type: string | null } | null
}
type MediaHit   = { id: string; contract_id: string; media_type: string; outlet_name: string; reach: number; cpm_override: number | null; notes: string | null; hit_date: string | null }

// ── Commitment form options ───────────────────────────────────────────────────
const PROOF_TYPES = [
  { value: 'photo',     label: 'Photo — field capture' },
  { value: 'link',      label: 'Link — social or digital asset' },
  { value: 'timestamp', label: 'Timestamp — confirmed presence/announcement' },
  { value: 'note',      label: 'Note — written confirmation' },
]

const RECURRENCE_RULES = [
  { value: 'per_match',    label: 'Every match',     hint: 'One capture per qualifying fixture' },
  { value: 'per_training', label: 'Every training',  hint: 'One capture per training session' },
  { value: 'per_event',    label: 'Every event',     hint: 'Events, community & media days' },
  { value: 'season_long',  label: 'Season-long',     hint: 'Standing — captured once, ongoing' },
  { value: 'once',         label: 'One-off',         hint: 'Standing — a single capture' },
]

const ASSET_TYPES = [
  { value: 'LED_BOARD',      label: 'LED board' },
  { value: 'JERSEY',         label: 'Jersey / kit' },
  { value: 'BANNER',         label: 'Banner / signage' },
  { value: 'SOCIAL_POST',    label: 'Social media post' },
  { value: 'PA_ANNOUNCEMENT',label: 'PA announcement' },
  { value: 'DIGITAL_SCREEN', label: 'Digital screen' },
  { value: 'HOSPITALITY',    label: 'Hospitality' },
  { value: 'PROGRAMME',      label: 'Programme' },
  { value: 'OTHER',          label: 'Other' },
]

const APPLIES_TO = [
  { value: 'home', label: 'Home only' },
  { value: 'away', label: 'Away only' },
  { value: 'both', label: 'Home & away' },
]

function recurrenceSummary(c: Commitment): string {
  switch (c.recurrence_rule) {
    case 'per_match': {
      const scope = c.applies_to === 'away' ? 'away match' : c.applies_to === 'both' ? 'match (home & away)' : 'home match'
      return `Every ${scope}`
    }
    case 'per_training': return 'Every training'
    case 'per_event':    return 'Every event'
    case 'season_long':  return 'Season-long'
    case 'once':         return 'One-off'
    default:             return c.recurrence_rule
  }
}

// recurrence → event_type set, mirroring the engine (§4.1)
function expectedEventTypes(rule: string, appliesTo: string): string[] {
  switch (rule) {
    case 'per_match':
      return appliesTo === 'away' ? ['away_match']
        : appliesTo === 'both' ? ['home_match', 'away_match']
        : ['home_match']
    case 'per_training': return ['training']
    case 'per_event':    return ['event', 'community', 'media']
    default:             return []
  }
}

const MEDIA_TYPES = [
  { value: 'newspaper',     label: 'Newspaper / print',          defaultCpm: 50,  unit: 'circulation' },
  { value: 'tv',            label: 'Television',                  defaultCpm: 200, unit: 'viewership' },
  { value: 'radio',         label: 'Radio',                       defaultCpm: 35,  unit: 'listeners' },
  { value: 'online',        label: 'Online / digital news',       defaultCpm: 40,  unit: 'page views' },
  { value: 'podcast',       label: 'Podcast',                     defaultCpm: 80,  unit: 'listeners' },
  { value: 'social_3p',     label: 'Third-party social media',    defaultCpm: 25,  unit: 'impressions' },
  { value: 'event_signage', label: 'Event signage / outdoor',     defaultCpm: 15,  unit: 'footfall' },
  { value: 'other',         label: 'Other',                       defaultCpm: 30,  unit: 'reach' },
]

function TierBadge({ tier }: { tier: string }) {
  const meta = SPONSOR_TIERS[tier] || SPONSOR_TIERS.community
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase"
      style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}>
      {meta.label}
    </span>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const INK = '#081216'
const FOG = '#E7ECEF'
const SLATE = '#6E7F86'
const BLUE = '#147BFF'
const GREEN = '#36B37E'
const BG = '#F5F2ED'
const WHITE = '#FFFFFF'
const BORDER = 'rgba(8,18,22,0.08)'

function inp(extra?: React.CSSProperties): React.CSSProperties {
  return { width: '100%', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, color: INK, outline: 'none', fontFamily: 'inherit', ...extra }
}
function sel(extra?: React.CSSProperties): React.CSSProperties { return inp(extra) }
function lbl(): React.CSSProperties { return { display: 'block', fontSize: 11, fontWeight: 600, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 } }

// ── Main component ────────────────────────────────────────────────────────────
export default function ContractsPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [contracts, setContracts]       = useState<Contract[]>([])
  const [sponsors, setSponsors]         = useState<Sponsor[]>([])
  const [assets, setAssets]             = useState<Asset[]>([])
  const [events, setEvents]             = useState<EventRow[]>([])
  const [orgSports, setOrgSports]       = useState<string[]>([])
  const [commitments, setCommitments]   = useState<Record<string, Commitment[]>>({})
  const [mediaHits, setMediaHits]       = useState<Record<string, MediaHit[]>>({})
  const [orgId, setOrgId]               = useState<string | null>(null)
  const [orgName, setOrgName]           = useState('')
  const [planTier, setPlanTier]         = useState('foundation')
  const [clubPrimary, setClubPrimary]   = useState(INK)
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [expandedContract, setExpandedContract] = useState<string | null>(null)
  const [showCommitmentForm, setShowCommitmentForm] = useState<string | null>(null)
  const [showMediaForm, setShowMediaForm] = useState<string | null>(null)
  const [savingCommitment, setSavingCommitment] = useState(false)
  const [savingMedia, setSavingMedia]   = useState(false)
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [savingAsset, setSavingAsset]   = useState(false)
  const [assetForm, setAssetForm]       = useState({ name: '', asset_type: 'LED_BOARD' })

  const [form, setForm] = useState({ title: '', sponsor_id: '', value_nok: '', season: '2025-2026', start_date: '', end_date: '', sponsorship_tier: 'community' })
  const [commitmentForm, setCommitmentForm] = useState({
    asset_id: '', description: '', proof_type: 'photo',
    recurrence_rule: 'per_match', applies_to: 'home', quantity: '1', club: '',
  })
  const [mediaForm, setMediaForm] = useState({ media_type: 'newspaper', outlet_name: '', reach: '', cpm_override: '', notes: '', hit_date: '' })

  const upd   = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))
  const updC  = (f: string, v: string) => setCommitmentForm(p => ({ ...p, [f]: v }))
  const updMd = (f: string, v: string) => setMediaForm(p => ({ ...p, [f]: v }))

  const selectedMediaType = MEDIA_TYPES.find(m => m.value === mediaForm.media_type) || MEDIA_TYPES[0]

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      setOrgId(userData.org_id)

      const { data: orgData } = await supabase.from('organisations').select('tier, name, club_colour_primary, sports').eq('id', userData.org_id).single()
      setPlanTier(normaliseTier(orgData?.tier))
      setOrgName(orgData?.name || '')
      setClubPrimary(orgData?.club_colour_primary || INK)
      setOrgSports((orgData?.sports as string[] | null) || [])

      const [contractsRes, sponsorsRes, assetsRes, eventsRes] = await Promise.all([
        supabase.from('contracts').select('id,title,value_nok,season,status,start_date,end_date,sponsorship_tier,sponsor_id,sponsors(company_name)').eq('org_id', userData.org_id).order('created_at', { ascending: false }),
        supabase.from('sponsors').select('id,company_name').eq('org_id', userData.org_id).order('company_name'),
        supabase.from('assets').select('id,name,asset_type,sponsor_id').eq('org_id', userData.org_id).order('name'),
        supabase.from('events').select('id,event_type,club,starts_at,ends_at').eq('org_id', userData.org_id),
      ])

      const contractList = (contractsRes.data as unknown as Contract[]) || []
      setContracts(contractList)
      setSponsors(sponsorsRes.data || [])
      setAssets((assetsRes.data as Asset[]) || [])
      setEvents((eventsRes.data as EventRow[]) || [])

      if (contractList.length > 0) {
        const ids = contractList.map(c => c.id)
        const [commitRes, mediaRes] = await Promise.all([
          supabase.from('commitments').select('id,contract_id,asset_id,description,proof_type,recurrence_rule,applies_to,quantity,active,club,assets(name,asset_type)').in('contract_id', ids).eq('active', true),
          supabase.from('media_hits').select('*').in('contract_id', ids).order('hit_date', { ascending: false }),
        ])
        const gCom: Record<string, Commitment[]> = {}
        for (const cm of (commitRes.data as unknown as Commitment[]) || []) { if (!gCom[cm.contract_id]) gCom[cm.contract_id] = []; gCom[cm.contract_id].push(cm) }
        const gMed: Record<string, MediaHit[]> = {}
        for (const hit of mediaRes.data || []) { if (!gMed[hit.contract_id]) gMed[hit.contract_id] = []; gMed[hit.contract_id].push(hit) }
        setCommitments(gCom)
        setMediaHits(gMed)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!form.title)      { setError('Contract title is required'); return }
    if (!form.sponsor_id) { setError('Please select a sponsor'); return }
    if (!orgId) return
    setSaving(true); setError(null)
    const { data, error: saveError } = await supabase.from('contracts').insert({
      org_id: orgId, sponsor_id: form.sponsor_id, title: form.title,
      value_nok: form.value_nok ? parseFloat(form.value_nok) : 0,
      season: form.season, start_date: form.start_date || null, end_date: form.end_date || null,
      status: 'active', sponsorship_tier: form.sponsorship_tier,
    }).select('id,title,value_nok,season,status,start_date,end_date,sponsorship_tier,sponsor_id,sponsors(company_name)').single()
    if (saveError) { setError(saveError.message); setSaving(false); return }
    setContracts(prev => [data as unknown as Contract, ...prev])
    setForm({ title: '', sponsor_id: '', value_nok: '', season: '2025-2026', start_date: '', end_date: '', sponsorship_tier: 'community' })
    setShowForm(false); setSaving(false)
    setExpandedContract((data as any).id)
  }

  async function handleAddCommitment(contractId: string) {
    if (!orgId) return
    setSavingCommitment(true)

    const asset = assets.find(a => a.id === commitmentForm.asset_id)
    const description = commitmentForm.description.trim()
      || asset?.name
      || null

    const appliesTo = commitmentForm.recurrence_rule === 'per_match' ? commitmentForm.applies_to : 'home'
    const qty = Math.max(1, parseInt(commitmentForm.quantity) || 1)
    const club = commitmentForm.club || null

    const { data, error: cErr } = await supabase.from('commitments').insert({
      org_id: orgId,
      contract_id: contractId,
      asset_id: commitmentForm.asset_id || null,
      description,
      proof_type: commitmentForm.proof_type,
      recurrence_rule: commitmentForm.recurrence_rule,
      applies_to: appliesTo,
      quantity: qty,
      club,
      active: true,
    }).select('id,contract_id,asset_id,description,proof_type,recurrence_rule,applies_to,quantity,active,club,assets(name,asset_type)').single()

    if (cErr) { alert(cErr.message); setSavingCommitment(false); return }
    setCommitments(prev => ({ ...prev, [contractId]: [...(prev[contractId] || []), data as unknown as Commitment] }))
    setCommitmentForm({ asset_id: '', description: '', proof_type: 'photo', recurrence_rule: 'per_match', applies_to: 'home', quantity: '1', club: '' })
    setShowCommitmentForm(null); setSavingCommitment(false)
  }

  async function handleAddAsset(sponsorId: string) {
    if (!orgId || !assetForm.name.trim()) return
    setSavingAsset(true)
    const { data, error: aErr } = await supabase.from('assets').insert({
      org_id: orgId,
      sponsor_id: sponsorId,
      name: assetForm.name.trim(),
      asset_type: assetForm.asset_type,
    }).select('id,name,asset_type,sponsor_id').single()
    if (aErr) { alert(aErr.message); setSavingAsset(false); return }
    const newAsset = data as Asset
    setAssets(prev => [...prev, newAsset])
    setCommitmentForm(p => ({ ...p, asset_id: newAsset.id }))
    setAssetForm({ name: '', asset_type: 'LED_BOARD' })
    setShowAssetForm(false); setSavingAsset(false)
  }

  function assetsForSponsor(sponsorId: string | undefined) {
    return assets.filter(a => a.sponsor_id === sponsorId || a.sponsor_id === null)
  }

  function coverageFor(c: { recurrence_rule: string; applies_to: string; club: string | null }) {
    const types = expectedEventTypes(c.recurrence_rule, c.applies_to)
    if (types.length === 0) return null
    const n = events.filter(e => types.includes(e.event_type) && (!c.club || c.club === e.club)).length
    return n
  }

  async function archiveCommitment(commitmentId: string, contractId: string) {
    const ok = window.confirm('Archive this commitment? It will stop generating new capture tasks. Existing captures and history are kept.')
    if (!ok) return
    const { error: aErr } = await supabase.from('commitments').update({ active: false }).eq('id', commitmentId)
    if (aErr) { alert(aErr.message); return }
    setCommitments(prev => ({ ...prev, [contractId]: (prev[contractId] || []).filter(c => c.id !== commitmentId) }))
  }

  async function handleAddMediaHit(contractId: string) {
    if (!orgId || !mediaForm.outlet_name || !mediaForm.reach) return
    setSavingMedia(true)
    const { data, error: mediaError } = await supabase.from('media_hits').insert({ contract_id: contractId, org_id: orgId, media_type: mediaForm.media_type, outlet_name: mediaForm.outlet_name, reach: parseInt(mediaForm.reach), cpm_override: mediaForm.cpm_override ? parseInt(mediaForm.cpm_override) : null, notes: mediaForm.notes || null, hit_date: mediaForm.hit_date || null }).select().single()
    if (mediaError) { alert(mediaError.message); setSavingMedia(false); return }
    setMediaHits(prev => ({ ...prev, [contractId]: [data as MediaHit, ...(prev[contractId] || [])] }))
    setMediaForm({ media_type: 'newspaper', outlet_name: '', reach: '', cpm_override: '', notes: '', hit_date: '' })
    setShowMediaForm(null); setSavingMedia(false)
  }

  async function deleteMediaHit(hitId: string, contractId: string) {
    await supabase.from('media_hits').delete().eq('id', hitId)
    setMediaHits(prev => ({ ...prev, [contractId]: prev[contractId].filter(h => h.id !== hitId) }))
  }

  const mediaValue = (hit: MediaHit) => Math.round(hit.reach * (hit.cpm_override ?? (MEDIA_TYPES.find(m => m.value === hit.media_type)?.defaultCpm || 30)) / 1000)
  const totalMediaValue = (contractId: string) => (mediaHits[contractId] || []).reduce((sum, hit) => sum + mediaValue(hit), 0)

  const planLabel = PLAN_TIER_LABELS[planTier] || 'Foundation'

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}><div style={{ color: SLATE, fontSize: 13 }}>Loading...</div></div>

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <main className="pb-16">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-bold tracking-tight mb-1" style={{ fontSize: 26, color: INK, letterSpacing: '-0.02em' }}>Contracts</h1>
              <p style={{ fontSize: 14, color: SLATE }}>
                {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
                {contracts.length > 0 && <span> · {contracts.filter(c => c.status === 'active').length} active</span>}
              </p>
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: INK, color: FOG }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0F2A2E')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = INK)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              New contract
            </button>
          </div>

          {/* New contract form */}
          {showForm && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
              <h2 className="font-semibold mb-5" style={{ fontSize: 16, color: INK }}>New contract</h2>

              {error && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0"><path d="M8 2v7M8 11v2" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <p style={{ fontSize: 13, color: '#92400E' }}>{error}</p>
                </div>
              )}

              {sponsors.length === 0 && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5" style={{ background: '#F0F9FF', border: '1px solid #BFDBFE' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0"><circle cx="8" cy="8" r="6" stroke="#3B82F6" strokeWidth="1.2"/><path d="M8 5v4M8 11v1" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <p style={{ fontSize: 13, color: '#1E40AF' }}>Add a sponsor before creating a contract. <Link href="/dashboard/sponsors" style={{ fontWeight: 600, textDecoration: 'underline' }}>Add a sponsor →</Link></p>
                </div>
              )}

              {/* Sponsor tier selection */}
              <div className="mb-5">
                <label style={lbl()}>Sponsor tier</label>
                <p className="text-xs mb-3" style={{ color: SLATE }}>Your classification of this sponsor&apos;s level of support. Choose whatever fits your partnership model.</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { value: 'community', label: 'Bronze',   sublabel: 'Entry level support' },
                    { value: 'official',  label: 'Silver',   sublabel: 'Official sponsor' },
                    { value: 'principal', label: 'Gold',     sublabel: 'Principal sponsor' },
                    { value: 'title',     label: 'Platinum', sublabel: 'Title sponsor' },
                    { value: 'diamond',   label: 'Diamond',  sublabel: 'Premium partner' },
                  ].map(tier => {
                    const selected = form.sponsorship_tier === tier.value
                    const meta = SPONSOR_TIERS[tier.value]
                    return (
                      <button key={tier.value} type="button" onClick={() => upd('sponsorship_tier', tier.value)}
                        className="text-left rounded-xl p-3 border-2 transition-all"
                        style={{ borderColor: selected ? meta.border : 'rgba(8,18,22,0.08)', background: selected ? meta.bg : WHITE }}>
                        <p className="text-xs font-bold mb-0.5" style={{ color: selected ? meta.text : INK }}>{tier.label}</p>
                        <p className="text-[10px]" style={{ color: SLATE }}>{tier.sublabel}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="sm:col-span-2">
                  <label style={lbl()}>Contract title</label>
                  <input style={inp()} placeholder="2025/26 Season Partnership" value={form.title} onChange={e => upd('title', e.target.value)} />
                </div>
                <div>
                  <label style={lbl()}>Sponsor</label>
                  <select style={sel()} value={form.sponsor_id} onChange={e => upd('sponsor_id', e.target.value)}>
                    <option value="">Select a sponsor...</option>
                    {sponsors.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl()}>Total value (€)</label>
                  <input type="number" style={inp()} placeholder="50 000" value={form.value_nok} onChange={e => upd('value_nok', e.target.value)} />
                </div>
                <div>
                  <label style={lbl()}>Season</label>
                  <input style={inp()} placeholder="2025-2026" value={form.season} onChange={e => upd('season', e.target.value)} />
                </div>
                <div>
                  <label style={lbl()}>Start date</label>
                  <input type="date" style={inp()} value={form.start_date} onChange={e => upd('start_date', e.target.value)} />
                </div>
                <div>
                  <label style={lbl()}>End date</label>
                  <input type="date" style={inp()} value={form.end_date} onChange={e => upd('end_date', e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleSave} disabled={saving || sponsors.length === 0}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ background: INK, color: FOG }}>
                  {saving ? 'Saving...' : 'Save contract'}
                </button>
                <button onClick={() => { setShowForm(false); setError(null) }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {contracts.length === 0 && !showForm && (
            <div className="rounded-2xl px-6 py-16 text-center" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#F5F2ED' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="#6E7F86" strokeWidth="1.5"/><path d="M7 7h6M7 10h6M7 13h4" stroke="#6E7F86" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <p className="text-base font-semibold mb-1" style={{ color: INK }}>No contracts yet</p>
              <p className="text-sm mb-5" style={{ color: SLATE }}>Create your first contract to start tracking commitments and media coverage.</p>
              <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: INK, color: FOG }}>Create first contract</button>
            </div>
          )}

          {/* Contract list */}
          <div className="space-y-3">
            {contracts.map(contract => {
              const hits = mediaHits[contract.id] || []
              const totalMV = totalMediaValue(contract.id)
              const comList = commitments[contract.id] || []
              const expanded = expandedContract === contract.id

              return (
                <div key={contract.id} className="rounded-2xl overflow-hidden" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
                  {/* Club colour top border */}
                  <div className="h-0.5 w-full" style={{ background: clubPrimary }} />

                  {/* Contract header — clickable */}
                  <div className="px-5 py-4 cursor-pointer" onClick={() => setExpandedContract(expanded ? null : contract.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap mb-1">
                          <p className="text-sm font-semibold" style={{ color: INK }}>{contract.title}</p>
                          <TierBadge tier={contract.sponsorship_tier} />
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: contract.status === 'active' ? '#DCFCE7' : '#F5F2ED', color: contract.status === 'active' ? '#16A34A' : SLATE }}>
                            {contract.status}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: SLATE }}>
                          {contract.sponsors?.company_name}
                          {contract.season && ` · ${contract.season}`}
                          {` · ${comList.length} commitment${comList.length !== 1 ? 's' : ''}`}
                          {hits.length > 0 && ` · ${hits.length} media hit${hits.length !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {contract.value_nok > 0 && (
                          <p className="text-sm font-semibold" style={{ color: INK }}>€{contract.value_nok.toLocaleString('nb-NO')}</p>
                        )}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: SLATE, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
                          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expanded && (
                    <div className="px-5 pb-6 space-y-6" style={{ borderTop: `1px solid ${BORDER}` }}>

                      {/* Commitments */}
                      <div className="pt-5">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: SLATE }}>Commitments</h3>
                            <p className="text-xs mt-0.5" style={{ color: SLATE }}>What was promised, and how it recurs. Capture tasks generate from these.</p>
                          </div>
                          <button onClick={() => setShowCommitmentForm(showCommitmentForm === contract.id ? null : contract.id)}
                            className="text-xs font-medium flex items-center gap-1.5" style={{ color: BLUE }}
                            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.75')}
                            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Add commitment
                          </button>
                        </div>

                        {showCommitmentForm === contract.id && (
                          <div className="rounded-xl p-4 mb-4" style={{ background: '#F5F2ED', border: `1px solid ${BORDER}` }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                              {/* Recurrence */}
                              <div>
                                <label style={lbl()}>How often?</label>
                                <select style={sel()} value={commitmentForm.recurrence_rule} onChange={e => updC('recurrence_rule', e.target.value)}>
                                  {RECURRENCE_RULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                                <p className="text-[11px] mt-1" style={{ color: SLATE }}>{RECURRENCE_RULES.find(r => r.value === commitmentForm.recurrence_rule)?.hint}</p>
                              </div>

                              {/* Applies to — only meaningful for per_match */}
                              {commitmentForm.recurrence_rule === 'per_match' ? (
                                <div>
                                  <label style={lbl()}>Which matches?</label>
                                  <select style={sel()} value={commitmentForm.applies_to} onChange={e => updC('applies_to', e.target.value)}>
                                    {APPLIES_TO.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                  </select>
                                  <p className="text-[11px] mt-1" style={{ color: SLATE }}>Rights usually sit with the home team — home is the default.</p>
                                </div>
                              ) : (
                                <div>
                                  <label style={lbl()}>Proof required</label>
                                  <select style={sel()} value={commitmentForm.proof_type} onChange={e => updC('proof_type', e.target.value)}>
                                    {PROOF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                  </select>
                                </div>
                              )}

                              {commitmentForm.recurrence_rule === 'per_match' && (
                                <div>
                                  <label style={lbl()}>Proof required</label>
                                  <select style={sel()} value={commitmentForm.proof_type} onChange={e => updC('proof_type', e.target.value)}>
                                    {PROOF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                  </select>
                                </div>
                              )}

                              {/* Group scope — only shown for multi-sport clubs */}
                              {orgSports.length > 1 && (
                                <div>
                                  <label style={lbl()}>Applies to which sport?</label>
                                  <select style={sel()} value={commitmentForm.club} onChange={e => updC('club', e.target.value)}>
                                    <option value="">Whole club — all sports</option>
                                    {orgSports.map(sp => <option key={sp} value={sp}>{sp} only</option>)}
                                  </select>
                                  <p className="text-[11px] mt-1" style={{ color: SLATE }}>Group sponsors only generate tasks for their sport&apos;s events.</p>
                                </div>
                              )}

                              {/* Asset (optional) — scoped to this sponsor + club-wide */}
                              <div>
                                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                                  <label style={{ ...lbl(), marginBottom: 0 }}>Asset (optional)</label>
                                  {!showAssetForm && (
                                    <button type="button" onClick={() => setShowAssetForm(true)} className="text-[11px] font-medium" style={{ color: BLUE }}>+ New asset</button>
                                  )}
                                </div>
                                {showAssetForm ? (
                                  <div className="rounded-lg p-3" style={{ background: WHITE, border: `1px dashed ${BORDER}` }}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                      <input style={inp()} placeholder="Asset name — e.g. East stand LED" value={assetForm.name} onChange={e => setAssetForm(p => ({ ...p, name: e.target.value }))} />
                                      <select style={sel()} value={assetForm.asset_type} onChange={e => setAssetForm(p => ({ ...p, asset_type: e.target.value }))}>
                                        {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                      </select>
                                    </div>
                                    <div className="flex gap-2">
                                      <button type="button" onClick={() => handleAddAsset(contract.sponsor_id)} disabled={savingAsset || !assetForm.name.trim()}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40" style={{ background: INK, color: FOG }}>
                                        {savingAsset ? 'Saving…' : `Add to ${contract.sponsors?.company_name || 'sponsor'}`}
                                      </button>
                                      <button type="button" onClick={() => { setShowAssetForm(false); setAssetForm({ name: '', asset_type: 'LED_BOARD' }) }} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <select style={sel()} value={commitmentForm.asset_id} onChange={e => updC('asset_id', e.target.value)}>
                                    <option value="">No specific asset</option>
                                    {assetsForSponsor(contract.sponsor_id).map(a => (
                                      <option key={a.id} value={a.id}>{a.name}{a.sponsor_id === null ? ' (club-wide)' : ''}</option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              {/* Quantity */}
                              <div>
                                <label style={lbl()}>Quantity per occurrence</label>
                                <input type="number" min={1} style={inp()} value={commitmentForm.quantity} onChange={e => updC('quantity', e.target.value)} />
                                <p className="text-[11px] mt-1" style={{ color: SLATE }}>Expected captures shown on the field card. One capture submits the task.</p>
                              </div>

                              {/* Description */}
                              <div className="sm:col-span-2">
                                <label style={lbl()}>Description (optional)</label>
                                <input style={inp()} placeholder="e.g. North stand LED board, visible throughout" value={commitmentForm.description} onChange={e => updC('description', e.target.value)} />
                                <p className="text-[11px] mt-1" style={{ color: SLATE }}>Leave blank to use the asset name on the field card.</p>
                              </div>
                            </div>
                            {/* Live coverage preview */}
                            {(() => {
                              const n = coverageFor({ recurrence_rule: commitmentForm.recurrence_rule, applies_to: commitmentForm.applies_to, club: commitmentForm.club || null })
                              if (n === null) return (
                                <div className="rounded-lg px-3 py-2 mb-3 text-xs" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: SLATE }}>
                                  Standing commitment — captured once, not tied to fixtures.
                                </div>
                              )
                              const scopeNote = commitmentForm.club ? ` ${commitmentForm.club}` : ''
                              return n > 0 ? (
                                <div className="rounded-lg px-3 py-2 mb-3 text-xs flex items-center gap-2" style={{ background: '#F0F9FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}>
                                  <span className="font-semibold">{n}</span> matching{scopeNote} event{n !== 1 ? 's' : ''} scheduled — tasks generate automatically.
                                </div>
                              ) : (
                                <div className="rounded-lg px-3 py-2 mb-3 text-xs flex items-center justify-between gap-2" style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}>
                                  <span>No matching{scopeNote} events scheduled yet — this will generate nothing until fixtures exist.</span>
                                  <Link href="/dashboard/calendar" className="font-semibold whitespace-nowrap underline underline-offset-2">Add fixtures →</Link>
                                </div>
                              )
                            })()}
                            <div className="flex gap-2">
                              <button onClick={() => handleAddCommitment(contract.id)} disabled={savingCommitment}
                                className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40" style={{ background: INK, color: FOG }}>
                                {savingCommitment ? 'Saving...' : 'Add commitment'}
                              </button>
                              <button onClick={() => setShowCommitmentForm(null)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {comList.length === 0 ? (
                          <p className="text-sm py-2" style={{ color: SLATE }}>No commitments yet. Add what this sponsor was promised — the calendar fills in the per-event tasks automatically.</p>
                        ) : (
                          <div className="space-y-2">
                            {comList.map(cm => (
                              <div key={cm.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#F5F2ED' }}>
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BLUE }} />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: INK }}>{cm.description || cm.assets?.name || 'Deliverable'}</p>
                                    <p className="text-xs" style={{ color: SLATE }}>
                                      {recurrenceSummary(cm)} · {cm.proof_type}
                                      {cm.quantity > 1 ? ` · ${cm.quantity}×` : ''}
                                      {cm.club ? ` · ${cm.club}` : ''}
                                    </p>
                                    {(() => {
                                      const n = coverageFor(cm)
                                      if (n === null) return null
                                      return n > 0
                                        ? <p className="text-[11px] mt-0.5 font-medium" style={{ color: BLUE }}>{n} matching event{n !== 1 ? 's' : ''} scheduled</p>
                                        : <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#B8734A' }}>No matching events yet · <Link href="/dashboard/calendar" className="underline underline-offset-2">add fixtures</Link></p>
                                    })()}
                                  </div>
                                </div>
                                <button onClick={() => archiveCommitment(cm.id, contract.id)} className="ml-4 p-1 rounded flex-shrink-0 text-[11px] font-medium" style={{ color: SLATE }}
                                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#B8734A')}
                                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = SLATE)}>
                                  Archive
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Media hits */}
                      <div style={{ borderTop: `1px solid ${BORDER}` }} className="pt-5">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: SLATE }}>Media Coverage</h3>
                            {totalMV > 0 && (
                              <p className="text-xs mt-0.5" style={{ color: SLATE }}>
                                Estimated value: <span className="font-semibold" style={{ color: INK }}>€{totalMV.toLocaleString('nb-NO')}</span>
                              </p>
                            )}
                          </div>
                          <button onClick={() => setShowMediaForm(showMediaForm === contract.id ? null : contract.id)}
                            className="text-xs font-medium flex items-center gap-1.5" style={{ color: BLUE }}
                            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.75')}
                            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Log media hit
                          </button>
                        </div>

                        {showMediaForm === contract.id && (
                          <div className="rounded-xl p-4 mb-4" style={{ background: '#F5F2ED', border: `1px solid ${BORDER}` }}>
                            <p className="text-xs mb-4" style={{ color: SLATE }}>Log earned media coverage. Estimated values are calculated automatically and included in your report ROI.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                              <div>
                                <label style={lbl()}>Media type</label>
                                <select style={sel()} value={mediaForm.media_type} onChange={e => updMd('media_type', e.target.value)}>
                                  {MEDIA_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={lbl()}>Outlet / publication</label>
                                <input style={inp()} placeholder="e.g. Sandnesposten, TV2 Sport..." value={mediaForm.outlet_name} onChange={e => updMd('outlet_name', e.target.value)} />
                              </div>
                              <div>
                                <label style={lbl()}>Estimated {selectedMediaType.unit}</label>
                                <input type="number" style={inp()} placeholder="e.g. 12 000" value={mediaForm.reach} onChange={e => updMd('reach', e.target.value)} />
                                <p className="text-xs mt-1" style={{ color: SLATE }}>
                                  Default CPM: €{selectedMediaType.defaultCpm} · Estimated value: €{mediaForm.reach ? Math.round(parseInt(mediaForm.reach) * (mediaForm.cpm_override ? parseInt(mediaForm.cpm_override) : selectedMediaType.defaultCpm) / 1000).toLocaleString('nb-NO') : '—'}
                                </p>
                              </div>
                              <div>
                                <label style={lbl()}>CPM override (optional)</label>
                                <input type="number" style={inp()} placeholder={`Default: ${selectedMediaType.defaultCpm}`} value={mediaForm.cpm_override} onChange={e => updMd('cpm_override', e.target.value)} />
                                <p className="text-xs mt-1" style={{ color: SLATE }}>Leave blank to use the default rate</p>
                              </div>
                              <div>
                                <label style={lbl()}>Date of coverage</label>
                                <input type="date" style={inp()} value={mediaForm.hit_date} onChange={e => updMd('hit_date', e.target.value)} />
                              </div>
                              <div>
                                <label style={lbl()}>Notes (optional)</label>
                                <input style={inp()} placeholder="e.g. Front page feature, 3-minute segment..." value={mediaForm.notes} onChange={e => updMd('notes', e.target.value)} />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleAddMediaHit(contract.id)} disabled={savingMedia || !mediaForm.outlet_name || !mediaForm.reach}
                                className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40" style={{ background: INK, color: FOG }}>
                                {savingMedia ? 'Saving...' : 'Log media hit'}
                              </button>
                              <button onClick={() => setShowMediaForm(null)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {hits.length === 0 ? (
                          <p className="text-sm py-2" style={{ color: SLATE }}>No media hits logged yet. Log coverage as it happens — TV, newspaper, radio, online.</p>
                        ) : (
                          <div className="space-y-2">
                            {hits.map(hit => {
                              const val = mediaValue(hit)
                              const mt = MEDIA_TYPES.find(m => m.value === hit.media_type)
                              return (
                                <div key={hit.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#F5F2ED' }}>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium" style={{ color: INK }}>{hit.outlet_name}</p>
                                    <p className="text-xs" style={{ color: SLATE }}>
                                      {mt?.label} · {hit.reach.toLocaleString('nb-NO')} {mt?.unit}
                                      {hit.hit_date && ` · ${new Date(hit.hit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                    </p>
                                    {hit.notes && <p className="text-xs mt-0.5 italic" style={{ color: SLATE }}>{hit.notes}</p>}
                                  </div>
                                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                    <span className="text-sm font-semibold" style={{ color: INK }}>€{val.toLocaleString('nb-NO')}</span>
                                    <button onClick={() => deleteMediaHit(hit.id, contract.id)} className="p-1 rounded" style={{ color: SLATE }}
                                      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#DC2626')}
                                      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = SLATE)}>
                                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
                              <span className="text-[11px] uppercase tracking-widest font-medium" style={{ color: SLATE }}>Total estimated media value</span>
                              <span className="text-sm font-bold" style={{ color: INK }}>€{totalMV.toLocaleString('nb-NO')}</span>
                            </div>
                          </div>
                        )}
                        <p className="text-xs mt-3" style={{ color: SLATE }}>Values are indicative estimates based on international CPM benchmarks. Actual value may vary.</p>
                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </main>
    </div>
  )
}
