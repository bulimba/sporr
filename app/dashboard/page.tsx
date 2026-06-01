'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Tier system ───────────────────────────────────────────────────────────────
// Plan tiers = operational complexity (number of environments)
// Sponsor tiers = club's own classification of sponsor support level
// No feature gates on sponsors / contracts / users / captures / reports

const PLAN_TIER_LABELS: Record<string, string> = {
  foundation: 'Foundation', organisation: 'Organisation',
  portfolio: 'Portfolio', network: 'Network',
  free: 'Foundation', club: 'Organisation', pro: 'Portfolio', agency: 'Network',
}

function normaliseTier(raw: string | null | undefined): string {
  const map: Record<string, string> = {
    free: 'foundation', club: 'organisation', pro: 'portfolio', agency: 'network',
  }
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

type Organisation = {
  id: string; name: string; tier: string
  sports: string[] | null; logo_url: string | null
  show_logo_on_dashboard: boolean | null
  club_colour_primary: string | null; club_colour_secondary: string | null
}

type SponsorCard = {
  id: string; company_name: string; logo_url: string | null
  sponsorship_tier: string; contract_title: string; contract_value: number
  delivered: number; pending: number; total: number; health_score: number
}

type ProofEntry = {
  id: string; captured_at: string; photo_url: string | null
  obligation_description: string | null; sponsor_name: string | null
}

type AlertItem = {
  id: string; type: string; message: string; detail: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SPORT_KIT_MAP: Record<string, string> = {
  'Football': 'football', 'Rugby': 'rugby', 'Rugby league': 'rugby',
  'Rugby Union': 'rugby', 'Basketball': 'basketball', 'Volleyball': 'volleyball',
  'Handball': 'handball', 'Ice hockey': 'ice-hockey', 'Cycling': 'cycling',
  'Golf': 'golf', 'Swimming': 'swimming', 'Athletics': 'athletics',
}
const SUPABASE_STORAGE = 'https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public'
function getKitUrl(sports: string[] | null) {
  if (!sports?.length) return `${SUPABASE_STORAGE}/sporr-kits/generic.svg`
  return `${SUPABASE_STORAGE}/sporr-kits/${SPORT_KIT_MAP[sports[0]] || 'generic'}.svg`
}
function fmtCurrency(v: number) { return `€${v.toLocaleString('nb-NO')}` }
function fmtStorage(mb: number) { return mb < 1024 ? `${mb} MB` : `${(mb / 1024).toFixed(1)} GB` }

function TierBadge({ tier }: { tier: string }) {
  const meta = SPONSOR_TIERS[tier] || SPONSOR_TIERS.community
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase"
      style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}>
      {meta.label}
    </span>
  )
}

function Sparkline({ color = '#147BFF' }: { color?: string }) {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none">
      <path d="M0 22 L12 18 L24 20 L36 12 L48 15 L60 6 L72 9 L80 4"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [org, setOrg]               = useState<Organisation | null>(null)
  const [planTier, setPlanTier]     = useState<string>('foundation')
  const [userName, setUserName]     = useState('')
  const [sponsorCards, setSponsorCards] = useState<SponsorCard[]>([])
  const [recentProofs, setRecentProofs] = useState<ProofEntry[]>([])
  const [alerts, setAlerts]         = useState<AlertItem[]>([])
  const [activeSession, setActiveSession] = useState<{ id: string; token: string } | null>(null)
  const [nextEvent, setNextEvent]   = useState<{ title: string; venue: string | null; starts_at: string | null } | null>(null)
  const [photoCount, setPhotoCount] = useState(0)
  const [storageMB, setStorageMB]   = useState(0)
  const [stats, setStats]           = useState({ pending: 0, delivered: 0, total: 0 })
  const [loading, setLoading]       = useState(true)
  const currentSeason = '2025/26'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
      setUserName(metaName.split(' ')[0] || '')

      const { data: userData } = await supabase.from('users').select('org_id, full_name').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      if (userData.full_name && !metaName) setUserName(userData.full_name.split(' ')[0])

      const orgId = userData.org_id

      const [orgRes, obligationsRes, activeSessionRes, nextEventRes, recentProofsRes, sponsorContractsRes, photosRes] = await Promise.all([
        supabase.from('organisations').select('id,name,tier,sports,logo_url,show_logo_on_dashboard,club_colour_primary,club_colour_secondary').eq('id', orgId).single(),
        supabase.from('obligations').select('id,status,contract_id').eq('org_id', orgId).neq('status', 'not_applicable'),
        supabase.from('audit_sessions').select('id,session_token').eq('org_id', orgId).eq('status', 'active').order('created_at', { ascending: false }).limit(1),
        supabase.from('events').select('id,title,venue,starts_at').eq('org_id', orgId).gte('starts_at', new Date().toISOString().split('T')[0]).order('starts_at', { ascending: true }).limit(1),
        supabase.from('proofs').select('id,captured_at,photo_url,obligations(description,contracts(sponsors(company_name)))').eq('org_id', orgId).not('photo_url', 'is', null).order('captured_at', { ascending: false }).limit(6),
        supabase.from('contracts').select('id,title,sponsorship_tier,sponsor_id,value_nok,sponsors(id,company_name,logo_url,health_score)').eq('org_id', orgId).eq('status', 'active'),
        supabase.from('proofs').select('id', { count: 'exact' }).eq('org_id', orgId).not('photo_url', 'is', null),
      ])

      const rawTier = orgRes.data?.tier || 'foundation'
      setPlanTier(normaliseTier(rawTier))
      setOrg(orgRes.data)
      setPhotoCount(photosRes.count || 0)
      setStorageMB(photosRes.count || 0) // 1MB estimate per photo

      if (activeSessionRes.data?.[0]) setActiveSession({ id: activeSessionRes.data[0].id, token: activeSessionRes.data[0].session_token })
      if (nextEventRes.data?.[0]) setNextEvent(nextEventRes.data[0])

      const obs = obligationsRes.data || []
      setStats({ pending: obs.filter((o: any) => o.status === 'pending').length, delivered: obs.filter((o: any) => o.status === 'delivered').length, total: obs.length })

      if (recentProofsRes.data) {
        setRecentProofs((recentProofsRes.data as any[]).map(p => ({ id: p.id, captured_at: p.captured_at, photo_url: p.photo_url, obligation_description: p.obligations?.description || null, sponsor_name: p.obligations?.contracts?.sponsors?.company_name || null })))
      }

      if (sponsorContractsRes.data) {
        const contracts = sponsorContractsRes.data as any[]
        const contractIds = contracts.map(c => c.id)
        const { data: oblData } = contractIds.length ? await supabase.from('obligations').select('contract_id,status').in('contract_id', contractIds).neq('status', 'not_applicable') : { data: [] }

        const cards: SponsorCard[] = contracts.map(c => {
          const cobs = (oblData || []).filter((o: any) => o.contract_id === c.id)
          return { id: c.sponsor_id, company_name: c.sponsors?.company_name || '—', logo_url: c.sponsors?.logo_url || null, sponsorship_tier: c.sponsorship_tier || 'community', contract_title: c.title || '—', contract_value: c.value_nok || 0, delivered: cobs.filter((o: any) => o.status === 'delivered').length, pending: cobs.filter((o: any) => o.status === 'pending').length, total: cobs.length, health_score: c.sponsors?.health_score || 0 }
        })
        cards.sort((a, b) => (SPONSOR_TIERS[a.sponsorship_tier]?.order ?? 9) - (SPONSOR_TIERS[b.sponsorship_tier]?.order ?? 9))
        setSponsorCards(cards)

        const alertList: AlertItem[] = []
        const pendingCount = obs.filter((o: any) => o.status === 'pending').length
        if (pendingCount > 0) alertList.push({ id: 'obl-1', type: 'overdue_deliverable', message: `${pendingCount} deliverable${pendingCount > 1 ? 's' : ''} pending`, detail: 'Require attention' })
        setAlerts(alertList)
      }

      setLoading(false)
    }
    load()
  }, [])

  const clubPrimary  = org?.club_colour_primary || '#081216'
  const showCrest    = org?.show_logo_on_dashboard && org?.logo_url
  const kitUrl       = getKitUrl(org?.sports || null)
  const deliveryPct  = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0
  const avgConf      = sponsorCards.length > 0 ? Math.round(sponsorCards.reduce((s, c) => s + (c.health_score || 70), 0) / sponsorCards.length) : deliveryPct
  const planLabel    = PLAN_TIER_LABELS[planTier] || 'Foundation'

  const captureStatus = activeSession ? 'active'
    : nextEvent ? (nextEvent.starts_at && new Date(nextEvent.starts_at).toDateString() === new Date().toDateString() ? 'match-day' : 'upcoming')
    : 'idle'

  // Portfolio upsell — soft, not a hard block
  const showPortfolioUpsell = planTier === 'foundation' || planTier === 'organisation'

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F2ED' }}><div style={{ color: '#6E7F86', fontSize: 13 }}>Loading...</div></div>

  return (
    <div className="min-h-screen" style={{ background: '#F5F2ED' }}>
      <main className="pb-24 lg:pb-10">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-bold tracking-tight mb-1" style={{ fontSize: 'clamp(22px, 3vw, 28px)', color: '#081216', letterSpacing: '-0.02em' }}>
                {greeting}{userName ? `, ${userName}.` : '.'}
              </h1>
              <p style={{ fontSize: 14, color: '#6E7F86' }}>Here&apos;s what&apos;s happening with your partnerships today.</p>
            </div>
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              <Link href="/dashboard/audit" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: '#081216', color: '#E7ECEF' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
                Quick capture
              </Link>
              <button className="relative p-2 rounded-lg" style={{ color: '#6E7F86' }} aria-label="Notifications"
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#081216')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#6E7F86')}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2.5A5.5 5.5 0 004.5 8v3.5L3 13h14l-1.5-1.5V8A5.5 5.5 0 0010 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8.5 13v.5a1.5 1.5 0 003 0V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {alerts.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#B8734A' }} />}
              </button>
            </div>
          </div>

          {/* Portfolio upsell — soft, informational only, not a block */}
          {showPortfolioUpsell && sponsorCards.length >= 3 && (
            <div className="flex items-start justify-between gap-4 px-5 py-4 rounded-xl mb-5" style={{ background: '#F0F9FF', border: '1px solid #BFDBFE' }}>
              <div>
                <p className="text-sm font-medium mb-0.5" style={{ color: '#1E40AF' }}>Managing multiple operational contexts?</p>
                <p className="text-xs" style={{ color: '#3B82F6' }}>Portfolio plan unlocks roll-up reporting and cross-environment visibility.</p>
              </div>
              <Link href="/dashboard/club" className="text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: '#1E40AF', color: '#FFFFFF' }}>Learn more</Link>
            </div>
          )}

          {/* ROW 1: Today's Operational Status + Metric stack */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mb-5">
            <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 300 }}>
              <img src="/images/hero-stadium-night_3.jpg" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 40%', opacity: 0.65 }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(8,18,22,0.93) 0%, rgba(15,30,36,0.78) 55%, rgba(8,18,22,0.35) 100%)' }} />
              <div className="relative z-10 p-7 h-full flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: '#6E7F86' }}>Today&apos;s Operational Status</p>
                  <h2 className="font-bold leading-tight mb-5" style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', color: '#E7ECEF', letterSpacing: '-0.02em' }}>
                    {captureStatus === 'active' ? 'Capture session active' : captureStatus === 'match-day' ? 'Capture session ready to start' : nextEvent ? 'Upcoming fixture scheduled' : 'No active session'}
                  </h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 flex-shrink-0"><rect x="1" y="2" width="12" height="11" rx="1.5" stroke="#6E7F86" strokeWidth="1.2"/><path d="M4 1v2M10 1v2M1 5h12" stroke="#6E7F86" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      <div><span className="text-xs" style={{ color: '#6E7F86' }}>Next fixture  </span><span className="text-xs font-medium" style={{ color: '#E7ECEF' }}>{nextEvent?.title ? `${nextEvent.title}${nextEvent.starts_at ? ' · ' + new Date(nextEvent.starts_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}` : 'None scheduled'}</span></div>
                    </div>
                    {nextEvent?.venue && (
                      <div className="flex items-center gap-3">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1C4.79 1 3 2.79 3 5c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z" stroke="#6E7F86" strokeWidth="1.2"/><circle cx="7" cy="5" r="1.5" stroke="#6E7F86" strokeWidth="1.2"/></svg>
                        <span className="text-xs" style={{ color: '#6E7F86' }}>Venue  </span><span className="text-xs font-medium" style={{ color: '#E7ECEF' }}>{nextEvent.venue}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="4" width="12" height="8" rx="1.5" stroke="#6E7F86" strokeWidth="1.2"/><circle cx="7" cy="8" r="2" stroke="#6E7F86" strokeWidth="1.2"/><path d="M5 4l1-2h2l1 2" stroke="#6E7F86" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className="text-xs" style={{ color: '#6E7F86' }}>Session status  </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: captureStatus === 'active' ? clubPrimary : 'rgba(255,255,255,0.1)', color: '#E7ECEF' }}>
                        {captureStatus === 'active' ? 'Active' : captureStatus === 'match-day' ? 'Match day' : captureStatus === 'upcoming' ? 'Upcoming' : 'Not started'}
                      </span>
                    </div>
                  </div>
                </div>
                <Link href={captureStatus === 'active' && activeSession ? `/audit/${activeSession.token}` : '/dashboard/audit'}
                  className="inline-flex items-center gap-2.5 self-start px-5 py-3 rounded-xl font-semibold text-sm" style={{ background: '#147BFF', color: '#FFFFFF' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#0E6AE0')}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#147BFF')}>
                  {captureStatus === 'active' ? 'Resume capture session' : 'Start capture session'}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Renewal Confidence */}
              <Link href="/dashboard/sponsors" className="flex items-center justify-between px-5 py-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(8,18,22,0.07)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(8,18,22,0.15)')}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(8,18,22,0.07)')}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: avgConf >= 80 ? '#DCFCE7' : avgConf >= 60 ? '#FEF3C7' : '#FEE2E2' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9l-3 1.5.5-3.5L2 4.5 5.5 4 7 1z" stroke={avgConf >= 80 ? '#16A34A' : avgConf >= 60 ? '#D97706' : '#DC2626'} strokeWidth="1.1" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-medium mb-0.5" style={{ color: '#6E7F86' }}>Renewal Confidence</p>
                    <p className="text-2xl font-bold leading-none" style={{ color: '#081216' }}>{avgConf}<span className="text-sm font-normal" style={{ color: '#6E7F86' }}>%</span></p>
                    <p className="text-xs" style={{ color: '#6E7F86' }}>{avgConf >= 80 ? 'Very strong' : avgConf >= 60 ? 'On track' : 'At risk'}</p>
                  </div>
                </div>
                <Sparkline color="#147BFF" />
              </Link>

              {/* Verification Completion */}
              <Link href="/dashboard/calendar" className="flex items-center justify-between px-5 py-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(8,18,22,0.07)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(8,18,22,0.15)')}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(8,18,22,0.07)')}>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[10px] uppercase tracking-widest font-medium mb-0.5" style={{ color: '#6E7F86' }}>Verification Completion</p>
                  <p className="text-2xl font-bold leading-none mb-2" style={{ color: '#081216' }}>{deliveryPct}<span className="text-sm font-normal" style={{ color: '#6E7F86' }}>%  On track</span></p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E7ECEF' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(deliveryPct, 2)}%`, background: '#147BFF' }} />
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="#6E7F86" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>

              {/* Partnership Health */}
              <div className="flex items-center justify-between px-5 py-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(8,18,22,0.07)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#DCFCE7' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-medium mb-0.5" style={{ color: '#6E7F86' }}>Partnership Health</p>
                    <p className="text-lg font-bold" style={{ color: '#081216' }}>Good</p>
                    <p className="text-xs" style={{ color: '#6E7F86' }}>No critical issues</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="#6E7F86" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>

              {/* Deliverables Pending */}
              <Link href="/dashboard/calendar" className="flex items-center justify-between px-5 py-4 rounded-2xl"
                style={{ background: '#FFFFFF', border: `1px solid ${stats.pending > 0 ? '#FCD34D' : 'rgba(8,18,22,0.07)'}` }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = stats.pending > 0 ? '#F59E0B' : 'rgba(8,18,22,0.15)')}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = stats.pending > 0 ? '#FCD34D' : 'rgba(8,18,22,0.07)')}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: stats.pending > 0 ? '#FEF3C7' : '#F0F9FF' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke={stats.pending > 0 ? '#D97706' : '#6E7F86'} strokeWidth="1.2"/><path d="M4 7h6M4 4.5h6M4 9.5h3" stroke={stats.pending > 0 ? '#D97706' : '#6E7F86'} strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-medium mb-0.5" style={{ color: '#6E7F86' }}>Deliverables Pending</p>
                    <p className="text-2xl font-bold leading-none" style={{ color: '#081216' }}>{stats.pending}</p>
                    <p className="text-xs" style={{ color: '#6E7F86' }}>{stats.pending > 0 ? 'Require attention' : 'All on track'}</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="#6E7F86" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </div>

          {/* ROW 2: Sponsor Overview */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6E7F86' }}>Sponsor Overview</p>
              <Link href="/dashboard/sponsors" className="text-xs" style={{ color: '#6E7F86' }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#081216')}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#6E7F86')}>View all sponsors →</Link>
            </div>
            {sponsorCards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {sponsorCards.map(card => {
                  const pct = card.total > 0 ? Math.round((card.delivered / card.total) * 100) : 0
                  const allDone = card.pending === 0 && card.total > 0
                  const allocated = card.contract_value > 0 ? Math.round((card.delivered / Math.max(card.total, 1)) * card.contract_value) : 0
                  return (
                    <Link key={card.id} href="/dashboard/calendar" className="block rounded-2xl overflow-hidden"
                      style={{ background: '#FFFFFF', border: '1px solid rgba(8,18,22,0.07)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(8,18,22,0.15)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(8,18,22,0.07)')}>
                      <div className="h-0.5 w-full" style={{ background: clubPrimary }} />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: '#F5F2ED', border: '1px solid rgba(8,18,22,0.06)' }}>
                              {card.logo_url ? <img src={card.logo_url} alt="" className="w-full h-full object-contain p-0.5" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-xs font-bold" style={{ color: '#6E7F86' }}>{card.company_name.charAt(0)}</span></div>}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: '#081216' }}>{card.company_name}</p>
                              <p className="text-xs truncate" style={{ color: '#6E7F86' }}>{card.contract_title}</p>
                            </div>
                          </div>
                          <TierBadge tier={card.sponsorship_tier} />
                        </div>
                        {card.contract_value > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(8,18,22,0.06)' }}>
                            {[{ label: 'Committed', value: fmtCurrency(card.contract_value) }, { label: 'Allocated', value: fmtCurrency(allocated) }, { label: 'Remaining', value: fmtCurrency(card.contract_value - allocated) }].map(({ label, value }) => (
                              <div key={label}><p className="text-xs font-medium" style={{ color: '#081216' }}>{value}</p><p className="text-[10px]" style={{ color: '#6E7F86' }}>{label}</p></div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs" style={{ color: '#6E7F86' }}><span className="font-medium" style={{ color: '#081216' }}>{pct}% </span>delivered</p>
                          <p className="text-xs font-medium" style={{ color: allDone ? '#36B37E' : card.pending > 0 ? '#B8734A' : '#6E7F86' }}>{allDone ? 'On track' : card.pending > 0 ? `${card.pending} pending` : '—'}</p>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#E7ECEF' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: allDone ? '#36B37E' : pct >= 60 ? '#147BFF' : '#B8734A' }} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: allDone ? '#36B37E' : card.pending > 0 ? '#B8734A' : '#6E7F86' }} />
                          <span className="text-xs" style={{ color: '#6E7F86' }}>{allDone ? 'Complete' : card.pending > 0 ? `${card.pending} pending` : 'No deliverables'}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl px-6 py-10 text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(8,18,22,0.07)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: '#081216' }}>No active sponsors</p>
                <p className="text-sm mb-4" style={{ color: '#6E7F86' }}>Add your first sponsor to start tracking deliverables.</p>
                <Link href="/dashboard/sponsors" className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl" style={{ background: '#081216', color: '#E7ECEF' }}>Add sponsor →</Link>
              </div>
            )}
          </div>

          {/* ROW 3: Commercial overview */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#6E7F86' }}>Commercial Overview</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { title: 'Financial Summary', href: '/dashboard/financial', rows: [['Contracted Revenue', '—'], ['Collected Revenue', '—'], ['Outstanding', '—'], ['Collection Rate', '—']] },
                { title: 'Pipeline Overview', href: '/dashboard/pipeline', rows: [['Pipeline Value', '—'], ['Lead', '—'], ['Proposal Sent', '—'], ['Negotiating', '—']] },
                { title: 'Payment Tracker', href: '/dashboard/payments', rows: [['Outstanding Invoices', '—'], ['0–30 days', '—'], ['31–60 days', '—'], ['61–90 days', '—']] },
                { title: 'Renewal Performance', href: '/dashboard/renewals', rows: [['Renewal Rate', '—'], ['Renewed', '—'], ['At Risk', '—'], ['Not Renewed', '—']] },
              ].map(({ title, href, rows }) => (
                <Link key={title} href={href} className="rounded-2xl p-5"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(8,18,22,0.07)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(8,18,22,0.15)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(8,18,22,0.07)')}>
                  <p className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: '#6E7F86' }}>{title}</p>
                  <div className="space-y-2">
                    {rows.map(([label, val], i) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[11px]" style={{ color: '#6E7F86' }}>{label}</span>
                        <span className="text-[11px] font-medium" style={{ color: i === 0 ? '#081216' : '#6E7F86' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-4" style={{ color: '#147BFF' }}>View details →</p>
                </Link>
              ))}
            </div>
          </div>

          {/* ROW 4: Bottom sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Category Exclusivity */}
            <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(8,18,22,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6E7F86' }}>Category Exclusivity</p>
                <Link href="/dashboard/exclusivity" className="text-xs" style={{ color: '#147BFF' }}>View all</Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['Food & Beverage', 'Banking', 'Automotive', 'Energy', 'Telecoms', 'Travel'].map((cat, i) => (
                  <div key={cat} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: i < sponsorCards.length ? '#F0F9FF' : '#FAFAF7', border: '1px solid rgba(8,18,22,0.06)' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: i < sponsorCards.length ? '#147BFF' : '#D1D5DB' }} />
                    <span className="text-[11px] truncate" style={{ color: '#081216' }}>{cat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Alerts */}
            <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(8,18,22,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6E7F86' }}>Operational Alerts</p>
                <Link href="/dashboard/alerts" className="text-xs" style={{ color: '#147BFF' }}>View all</Link>
              </div>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 pb-3" style={{ borderBottom: '1px solid rgba(8,18,22,0.05)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#FEF3C7' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v5M6 9v1" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#081216' }}>{alert.message}</p>
                        {alert.detail && <p className="text-xs mt-0.5" style={{ color: '#6E7F86' }}>{alert.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: '#DCFCE7' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#081216' }}>No active alerts</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6E7F86' }}>All systems operational</p>
                </div>
              )}
            </div>

            {/* Recent Verification Activity */}
            <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(8,18,22,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6E7F86' }}>Recent Verification Activity</p>
                <Link href="/dashboard/audit" className="text-xs" style={{ color: '#147BFF' }}>View all</Link>
              </div>
              {recentProofs.length > 0 ? (
                <div className="space-y-3">
                  {recentProofs.slice(0, 3).map(proof => {
                    const d = new Date(proof.captured_at)
                    const isToday = d.toDateString() === new Date().toDateString()
                    const dateStr = isToday ? d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
                    return (
                      <div key={proof.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: '#F5F2ED', border: '1px solid rgba(8,18,22,0.06)' }}>
                          {proof.photo_url ? <img src={proof.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="9" rx="1.5" stroke="#6E7F86" strokeWidth="1.1"/><circle cx="7" cy="6.5" r="2" stroke="#6E7F86" strokeWidth="1.1"/></svg></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#081216' }}>{proof.obligation_description || 'Proof captured'}</p>
                          <p className="text-xs truncate" style={{ color: '#6E7F86' }}>{proof.sponsor_name ? `${proof.sponsor_name} · ` : ''}{dateStr}</p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#DCFCE7', color: '#16A34A' }}>Verified</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-sm" style={{ color: '#6E7F86' }}>No captures yet</p>
                  <Link href="/dashboard/audit" className="text-xs font-medium mt-1.5 underline underline-offset-2" style={{ color: '#081216' }}>Start your first session →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Reports CTA */}
          <Link href="/proof-pack" className="flex items-center justify-between gap-4 px-6 py-5 rounded-2xl" style={{ background: '#081216' }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#0F2A2E')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#081216')}>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: '#6E7F86' }}>Sponsor Report</p>
              <p className="text-sm font-medium" style={{ color: '#E7ECEF' }}>Generate your Proof of Performance Report</p>
            </div>
            <span className="text-sm font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#B8734A' }}>Generate →</span>
          </Link>

        </div>
      </main>
    </div>
  )
}
