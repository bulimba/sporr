'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────

type Organisation = {
  id: string
  name: string
  tier: string
  sports: string[] | null
  logo_url: string | null
  show_logo_on_dashboard: boolean | null
}

type SponsorCard = {
  id: string
  company_name: string
  sponsorship_tier: string
  contract_title: string
  total: number
  delivered: number
  pending: number
  health_score: number
}

type ProofEntry = {
  id: string
  captured_at: string
  photo_url: string | null
  obligation_description: string | null
  sponsor_name: string | null
}

type Stats = {
  sponsors: number
  sessions: number
  obligations_pending: number
  obligations_total: number
  obligations_delivered: number
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_LIMITS: Record<string, number> = {
  free: 100, club: 10240, pro: 51200, agency: 102400,
}

const TIER_LABELS: Record<string, string> = {
  title: 'Platinum', principal: 'Gold', official: 'Silver', community: 'Bronze',
}

const TIER_ORDER: Record<string, number> = {
  title: 0, principal: 1, official: 2, community: 3,
}

const SPORT_KIT_MAP: Record<string, string> = {
  'Football': 'football', 'Rugby': 'rugby', 'Rugby league': 'rugby',
  'Rugby Union': 'rugby', 'Basketball': 'basketball', 'Volleyball': 'volleyball',
  'Handball': 'handball', 'Ice hockey': 'ice-hockey', 'Cycling': 'cycling',
  'Golf': 'golf', 'Swimming': 'swimming', 'Athletics': 'athletics',
  'Running': 'running', 'Martial arts': 'martial-arts', 'MMA': 'martial-arts',
  'Cross country skiing': 'snow-sports', 'Skiing': 'snow-sports',
  'Biathlon': 'snow-sports', 'Snowboarding': 'snow-sports',
}

const SUPABASE_STORAGE = 'https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public'

function getKitUrl(sports: string[] | null): string {
  if (!sports || sports.length === 0) return `${SUPABASE_STORAGE}/sporr-kits/generic.svg`
  const key = SPORT_KIT_MAP[sports[0]] || 'generic'
  return `${SUPABASE_STORAGE}/sporr-kits/${key}.svg`
}

function formatStorage(mb: number): string {
  return mb < 1024 ? `${mb} MB` : `${(mb / 1024).toFixed(1)} GB`
}

// ── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="2" width="7" height="7" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="11" width="7" height="7" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="11" width="7" height="7" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/audit',
    label: 'Capture',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
        <circle cx="10" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 6l1.2-2h3.6L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/sponsors',
    label: 'Sponsors',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L12.39 7.26L18 8.18L14 12.08L14.95 17.66L10 15L5.05 17.66L6 12.08L2 8.18L7.61 7.26L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'}/>
      </svg>
    ),
  },
  {
    href: '/dashboard/contracts',
    label: 'Contracts',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
        <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/proof-pack',
    label: 'Sponsor Report',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10L10 3L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 8.5V17H15V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
        <path d="M8 17V12h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/club',
    label: 'Club',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
        <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M10 2.5A5.5 5.5 0 004.5 8v3.5L3 13h14l-1.5-1.5V8A5.5 5.5 0 0010 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8.5 13v.5a1.5 1.5 0 003 0V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const NotificationBell = () => (
  <button className="relative text-sporr-sage hover:text-sporr-cream transition-colors p-2" aria-label="Notifications">
    <BellIcon />
    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sporr-accent" aria-hidden="true" />
  </button>
)

// Sponsor tier colour chip
function TierChip({ tier }: { tier: string }) {
  const colours: Record<string, string> = {
    title:     'bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/20',
    principal: 'bg-amber-50 text-amber-700 border border-amber-200',
    official:  'bg-slate-100 text-slate-600 border border-slate-200',
    community: 'bg-[#D4EAD9] text-[#36573B] border border-[#A8D5BA]/40',
  }
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full tracking-wide uppercase ${colours[tier] || colours.community}`}>
      {TIER_LABELS[tier] || tier}
    </span>
  )
}

// Confidence score ring — SVG arc
function ConfidenceRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const colour = score >= 80 ? '#4B9560' : score >= 60 ? '#d97706' : '#C0392B'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(168,213,186,0.15)" strokeWidth="5"/>
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={colour} strokeWidth="5"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

// Thin progress bar
function ProgressBar({ pct, colour = '#4B9560' }: { pct: number; colour?: string }) {
  return (
    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: colour }} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [org, setOrg] = useState<Organisation | null>(null)
  const [stats, setStats] = useState<Stats>({ sponsors: 0, sessions: 0, obligations_pending: 0, obligations_total: 0, obligations_delivered: 0 })
  const [sponsorCards, setSponsorCards] = useState<SponsorCard[]>([])
  const [recentProofs, setRecentProofs] = useState<ProofEntry[]>([])
  const [activeSession, setActiveSession] = useState<{ id: string; token: string } | null>(null)
  const [nextEvent, setNextEvent] = useState<{ title: string; starts_at: string | null } | null>(null)
  const [nextDueDate, setNextDueDate] = useState<{ date: string; sponsor: string } | null>(null)
  const [photoCount, setPhotoCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const currentSeason = '2025/26'

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: userData } = await supabase.from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }

      const { data: orgData } = await supabase
        .from('organisations')
        .select('id, name, tier, sports, logo_url, show_logo_on_dashboard')
        .eq('id', userData.org_id).single()
      setOrg(orgData)

      // Parallel fetches
      const [
        sponsorsRes, sessionsRes, obligationsRes, activeSessionRes,
        contractsRes, photosRes, nextEventRes, recentProofsRes,
        sponsorObligationsRes,
      ] = await Promise.all([
        supabase.from('sponsors').select('id', { count: 'exact' }).eq('org_id', userData.org_id),
        supabase.from('audit_sessions').select('id', { count: 'exact' }).eq('org_id', userData.org_id),
        supabase.from('obligations').select('id, status', { count: 'exact' }).eq('org_id', userData.org_id).neq('status', 'not_applicable'),
        supabase.from('audit_sessions').select('id, session_token').eq('org_id', userData.org_id).eq('status', 'active').order('created_at', { ascending: false }).limit(1),
        supabase.from('contracts').select('end_date, sponsors(company_name)').eq('org_id', userData.org_id).eq('status', 'active').not('end_date', 'is', null).order('end_date', { ascending: true }).limit(1),
        supabase.from('proofs').select('id', { count: 'exact' }).eq('org_id', userData.org_id).not('photo_url', 'is', null),
        supabase.from('events').select('id, title, starts_at').eq('org_id', userData.org_id).gte('starts_at', new Date().toISOString().split('T')[0]).order('starts_at', { ascending: true }).limit(1),
        // Recent proofs — last 6 captured photos
        supabase.from('proofs')
          .select('id, captured_at, photo_url, obligations(description, contracts(sponsors(company_name)))')
          .eq('org_id', userData.org_id)
          .not('photo_url', 'is', null)
          .order('captured_at', { ascending: false })
          .limit(6),
        // Sponsor cards — contracts + obligations
        supabase.from('contracts')
          .select('id, title, sponsorship_tier, sponsor_id, sponsors(id, company_name, health_score)')
          .eq('org_id', userData.org_id)
          .eq('status', 'active'),
      ])

      const allObligations = obligationsRes.data || []
      const deliveredCount = allObligations.filter((o: any) => o.status === 'delivered').length
      const pendingCount = allObligations.filter((o: any) => o.status === 'pending').length

      setStats({
        sponsors: sponsorsRes.count || 0,
        sessions: sessionsRes.count || 0,
        obligations_pending: pendingCount,
        obligations_total: allObligations.length,
        obligations_delivered: deliveredCount,
      })
      setPhotoCount(photosRes.count || 0)

      if (activeSessionRes.data?.[0]) {
        setActiveSession({ id: activeSessionRes.data[0].id, token: activeSessionRes.data[0].session_token })
      }

      if (contractsRes.data?.[0]) {
        const c = contractsRes.data[0] as any
        if (c.end_date) {
          setNextDueDate({
            date: new Date(c.end_date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }),
            sponsor: c.sponsors?.company_name || '',
          })
        }
      }

      if (nextEventRes.data?.[0]) setNextEvent(nextEventRes.data[0])

      // Build recent proof feed
      if (recentProofsRes.data) {
        const proofs: ProofEntry[] = (recentProofsRes.data as any[]).map(p => ({
          id: p.id,
          captured_at: p.captured_at,
          photo_url: p.photo_url,
          obligation_description: p.obligations?.description || null,
          sponsor_name: p.obligations?.contracts?.sponsors?.company_name || null,
        }))
        setRecentProofs(proofs)
      }

      // Build sponsor confidence cards
      if (sponsorObligationsRes.data) {
        const contracts = sponsorObligationsRes.data as any[]
        const contractIds = contracts.map(c => c.id)
        if (contractIds.length > 0) {
          const { data: oblData } = await supabase
            .from('obligations')
            .select('contract_id, status')
            .in('contract_id', contractIds)
            .neq('status', 'not_applicable')

          const cards: SponsorCard[] = contracts.map(c => {
            const obs = (oblData || []).filter((o: any) => o.contract_id === c.id)
            const delivered = obs.filter((o: any) => o.status === 'delivered').length
            const pending = obs.filter((o: any) => o.status === 'pending').length
            return {
              id: c.sponsor_id,
              company_name: c.sponsors?.company_name || '—',
              sponsorship_tier: c.sponsorship_tier || 'community',
              contract_title: c.title,
              total: obs.length,
              delivered,
              pending,
              health_score: c.sponsors?.health_score || 0,
            }
          })
          // Sort by tier priority
          cards.sort((a, b) => (TIER_ORDER[a.sponsorship_tier] ?? 99) - (TIER_ORDER[b.sponsorship_tier] ?? 99))
          setSponsorCards(cards)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isFree = org?.tier === 'free'
  const estimatedUsageMB = photoCount * 1
  const tierLimit = STORAGE_LIMITS[org?.tier || 'free'] || 100
  const usagePct = Math.min(Math.round((estimatedUsageMB / tierLimit) * 100), 100)
  const nearLimit = usagePct >= 80
  const showCrest = org?.show_logo_on_dashboard && org?.logo_url
  const kitUrl = getKitUrl(org?.sports || null)

  // Delivery pct — season-wide
  const deliveryPct = stats.obligations_total > 0
    ? Math.round((stats.obligations_delivered / stats.obligations_total) * 100)
    : 0

  // Confidence score — weighted average of sponsor health scores
  const avgConfidence = sponsorCards.length > 0
    ? Math.round(sponsorCards.reduce((sum, s) => sum + (s.health_score || 70), 0) / sponsorCards.length)
    : deliveryPct || 0

  // Capture status label
  const captureStatus = activeSession
    ? 'active'
    : nextEvent
    ? (() => {
        const d = nextEvent.starts_at ? new Date(nextEvent.starts_at) : null
        const isToday = d ? d.toDateString() === new Date().toDateString() : false
        return isToday ? 'match-day' : 'upcoming'
      })()
    : 'idle'

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-sporr-dark flex items-center justify-center">
        <div className="text-sporr-sage text-sm">Loading...</div>
      </div>
    )
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────

  const Sidebar = () => (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-sporr-deep fixed left-0 top-0 bottom-0 z-40 border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <img
          src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
          alt="Sporr" className="h-12"
        />
        <NotificationBell />
      </div>

      {/* Club identity */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sporr-cream flex items-center justify-center overflow-hidden flex-shrink-0">
            {showCrest
              ? <img src={org!.logo_url!} alt={org?.name} className="w-full h-full object-contain p-0.5" />
              : <img src={kitUrl} alt="Kit" className="w-full h-full object-contain" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-sporr-cream text-sm font-medium truncate">{org?.name || 'Your club'}</p>
            <p className="text-sporr-sage text-xs capitalize">{org?.tier} · {currentSeason}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-white/10 text-sporr-cream' : 'text-sporr-sage hover:bg-white/5 hover:text-sporr-cream'
              }`}
            >
              <span className={active ? 'text-sporr-cream' : 'text-sporr-sage'}>{item.icon(active)}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Storage */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sporr-sage text-xs">Storage</span>
          <span className={`text-xs font-medium ${nearLimit ? 'text-amber-400' : 'text-sporr-sage'}`}>
            {formatStorage(estimatedUsageMB)} / {formatStorage(tierLimit)}
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${nearLimit ? 'bg-amber-400' : 'bg-sporr-mid'}`}
            style={{ width: `${Math.max(usagePct, 2)}%` }} />
        </div>
      </div>

      {/* Sign out */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <button onClick={handleSignOut}
          className="text-sporr-sage hover:text-sporr-cream text-sm transition-colors flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )

  const BottomNav = () => (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-sporr-deep border-t border-white/[0.06] z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.slice(0, 5).map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-0 ${active ? 'text-sporr-cream' : 'text-sporr-sage'}`}
            >
              {item.icon(active)}
              <span className="text-[10px] font-medium truncate max-w-[52px] text-center leading-tight">
                {item.label === 'Club' ? 'Club' : item.label === 'Sponsor Report' ? 'Report' : item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-sporr-cream">
      <Sidebar />
      <BottomNav />

      <main className="lg:pl-64 pb-24 lg:pb-0">

        {/* Mobile header */}
        <div className="lg:hidden bg-sporr-dark px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
          <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-10" />
          <div className="flex items-center gap-2">
            {isFree && (
              <Link href="/dashboard/club" className="bg-sporr-mid text-sporr-cream text-xs font-medium px-3 py-1.5 rounded-lg">
                Upgrade →
              </Link>
            )}
            <NotificationBell />
          </div>
        </div>

        {/* Free plan banner */}
        {isFree && (
          <div className="bg-sporr-dark border-b border-white/[0.06] px-6 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sporr-sage text-xs">Free plan · 1 sponsor · 1 contract · watermarked reports</p>
            <Link href="/dashboard/club" className="text-sporr-cream text-xs font-medium underline underline-offset-2 whitespace-nowrap">Upgrade →</Link>
          </div>
        )}

        {/* Storage warning */}
        {nearLimit && (
          <div className={`px-6 py-2.5 flex items-center justify-between gap-4 ${usagePct >= 100 ? 'bg-red-700' : 'bg-amber-600'}`}>
            <p className="text-white text-xs font-medium">Storage {usagePct >= 100 ? 'full' : 'nearly full'} — {formatStorage(estimatedUsageMB)} of {formatStorage(tierLimit)} used</p>
            <Link href="/dashboard/club" className="text-white text-xs font-medium underline underline-offset-2 whitespace-nowrap">Upgrade →</Link>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">

          {/* ── LAYER 1: Confidence summary bar ─────────────────────────── */}
          <div className="bg-sporr-dark rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06]">

              {/* Sponsor Confidence Score */}
              <div className="px-5 py-5">
                <p className="text-sporr-sage text-[10px] font-medium uppercase tracking-widest mb-3">Sponsor confidence</p>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <ConfidenceRing score={avgConfidence} size={52} />
                    <span className="absolute inset-0 flex items-center justify-center text-sporr-cream text-xs font-semibold">
                      {avgConfidence}
                    </span>
                  </div>
                  <div>
                    <p className="text-sporr-cream text-xl font-medium leading-none">{avgConfidence}<span className="text-sporr-sage text-sm font-normal">/100</span></p>
                    <p className="text-sporr-sage text-xs mt-1">
                      {avgConfidence >= 80 ? 'Strong' : avgConfidence >= 60 ? 'Moderate' : 'At risk'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Season delivery */}
              <div className="px-5 py-5">
                <p className="text-sporr-sage text-[10px] font-medium uppercase tracking-widest mb-3">Season delivery</p>
                <p className="text-sporr-cream text-3xl font-medium leading-none mb-1">{deliveryPct}<span className="text-sporr-sage text-base font-normal">%</span></p>
                <ProgressBar pct={deliveryPct} colour={deliveryPct >= 80 ? '#4B9560' : deliveryPct >= 60 ? '#d97706' : '#C0392B'} />
                <p className="text-sporr-sage text-xs mt-1.5">{stats.obligations_delivered} of {stats.obligations_total} deliverables</p>
              </div>

              {/* Capture status */}
              <div className="px-5 py-5">
                <p className="text-sporr-sage text-[10px] font-medium uppercase tracking-widest mb-3">Capture status</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    captureStatus === 'active' ? 'bg-sporr-accent animate-pulse' :
                    captureStatus === 'match-day' ? 'bg-sporr-mid' : 'bg-white/20'
                  }`} />
                  <p className={`text-sm font-medium ${
                    captureStatus === 'active' ? 'text-sporr-accent' :
                    captureStatus === 'match-day' ? 'text-sporr-cream' : 'text-sporr-sage'
                  }`}>
                    {captureStatus === 'active' ? 'Active capture' :
                     captureStatus === 'match-day' ? 'Match day' :
                     captureStatus === 'upcoming' ? 'Upcoming' : 'No session'}
                  </p>
                </div>
                {captureStatus === 'active' && activeSession ? (
                  <Link href={`/audit/${activeSession.token}`} className="text-sporr-sage text-xs hover:text-sporr-cream transition-colors underline underline-offset-2">
                    Open field mode →
                  </Link>
                ) : captureStatus === 'idle' ? (
                  <Link href="/dashboard/audit" className="text-sporr-sage text-xs hover:text-sporr-cream transition-colors underline underline-offset-2">
                    Start capture →
                  </Link>
                ) : null}
              </div>

              {/* Upcoming fixture */}
              <div className="px-5 py-5">
                <p className="text-sporr-sage text-[10px] font-medium uppercase tracking-widest mb-3">Next fixture</p>
                {nextEvent ? (
                  <>
                    <p className="text-sporr-cream text-sm font-medium leading-snug mb-1">{nextEvent.title}</p>
                    {nextEvent.starts_at && (
                      <p className="text-sporr-sage text-xs">
                        {new Date(nextEvent.starts_at).toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sporr-sage text-sm">No fixture logged</p>
                    <Link href="/dashboard/audit" className="text-sporr-sage text-xs hover:text-sporr-cream transition-colors underline underline-offset-2 mt-1 block">
                      Add event →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── LAYER 2: Operational state ───────────────────────────────── */}
          {(captureStatus === 'active' || captureStatus === 'match-day' || stats.obligations_pending > 0) && (
            <div className={`rounded-2xl border-2 px-6 py-5 flex items-center justify-between gap-4 flex-wrap ${
              captureStatus === 'active'
                ? 'border-sporr-accent bg-[#fdf6f6]'
                : captureStatus === 'match-day'
                ? 'border-sporr-mid bg-[#f2f8f4]'
                : 'bg-white border border-sporr-sage-lt'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  captureStatus === 'active' ? 'bg-sporr-accent animate-pulse' :
                  captureStatus === 'match-day' ? 'bg-sporr-mid' : 'bg-[#D4EAD9]'
                }`} />
                <div>
                  <p className="text-sporr-dark font-medium text-sm">
                    {captureStatus === 'active' ? 'Active capture in progress' :
                     captureStatus === 'match-day' ? `Match day — ${nextEvent?.title || 'today'}` :
                     `${stats.obligations_pending} deliverable${stats.obligations_pending !== 1 ? 's' : ''} pending`}
                  </p>
                  <p className="text-[#6B7D72] text-xs mt-0.5">
                    {captureStatus === 'active' ? 'Session is live — field capture active' :
                     captureStatus === 'match-day' ? 'Launch a session to start capturing proof' :
                     'Review deliverables and start a capture session'}
                  </p>
                </div>
              </div>
              <Link
                href={captureStatus === 'active' && activeSession ? `/audit/${activeSession.token}` : '/dashboard/audit'}
                className="flex-shrink-0 text-sporr-dark text-sm font-medium px-4 py-2.5 rounded-xl bg-sporr-dark text-sporr-cream hover:bg-sporr-surface transition-colors"
              >
                {captureStatus === 'active' ? 'Resume capture →' : 'Start capture →'}
              </Link>
            </div>
          )}

          {/* ── LAYER 3: Sponsor overview cards ─────────────────────────── */}
          {sponsorCards.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[#6B7D72] text-xs font-medium uppercase tracking-widest">Sponsors · {currentSeason}</p>
                <Link href="/dashboard/sponsors" className="text-[#6B7D72] text-xs hover:text-sporr-dark transition-colors">
                  Manage →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sponsorCards.map(card => {
                  const pct = card.total > 0 ? Math.round((card.delivered / card.total) * 100) : 0
                  const allDone = card.pending === 0 && card.total > 0
                  const barColour = allDone ? '#4B9560' : pct >= 60 ? '#13322A' : '#d97706'
                  return (
                    <Link
                      key={card.id}
                      href="/dashboard/obligations"
                      className="block bg-white border border-sporr-sage-lt rounded-2xl px-5 py-4 hover:border-sporr-dark transition-colors group"
                    >
                      {/* Sponsor header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="text-sporr-dark font-medium text-sm truncate">{card.company_name}</p>
                          <p className="text-[#6B7D72] text-xs truncate mt-0.5">{card.contract_title}</p>
                        </div>
                        <TierChip tier={card.sponsorship_tier} />
                      </div>

                      {/* Delivery progress */}
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sporr-dark text-xs font-medium">
                          {card.delivered}<span className="text-[#6B7D72] font-normal">/{card.total} delivered</span>
                        </p>
                        <p className={`text-xs font-medium ${allDone ? 'text-sporr-mid' : card.pending > 0 ? 'text-sporr-dark' : 'text-[#6B7D72]'}`}>
                          {allDone ? 'Complete ✓' : `${card.pending} pending`}
                        </p>
                      </div>
                      <div className="h-1 w-full bg-sporr-sage-lt rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: barColour }} />
                      </div>

                      {/* Health score row */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-sporr-sage-lt">
                        <p className="text-[#6B7D72] text-[10px] uppercase tracking-widest">Confidence</p>
                        <p className={`text-xs font-semibold ${
                          card.health_score >= 70 ? 'text-sporr-dark' :
                          card.health_score >= 40 ? 'text-amber-600' : 'text-red-600'
                        }`}>{card.health_score}/100</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state — no sponsors yet */}
          {sponsorCards.length === 0 && stats.sponsors === 0 && (
            <div className="bg-white border border-sporr-sage-lt rounded-2xl px-6 py-10 text-center">
              <p className="text-sporr-dark font-medium mb-1">No sponsors added yet</p>
              <p className="text-[#6B7D72] text-sm mb-4">Add your first sponsor to start tracking deliverables.</p>
              <Link href="/dashboard/sponsors" className="inline-flex items-center gap-2 bg-sporr-dark text-sporr-cream text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-sporr-surface transition-colors">
                Add sponsor →
              </Link>
            </div>
          )}

          {/* ── LAYER 4: Recent proof activity ──────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#6B7D72] text-xs font-medium uppercase tracking-widest">Recent proof captures</p>
              <Link href="/dashboard/audit" className="text-[#6B7D72] text-xs hover:text-sporr-dark transition-colors">
                All sessions →
              </Link>
            </div>

            {recentProofs.length > 0 ? (
              <div className="bg-white border border-sporr-sage-lt rounded-2xl overflow-hidden divide-y divide-sporr-sage-lt">
                {recentProofs.map((proof, i) => {
                  const capturedAt = new Date(proof.captured_at)
                  const isToday = capturedAt.toDateString() === new Date().toDateString()
                  const dateStr = isToday
                    ? capturedAt.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
                    : capturedAt.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
                  return (
                    <div key={proof.id} className="flex items-center gap-4 px-5 py-3.5">
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-sporr-light flex-shrink-0 overflow-hidden border border-sporr-sage-lt">
                        {proof.photo_url ? (
                          <img src={proof.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="1" y="3" width="14" height="10" rx="2" stroke="#A8D5BA" strokeWidth="1.2"/>
                              <circle cx="8" cy="8" r="2.5" stroke="#A8D5BA" strokeWidth="1.2"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sporr-dark text-sm font-medium truncate">
                          {proof.obligation_description || 'Proof captured'}
                        </p>
                        {proof.sponsor_name && (
                          <p className="text-[#6B7D72] text-xs truncate">{proof.sponsor_name}</p>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-[#6B7D72] text-xs">{dateStr}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 5l3 3 5-5" stroke="#4B9560" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <p className="text-sporr-mid text-[10px] font-medium">Verified</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white border border-sporr-sage-lt rounded-2xl px-6 py-8 text-center">
                <p className="text-[#6B7D72] text-sm">No proof captured yet.</p>
                <Link href="/dashboard/audit" className="text-sporr-dark text-xs font-medium underline underline-offset-2 mt-1.5 block hover:text-sporr-mid transition-colors">
                  Start your first session →
                </Link>
              </div>
            )}
          </div>

          {/* Sponsor Report CTA — always visible */}
          <Link href="/proof-pack"
            className="block bg-sporr-dark rounded-2xl px-6 py-5 hover:bg-sporr-surface transition-colors group"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sporr-sage text-[10px] uppercase tracking-widest mb-1">Sponsor Report</p>
                <p className="text-sporr-cream font-medium text-sm">
                  {nextDueDate
                    ? `Next report due ${nextDueDate.date}`
                    : stats.sessions > 0
                    ? 'Generate your Proof of Performance Report'
                    : 'Send your sponsor a season performance report'}
                </p>
              </div>
              <span className="text-sporr-sage group-hover:text-sporr-cream text-sm font-medium whitespace-nowrap transition-colors">Generate →</span>
            </div>
          </Link>

        </div>
      </main>
    </div>
  )
}
