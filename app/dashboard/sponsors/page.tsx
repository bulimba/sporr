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

const SPONSOR_TIERS: Record<string, { label: string; order: number; bg: string; text: string; border: string; description?: string }> = {
  community: { label: 'Bronze',   order: 4, bg: '#FDF4EC', text: '#92400E', border: '#FCD9A8' },
  official:  { label: 'Silver',   order: 3, bg: '#F4F5F6', text: '#374151', border: '#D1D5DB' },
  principal: { label: 'Gold',     order: 2, bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  title:     { label: 'Platinum', order: 1, bg: '#F0F4FF', text: '#3730A3', border: '#C7D2FE' },
  diamond:   { label: 'Diamond',  order: 0, bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
  csr:       { label: 'CSR',      order: 5, bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', description: 'Community & social responsibility' },
}

const COMMERCIAL_TIERS = [
  { value: 'community', label: 'Bronze',   sublabel: 'Entry level support' },
  { value: 'official',  label: 'Silver',   sublabel: 'Official sponsor' },
  { value: 'principal', label: 'Gold',     sublabel: 'Principal sponsor' },
  { value: 'title',     label: 'Platinum', sublabel: 'Title sponsor' },
  { value: 'diamond',   label: 'Diamond',  sublabel: 'Premium partner' },
]
const CSR_TIER = { value: 'csr', label: 'CSR', sublabel: 'Community & social responsibility' }

// ── Types ─────────────────────────────────────────────────────────────────────
type Sponsor = {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  industry: string | null
  notes: string | null
  health_score: number
  sponsorship_tier: string | null
}

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null
  const meta = SPONSOR_TIERS[tier] || SPONSOR_TIERS.community
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase"
      style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}>
      {meta.label}
    </span>
  )
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const INK   = '#081216'
const FOG   = '#E7ECEF'
const SLATE = '#6E7F86'
const BLUE  = '#147BFF'
const BG    = '#F5F2ED'
const WHITE = '#FFFFFF'
const SIDE  = '#0A1A1F'
const BORDER = 'rgba(8,18,22,0.08)'

const inpStyle: React.CSSProperties = { width: '100%', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, color: INK, outline: 'none', fontFamily: 'inherit' }
const lblStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }

// ── Tier selector component ───────────────────────────────────────────────────
function TierSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={lblStyle}>Sponsor tier</label>
      <p className="text-xs mb-3" style={{ color: SLATE }}>
        Your classification of this relationship. Choose whatever fits your partnership model.
      </p>

      {/* Commercial tiers */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
        {COMMERCIAL_TIERS.map(tier => {
          const selected = value === tier.value
          const meta = SPONSOR_TIERS[tier.value]
          return (
            <button key={tier.value} type="button" onClick={() => onChange(tier.value)}
              className="text-left rounded-xl p-3 border-2 transition-all"
              style={{ borderColor: selected ? meta.border : BORDER, background: selected ? meta.bg : WHITE }}>
              <p className="text-xs font-bold mb-0.5" style={{ color: selected ? meta.text : INK }}>{tier.label}</p>
              <p className="text-[10px]" style={{ color: SLATE }}>{tier.sublabel}</p>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 h-px" style={{ background: BORDER }} />
        <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: SLATE }}>Community &amp; Social</span>
        <div className="flex-1 h-px" style={{ background: BORDER }} />
      </div>

      {/* CSR tier — full width, with description */}
      <button type="button" onClick={() => onChange(CSR_TIER.value)}
        className="w-full text-left rounded-xl p-3 border-2 transition-all"
        style={{
          borderColor: value === 'csr' ? SPONSOR_TIERS.csr.border : BORDER,
          background: value === 'csr' ? SPONSOR_TIERS.csr.bg : WHITE,
        }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold mb-0.5" style={{ color: value === 'csr' ? SPONSOR_TIERS.csr.text : INK }}>CSR</p>
            <p className="text-[10px]" style={{ color: SLATE }}>Community &amp; social responsibility — one-off or ongoing</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C5.24 2 3 4.24 3 7c0 3.5 5 9 5 9s5-5.5 5-9c0-2.76-2.24-5-5-5z" stroke={value === 'csr' ? SPONSOR_TIERS.csr.text : SLATE} strokeWidth="1.2"/>
              <circle cx="8" cy="7" r="1.5" fill={value === 'csr' ? SPONSOR_TIERS.csr.text : SLATE}/>
            </svg>
          </div>
        </div>
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SponsorsPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [sponsors, setSponsors]           = useState<Sponsor[]>([])
  const [orgId, setOrgId]                 = useState<string | null>(null)
  const [orgName, setOrgName]             = useState('')
  const [planTier, setPlanTier]           = useState('foundation')
  const [clubPrimary, setClubPrimary]     = useState(INK)
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [expandedId, setExpandedId]       = useState<string | null>(null)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting]           = useState(false)
  const [editForm, setEditForm]           = useState<Partial<Sponsor & { sponsorship_tier: string }>>({})
  const [savingEdit, setSavingEdit]       = useState(false)

  const [form, setForm] = useState({
    company_name: '', contact_name: '', contact_email: '',
    contact_phone: '', industry: '', notes: '', sponsorship_tier: 'community',
  })

  const upd     = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))
  const updEdit = (f: string, v: string) => setEditForm(p => ({ ...p, [f]: v }))

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: userData } = await supabase.from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      setOrgId(userData.org_id)

      const { data: orgData } = await supabase.from('organisations').select('tier, name, club_colour_primary').eq('id', userData.org_id).single()
      setPlanTier(normaliseTier(orgData?.tier))
      setOrgName(orgData?.name || '')
      setClubPrimary(orgData?.club_colour_primary || INK)

      const { data: sponsorsData } = await supabase
        .from('sponsors')
        .select('id, company_name, contact_name, contact_email, contact_phone, industry, notes, health_score, sponsorship_tier')
        .eq('org_id', userData.org_id)
        .order('company_name')

      setSponsors(sponsorsData || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAddSponsor() {
    if (!form.company_name) { setError('Company name is required'); return }
    if (!orgId) return
    setSaving(true); setError(null)

    const { data, error: saveError } = await supabase.from('sponsors').insert({
      org_id: orgId,
      company_name: form.company_name,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      industry: form.industry || null,
      notes: form.notes || null,
      sponsorship_tier: form.sponsorship_tier,
    }).select().single()

    if (saveError) { setError(saveError.message); setSaving(false); return }

    setSponsors(prev => [...prev, data as Sponsor].sort((a, b) => a.company_name.localeCompare(b.company_name)))
    setForm({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', industry: '', notes: '', sponsorship_tier: 'community' })
    setShowForm(false); setSaving(false)
  }

  function startEdit(sponsor: Sponsor) {
    setEditingId(sponsor.id)
    setEditForm({
      company_name:     sponsor.company_name,
      contact_name:     sponsor.contact_name  || '',
      contact_email:    sponsor.contact_email || '',
      contact_phone:    sponsor.contact_phone || '',
      industry:         sponsor.industry      || '',
      notes:            sponsor.notes         || '',
      sponsorship_tier: sponsor.sponsorship_tier || 'community',
    })
  }

  async function handleSaveEdit(sponsorId: string) {
    setSavingEdit(true)
    const { error: updateError } = await supabase.from('sponsors').update({
      company_name:     editForm.company_name     || '',
      contact_name:     editForm.contact_name     || null,
      contact_email:    editForm.contact_email    || null,
      contact_phone:    editForm.contact_phone    || null,
      industry:         editForm.industry         || null,
      notes:            editForm.notes            || null,
      sponsorship_tier: editForm.sponsorship_tier || 'community',
    }).eq('id', sponsorId)

    if (updateError) { alert(updateError.message); setSavingEdit(false); return }

    setSponsors(prev => prev.map(s => s.id === sponsorId ? { ...s, ...editForm as Sponsor } : s))
    setEditingId(null); setSavingEdit(false)
  }

  async function handleDelete(sponsorId: string) {
    setDeleting(true)
    await supabase.from('contracts').delete().eq('sponsor_id', sponsorId)
    const { error } = await supabase.from('sponsors').delete().eq('id', sponsorId)
    if (error) { alert('Could not delete sponsor: ' + error.message); setDeleting(false); return }
    setSponsors(prev => prev.filter(s => s.id !== sponsorId))
    setExpandedId(null); setConfirmDeleteId(null); setDeleting(false)
  }

  const planLabel = PLAN_TIER_LABELS[planTier] || 'Foundation'

  const commercialSponsors = sponsors.filter(s => s.sponsorship_tier !== 'csr')
    .sort((a, b) => (SPONSOR_TIERS[a.sponsorship_tier || 'community']?.order ?? 9) - (SPONSOR_TIERS[b.sponsorship_tier || 'community']?.order ?? 9))
  const csrSponsors = sponsors.filter(s => s.sponsorship_tier === 'csr')

  // ── Sponsor row ─────────────────────────────────────────────────────────────
  const SponsorRow = ({ sponsor }: { sponsor: Sponsor }) => {
    const expanded = expandedId === sponsor.id
    const editing  = editingId  === sponsor.id
    const confirming = confirmDeleteId === sponsor.id

    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
        {/* Tier colour top border */}
        <div className="h-0.5 w-full" style={{ background: SPONSOR_TIERS[sponsor.sponsorship_tier || 'community']?.border || BORDER }} />

        {/* Header row */}
        <div className="px-5 py-4 cursor-pointer"
          onClick={() => { setExpandedId(expanded ? null : sponsor.id); setEditingId(null); setConfirmDeleteId(null) }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                <p className="text-sm font-semibold" style={{ color: INK }}>{sponsor.company_name}</p>
                <TierBadge tier={sponsor.sponsorship_tier} />
              </div>
              <p className="text-xs" style={{ color: SLATE }}>
                {[sponsor.contact_name, sponsor.industry].filter(Boolean).join(' · ') || 'No contact details'}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Health score */}
              <div className="hidden sm:block text-right">
                <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: SLATE }}>Health</p>
                <p className="text-sm font-semibold" style={{
                  color: sponsor.health_score >= 70 ? '#16A34A' : sponsor.health_score >= 40 ? '#D97706' : '#DC2626'
                }}>{sponsor.health_score}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                style={{ color: SLATE, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="px-5 pb-5" style={{ borderTop: `1px solid ${BORDER}` }}>

            {/* Delete confirmation */}
            {confirming && (
              <div className="mt-5 px-4 py-4 rounded-xl mb-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#991B1B' }}>Delete {sponsor.company_name}?</p>
                <p className="text-xs leading-relaxed mb-4" style={{ color: '#B91C1C' }}>
                  This will permanently remove the sponsor and all linked contracts, obligations, and media hits. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(sponsor.id)} disabled={deleting}
                    className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                    style={{ background: '#DC2626', color: WHITE }}>
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Edit form */}
            {editing ? (
              <div className="mt-5 space-y-4">
                <TierSelector value={editForm.sponsorship_tier || 'community'} onChange={v => updEdit('sponsorship_tier', v)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label style={lblStyle}>Company name</label><input style={inpStyle} value={editForm.company_name || ''} onChange={e => updEdit('company_name', e.target.value)} /></div>
                  <div><label style={lblStyle}>Industry</label><input style={inpStyle} value={editForm.industry || ''} onChange={e => updEdit('industry', e.target.value)} /></div>
                  <div><label style={lblStyle}>Contact name</label><input style={inpStyle} value={editForm.contact_name || ''} onChange={e => updEdit('contact_name', e.target.value)} /></div>
                  <div><label style={lblStyle}>Contact email</label><input type="email" style={inpStyle} value={editForm.contact_email || ''} onChange={e => updEdit('contact_email', e.target.value)} /></div>
                  <div><label style={lblStyle}>Contact phone</label><input style={inpStyle} value={editForm.contact_phone || ''} onChange={e => updEdit('contact_phone', e.target.value)} /></div>
                </div>
                <div><label style={lblStyle}>Notes</label><textarea style={{ ...inpStyle, height: 80, resize: 'none' }} value={editForm.notes || ''} onChange={e => updEdit('notes', e.target.value)} /></div>
                <div className="flex gap-2">
                  <button onClick={() => handleSaveEdit(sponsor.id)} disabled={savingEdit}
                    className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                    style={{ background: INK, color: FOG }}>
                    {savingEdit ? 'Saving...' : 'Save changes'}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>Cancel</button>
                </div>
              </div>
            ) : (
              /* Read-only detail */
              <div className="mt-5">
                {/* CSR note */}
                {sponsor.sponsorship_tier === 'csr' && (
                  <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg mb-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 flex-shrink-0">
                      <path d="M7 2C4.79 2 3 3.79 3 6c0 3 4 7 4 7s4-4 4-7c0-2.21-1.79-4-4-4z" stroke="#16A34A" strokeWidth="1.1"/>
                      <circle cx="7" cy="6" r="1.2" fill="#16A34A"/>
                    </svg>
                    <p className="text-xs" style={{ color: '#166534' }}>CSR relationship — community or social responsibility support</p>
                  </div>
                )}

                <div className="space-y-0 mb-5">
                  {[
                    { label: 'Email',   value: sponsor.contact_email, href: `mailto:${sponsor.contact_email}` },
                    { label: 'Phone',   value: sponsor.contact_phone, href: `tel:${sponsor.contact_phone}` },
                    { label: 'Industry', value: sponsor.industry,     href: null },
                  ].filter(item => item.value).map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: '1px solid rgba(8,18,22,0.06)' }}>
                      <span className="text-xs" style={{ color: SLATE }}>{item.label}</span>
                      {item.href
                        ? <a href={item.href} className="text-sm font-medium" style={{ color: INK }}
                            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = BLUE)}
                            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = INK)}>
                            {item.value}
                          </a>
                        : <span className="text-sm font-medium" style={{ color: INK }}>{item.value}</span>
                      }
                    </div>
                  ))}
                  {sponsor.notes && (
                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: SLATE }}>Notes</p>
                      <p className="text-sm leading-relaxed" style={{ color: INK }}>{sponsor.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => startEdit(sponsor)}
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'rgba(8,18,22,0.06)', color: INK }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(8,18,22,0.1)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(8,18,22,0.06)')}>
                    Edit
                  </button>
                  <Link href="/dashboard/contracts"
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: INK, color: FOG }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#0F2A2E')}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = INK)}>
                    View contracts →
                  </Link>
                  <button onClick={() => setConfirmDeleteId(sponsor.id)}
                    className="px-3 py-2 text-sm ml-auto"
                    style={{ color: SLATE }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#DC2626')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = SLATE)}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div style={{ color: SLATE, fontSize: 13 }}>Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <main className="pb-16">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-bold tracking-tight mb-1"
                style={{ fontSize: 26, color: INK, letterSpacing: '-0.02em' }}>Sponsors</h1>
              <p style={{ fontSize: 14, color: SLATE }}>
                {sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''}
                {csrSponsors.length > 0 && ` · ${csrSponsors.length} CSR`}
              </p>
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: INK, color: FOG }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0F2A2E')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = INK)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add sponsor
            </button>
          </div>

          {/* Add sponsor form */}
          {showForm && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
              <h2 className="font-semibold mb-5" style={{ fontSize: 16, color: INK }}>New sponsor</h2>

              {error && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5"
                  style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
                    <path d="M8 2v7M8 11v2" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontSize: 13, color: '#92400E' }}>{error}</p>
                </div>
              )}

              {/* Tier selector */}
              <div className="mb-5">
                <TierSelector value={form.sponsorship_tier} onChange={v => upd('sponsorship_tier', v)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label style={lblStyle}>Company name *</label>
                  <input style={inpStyle} placeholder="Equinor ASA" value={form.company_name} onChange={e => upd('company_name', e.target.value)} />
                </div>
                <div>
                  <label style={lblStyle}>Industry</label>
                  <input style={inpStyle} placeholder="Energy, Finance, Property..." value={form.industry} onChange={e => upd('industry', e.target.value)} />
                </div>
                <div>
                  <label style={lblStyle}>Contact name</label>
                  <input style={inpStyle} placeholder="Marketing manager" value={form.contact_name} onChange={e => upd('contact_name', e.target.value)} />
                </div>
                <div>
                  <label style={lblStyle}>Contact email</label>
                  <input type="email" style={inpStyle} placeholder="contact@company.no" value={form.contact_email} onChange={e => upd('contact_email', e.target.value)} />
                </div>
                <div>
                  <label style={lblStyle}>Contact phone</label>
                  <input style={inpStyle} placeholder="+47..." value={form.contact_phone} onChange={e => upd('contact_phone', e.target.value)} />
                </div>
              </div>

              <div className="mb-5">
                <label style={lblStyle}>Notes</label>
                <textarea style={{ ...inpStyle, height: 80, resize: 'none' }}
                  placeholder="Any notes about this relationship..." value={form.notes} onChange={e => upd('notes', e.target.value)} />
              </div>

              <div className="flex items-center gap-3 mb-5">
                <button onClick={handleAddSponsor} disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ background: INK, color: FOG }}>
                  {saving ? 'Saving...' : 'Save sponsor'}
                </button>
                <button onClick={() => { setShowForm(false); setError(null) }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>Cancel</button>
              </div>

              {/* Next step prompt */}
              <div className="pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: SLATE }}>Next step</p>
                <p className="text-sm font-semibold mb-1" style={{ color: INK }}>Create a contract for this sponsor</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: SLATE }}>
                  A contract links your sponsor to a season, a value, and the specific obligations they&apos;ve paid for.
                </p>
                <Link href="/dashboard/contracts" className="text-sm font-medium underline underline-offset-2" style={{ color: INK }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = BLUE)}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = INK)}>
                  Go to Contracts →
                </Link>
              </div>
            </div>
          )}

          {/* Empty state */}
          {sponsors.length === 0 && !showForm && (
            <div className="rounded-2xl px-6 py-16 text-center" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#F5F2ED' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L12.39 7.26L18 8.18L14 12.08L14.95 17.66L10 15L5.05 17.66L6 12.08L2 8.18L7.61 7.26L10 2Z" stroke="#6E7F86" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-base font-semibold mb-1" style={{ color: INK }}>No sponsors yet</p>
              <p className="text-sm mb-5" style={{ color: SLATE }}>Add your first sponsor to get started.</p>
              <button onClick={() => setShowForm(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: INK, color: FOG }}>
                Add your first sponsor
              </button>
            </div>
          )}

          {/* Sponsor list — commercial sponsors */}
          {commercialSponsors.length > 0 && (
            <div className="space-y-3 mb-4">
              {commercialSponsors.map(s => <SponsorRow key={s.id} sponsor={s} />)}
            </div>
          )}

          {/* CSR sponsors — separated */}
          {csrSponsors.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: BORDER }} />
                <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: SLATE }}>Community &amp; CSR</span>
                <div className="flex-1 h-px" style={{ background: BORDER }} />
              </div>
              <div className="space-y-3">
                {csrSponsors.map(s => <SponsorRow key={s.id} sponsor={s} />)}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
