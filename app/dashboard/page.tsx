'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Organisation = {
  id: string
  name: string
  tier: string
  sports: string[] | null
  logo_url: string | null
  show_logo_on_dashboard: boolean | null
}
type Stats = { sponsors: number; sessions: number; obligations_pending: number }

const STORAGE_LIMITS: Record<string, number> = {
  free: 100,
  club: 10240,
  pro: 51200,
  agency: 102400,
}

function formatStorage(mb: number): string {
  if (mb < 1024) return `${mb} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

const SPORT_KIT_MAP: Record<string, string> = {
  'Football': 'football',
  'Rugby': 'rugby',
  'Rugby league': 'rugby',
  'Rugby Union': 'rugby',
  'Basketball': 'basketball',
  'Volleyball': 'volleyball',
  'Handball': 'handball',
  'Ice hockey': 'ice-hockey',
  'Cycling': 'cycling',
  'Golf': 'golf',
  'Swimming': 'swimming',
  'Athletics': 'athletics',
  'Running': 'running',
  'Martial arts': 'martial-arts',
  'MMA': 'martial-arts',
  'Cross country skiing': 'snow-sports',
  'Skiing': 'snow-sports',
  'Biathlon': 'snow-sports',
  'Snowboarding': 'snow-sports',
}

const SUPABASE_STORAGE = 'https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public'

function getKitUrl(sports: string[] | null): string {
  if (!sports || sports.length === 0) return `${SUPABASE_STORAGE}/sporr-kits/generic.svg`
  const sport = sports[0]
  const key = SPORT_KIT_MAP[sport] || 'generic'
  return `${SUPABASE_STORAGE}/sporr-kits/${key}.svg`
}

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
    label: "Today's session",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="10" cy="10" r="3" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
        {active && <circle cx="10" cy="10" r="1" fill="currentColor"/>}
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
    label: 'Proof Packs',
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
    label: 'Club settings',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
        <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2.5A5.5 5.5 0 004.5 8v3.5L3 13h14l-1.5-1.5V8A5.5 5.5 0 0010 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8.5 13v.5a1.5 1.5 0 003 0V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const NotificationBell = ({ className = '' }: { className?: string }) => (
  <button
    className={`relative text-sporr-sage hover:text-sporr-cream transition-colors p-2 ${className}`}
    aria-label="Notifications"
  >
    <BellIcon />
    {/* Red dot — always shown until notification system is wired up */}
    <span
      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sporr-accent"
      aria-hidden="true"
    />
  </button>
)

export default function DashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [org, setOrg] = useState<Organisation | null>(null)
  const [stats, setStats] = useState<Stats>({ sponsors: 0, sessions: 0, obligations_pending: 0 })
  const [activeSession, setActiveSession] = useState<{ id: string; token: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [nextDueDate, setNextDueDate] = useState<{ date: string; sponsor: string } | null>(null)
  const [photoCount, setPhotoCount] = useState(0)
  // Task 1 fix: next upcoming event + first pending obligation
  const [nextEvent, setNextEvent] = useState<{ title: string; starts_at: string | null } | null>(null)
  const [firstPendingObligation, setFirstPendingObligation] = useState<string | null>(null)
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

      const [sponsorsRes, sessionsRes, obligationsRes, activeSessionRes, contractsRes, photosRes, nextEventRes, firstObRes] = await Promise.all([
        supabase.from('sponsors').select('id', { count: 'exact' }).eq('org_id', userData.org_id),
        supabase.from('audit_sessions').select('id', { count: 'exact' }).eq('org_id', userData.org_id),
        supabase.from('obligations').select('id', { count: 'exact' }).eq('org_id', userData.org_id).eq('status', 'pending'),
        supabase.from('audit_sessions').select('id, session_token').eq('org_id', userData.org_id).eq('status', 'active').order('created_at', { ascending: false }).limit(1),
        supabase.from('contracts').select('end_date, sponsors(company_name)').eq('org_id', userData.org_id).eq('status', 'active').not('end_date', 'is', null).order('end_date', { ascending: true }).limit(1),
        supabase.from('proofs').select('id', { count: 'exact' }).eq('org_id', userData.org_id).not('photo_url', 'is', null),
        // New query: next upcoming event (future or today)
        supabase.from('events').select('id, title, starts_at').eq('org_id', userData.org_id).gte('starts_at', new Date().toISOString().split('T')[0]).order('starts_at', { ascending: true }).limit(1),
        // New query: first pending obligation description
        supabase.from('obligations').select('id, description').eq('org_id', userData.org_id).eq('status', 'pending').not('description', 'is', null).limit(1),
      ])

      setStats({
        sponsors: sponsorsRes.count || 0,
        sessions: sessionsRes.count || 0,
        obligations_pending: obligationsRes.count || 0,
      })
      setPhotoCount(photosRes.count || 0)

      if (activeSessionRes.data && activeSessionRes.data.length > 0) {
        setActiveSession({ id: activeSessionRes.data[0].id, token: activeSessionRes.data[0].session_token })
      }

      if (contractsRes.data && contractsRes.data.length > 0) {
        const contract = contractsRes.data[0] as any
        if (contract.end_date) {
          const endDate = new Date(contract.end_date)
          const formatted = endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          setNextDueDate({ date: formatted, sponsor: contract.sponsors?.company_name || '' })
        }
      }

      if (nextEventRes.data && nextEventRes.data.length > 0) {
        setNextEvent(nextEventRes.data[0])
      }

      if (firstObRes.data && firstObRes.data.length > 0) {
        setFirstPendingObligation(firstObRes.data[0].description)
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

  // Session card content
  function getSessionCardContent() {
    const dateStr = nextEvent?.starts_at
      ? new Date(nextEvent.starts_at).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })
      : null

    if (nextEvent) {
      return {
        badge: true,
        badgeLabel: 'Next event',
        heading: nextEvent.title,
        body: [dateStr, firstPendingObligation].filter(Boolean).join(' · ') || 'No obligations logged yet.',
        cta: activeSession ? 'Manage session →' : 'Start session →',
      }
    }

    // No events logged at all
    return {
      badge: false,
      heading: 'No upcoming events',
      body: firstPendingObligation || 'Add events and obligations in Contracts to get started.',
      cta: activeSession ? 'Manage session →' : 'Go to sessions →',
    }
  }

  const sessionCard = getSessionCardContent()

  if (loading) {
    return (
      <div className="min-h-screen bg-sporr-dark flex items-center justify-center">
        <div className="text-sporr-sage text-sm">Loading...</div>
      </div>
    )
  }

  const Sidebar = () => (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-sporr-dark fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <img
          src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
          alt="Sporr"
          className="h-14"
        />
      </div>

      {/* Club identity */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sporr-cream flex items-center justify-center overflow-hidden flex-shrink-0">
            {showCrest ? (
              <img src={org!.logo_url!} alt={org?.name} className="w-full h-full object-contain p-1" />
            ) : (
              <img src={kitUrl} alt="Kit" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(245,241,230,0.5))' }} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sporr-cream text-sm font-medium truncate">{org?.name || 'Your club'}</p>
            <p className="text-sporr-sage text-xs capitalize">{org?.tier} plan · {currentSeason}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white/10 text-sporr-cream'
                  : 'text-sporr-sage hover:bg-white/5 hover:text-sporr-cream'
              }`}
            >
              <span className={active ? 'text-sporr-cream' : 'text-sporr-sage'}>
                {item.icon(active)}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Storage indicator */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sporr-sage text-xs">Storage</span>
          <span className={`text-xs font-medium ${nearLimit ? 'text-amber-400' : 'text-sporr-sage'}`}>
            {formatStorage(estimatedUsageMB)} / {formatStorage(tierLimit)}
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${nearLimit ? 'bg-amber-400' : 'bg-sporr-mid'}`}
            style={{ width: `${Math.max(usagePct, 2)}%` }}
          />
        </div>
      </div>

      {/* Sign out */}
      <div className="px-6 py-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="text-sporr-sage hover:text-sporr-cream text-sm transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )

  const BottomNav = () => (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-sporr-dark border-t border-white/10 z-40">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {NAV_ITEMS.slice(0, 5).map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-0 ${
                active ? 'text-sporr-cream' : 'text-sporr-sage'
              }`}
            >
              {item.icon(active)}
              <span className="text-xs font-medium truncate max-w-[56px] text-center leading-tight">
                {item.label === "Today's session" ? 'Session' : item.label === 'Club settings' ? 'Club' : item.label === 'Proof Packs' ? 'Proofs' : item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-sporr-cream">
      <Sidebar />
      <BottomNav />

      <main className="lg:pl-64 pb-24 lg:pb-0">

        {/* Mobile header */}
        <div className="lg:hidden bg-sporr-dark px-4 py-3 flex items-center justify-between">
          <img
            src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
            alt="Sporr"
            className="h-12"
          />
          <div className="flex items-center gap-2">
            {isFree && (
              <Link href="/dashboard/club" className="bg-sporr-mid text-sporr-cream text-xs font-medium px-3 py-2 rounded-lg hover:bg-sporr-surface transition-colors whitespace-nowrap">
                Upgrade →
              </Link>
            )}
            <NotificationBell />
            <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center overflow-hidden">
              {showCrest ? (
                <img src={org!.logo_url!} alt={org?.name} className="w-full h-full object-contain p-0.5" />
              ) : (
                <img src={kitUrl} alt="Kit" className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        </div>

        {/* Banners */}
        {isFree && stats.sponsors >= 1 && (
          <div className="bg-sporr-mid px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sporr-cream text-sm">
              <strong>Free plan:</strong> Bronze tier sponsors only · 1 Proof Pack per season.
            </p>
            <Link href="/dashboard/club" className="bg-sporr-cream text-sporr-dark text-xs font-medium px-4 py-2 rounded-lg hover:bg-sporr-sage-lt transition-colors whitespace-nowrap flex-shrink-0">
              Upgrade plan →
            </Link>
          </div>
        )}

        {nearLimit && (
          <div className={`px-6 py-3 flex items-center justify-between gap-4 flex-wrap ${usagePct >= 100 ? 'bg-red-700' : 'bg-amber-600'}`}>
            <p className="text-white text-sm">
              <strong>Storage {usagePct >= 100 ? 'full' : 'nearly full'}:</strong> {formatStorage(estimatedUsageMB)} of {formatStorage(tierLimit)} used.
            </p>
            <Link href="/dashboard/club" className="bg-white text-sporr-dark text-xs font-medium px-4 py-2 rounded-lg hover:bg-sporr-cream transition-colors whitespace-nowrap flex-shrink-0">
              Upgrade plan →
            </Link>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-sporr-dark text-2xl sm:text-3xl font-medium">{org?.name || 'Your club'}</h1>
            <p className="text-[#6B7D72] text-sm mt-1">Season {currentSeason} · {stats.sessions} session{stats.sessions !== 1 ? 's' : ''} logged</p>
          </div>

          {/* PRIMARY: Session card */}
          <Link href="/dashboard/audit" className="block mb-4 group">
            <div
              className={`relative rounded-2xl overflow-hidden transition-all duration-200 ${
                activeSession ? 'ring-2 ring-sporr-mid' : 'hover:ring-2 hover:ring-sporr-mid'
              }`}
              style={{
                background: 'linear-gradient(to right, #D4EAD9 0%, #E8F2E9 35%, #F5F1E6 58%, #F5F1E6 100%)',
                border: activeSession ? '2px solid #C0392B' : '2px solid transparent',
              }}
            >
              {/* Kit / crest — sits on cream, no overlay needed */}
              <div className="absolute right-0 top-0 bottom-0 w-40 sm:w-52 pointer-events-none">
                <img
                  src={showCrest && org?.logo_url ? org.logo_url : kitUrl}
                  alt=""
                  className="w-full h-full object-contain object-right-bottom p-4"
                  style={{ opacity: 0.85 }}
                />
              </div>

              <div className="relative px-6 py-6 sm:py-8">
                {sessionCard.badge && (
                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 bg-sporr-dark/10 border border-sporr-dark/20">
                    {activeSession && <span className="w-2 h-2 rounded-full bg-sporr-accent animate-pulse" />}
                    <span className="text-xs font-medium uppercase tracking-wider text-sporr-dark">
                      {sessionCard.badgeLabel}
                    </span>
                  </div>
                )}

                <h2 className="text-2xl sm:text-3xl font-medium mb-2 text-sporr-dark">
                  {sessionCard.heading}
                </h2>

                <p className="text-sm mb-6 max-w-xs leading-relaxed text-[#3d5c48]">
                  {sessionCard.body}
                </p>

                <div className="inline-flex items-center gap-2 font-medium px-5 py-3 rounded-xl text-sm transition-colors bg-sporr-dark text-sporr-cream group-hover:bg-sporr-surface">
                  {sessionCard.cta}
                </div>

                {stats.obligations_pending > 0 && (
                  <p className="text-xs mt-4 text-[#3d5c48]">
                    {stats.obligations_pending} obligation{stats.obligations_pending !== 1 ? 's' : ''} pending this season
                  </p>
                )}
              </div>
            </div>
          </Link>

          {/* SECONDARY: Stats row — Task 2: soft muted colour shades */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Sponsors', value: stats.sponsors, href: '/dashboard/sponsors', bg: '#EAF2EC', border: '#C5DFCA' },
              { label: 'Sessions', value: stats.sessions, href: '/dashboard/audit', bg: '#EDF0E8', border: '#CDD4C5' },
              { label: 'Pending', value: stats.obligations_pending, href: '/dashboard/obligations', bg: '#F0EDE5', border: '#D8D1C0' },
            ].map(stat => (
              <Link
                key={stat.label}
                href={stat.href}
                className="rounded-xl px-4 py-4 transition-all hover:brightness-95 text-center"
                style={{ backgroundColor: stat.bg, border: `1px solid ${stat.border}` }}
              >
                <p className="text-sporr-dark text-2xl font-medium">{stat.value}</p>
                <p className="text-[#5a7060] text-xs mt-0.5 uppercase tracking-wider">{stat.label}</p>
              </Link>
            ))}
          </div>

          {/* TERTIARY: Proof Pack banner */}
          <Link
            href="/proof-pack"
            className="block bg-white rounded-2xl border border-sporr-sage-lt px-6 py-5 hover:border-sporr-dark transition-colors mb-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[#6B7D72] text-xs uppercase tracking-widest mb-1">Proof Pack</p>
                <p className="text-sporr-dark font-medium text-sm">
                  {nextDueDate
                    ? `Next report due ${nextDueDate.date}`
                    : stats.sessions > 0
                    ? "Send your sponsor's Proof Pack"
                    : 'Generate your first Proof Pack when ready'}
                </p>
              </div>
              <span className="text-sporr-dark text-sm font-medium whitespace-nowrap">Send →</span>
            </div>
          </Link>

          {/* Quick links row */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/contracts"
              className="bg-white rounded-xl border border-sporr-sage-lt px-4 py-4 hover:border-sporr-dark transition-colors flex items-center justify-between"
            >
              <span className="text-sporr-dark text-sm font-medium">Contracts</span>
              <span className="text-[#6B7D72] text-sm">→</span>
            </Link>
            <Link
              href="/dashboard/club"
              className="bg-white rounded-xl border border-sporr-sage-lt px-4 py-4 hover:border-sporr-dark transition-colors flex items-center justify-between"
            >
              <span className="text-sporr-dark text-sm font-medium">Club settings</span>
              <span className="text-[#6B7D72] text-sm">→</span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
