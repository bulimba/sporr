'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
type Event = {
  id: string
  title: string
  venue: string | null
  starts_at: string | null
}

type Session = {
  id: string
  session_token: string
  status: string
  created_at: string
  attendance: number | null
  delivery_context: string
  events: { title: string } | null
}

type OrgData = {
  id: string
  name: string
  tier: string
  logo_url: string | null
  show_logo_on_dashboard: boolean | null
  club_colour_primary: string | null
  club_colour_secondary: string | null
}

// ── Style tokens ──────────────────────────────────────────────────────────────
const INK    = '#081216'
const FOG    = '#E7ECEF'
const SLATE  = '#6E7F86'
const BLUE   = '#147BFF'
const COPPER = '#B8734A'
const GREEN  = '#36B37E'
const BG     = '#F5F2ED'
const WHITE  = '#FFFFFF'
const SIDE   = '#0A1A1F'
const BORDER = 'rgba(8,18,22,0.08)'

const CARD: React.CSSProperties = { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }
const inpStyle: React.CSSProperties = {
  width: '100%', background: WHITE, border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: '10px 14px', fontSize: 14, color: INK,
  outline: 'none', fontFamily: 'inherit',
}
const lblStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: SLATE,
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
}
const sectionHead: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: SLATE,
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16,
}

// Contrast helper — black/white text on a given fill
function textOnColour(hex: string): string {
  if (!hex || hex.length < 7) return '#FFFFFF'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000000' : '#FFFFFF'
}

// ── Plan tier system (operational complexity, never gated on participation) ───
const PLAN_TIER_LABELS: Record<string, string> = {
  foundation: 'Foundation', organisation: 'Organisation', portfolio: 'Portfolio', network: 'Network',
}
function normaliseTier(raw: string | null | undefined): string {
  const map: Record<string, string> = {
    free: 'foundation', club: 'organisation', pro: 'portfolio', agency: 'network',
  }
  return map[raw || ''] ?? raw ?? 'foundation'
}

// ── Delivery contexts ─────────────────────────────────────────────────────────
const DELIVERY_CONTEXTS = [
  { value: 'match_day',   label: 'Match day' },
  { value: 'training',    label: 'Training' },
  { value: 'digital',     label: 'Digital' },
  { value: 'season_long', label: 'Season long' },
  { value: 'event',       label: 'Event' },
]

// ── SVG wordmark paths ────────────────────────────────────────────────────────
const O_ARC   = 'M873.735 347.639C898.493 344.775 922.792 349.648 943.469 363.849C964.779 378.522 979.408 401.039 984.155 426.472C989.607 456.155 982.16 481.366 965.308 505.675C957.877 501.095 950.861 497.807 943.039 494.028C951.244 484.183 956.989 472.528 959.799 460.024C963.871 441.089 960.3 421.313 949.863 404.998C938.576 387.638 922.504 377.041 902.392 372.759C901.94 372.676 901.487 372.599 901.033 372.528C880.508 369.277 859.101 373.103 842.11 385.427C826.478 396.918 816.067 414.162 813.178 433.347C809.468 457.588 816.492 475.116 830.476 494.232C822.176 497.845 815.897 501.472 808.117 505.943C798.035 490.808 791.722 477.724 789.052 459.404C785.108 433.179 791.888 406.471 807.864 385.303C824.374 363.356 846.814 351.416 873.735 347.639Z'
const O_BREAK = 'M876.273 500.988C904.427 497.778 932.768 506.786 955.235 523.713C949.48 529.254 944.417 533.62 938.29 538.755C923.817 529.858 914.292 526.66 897.594 524.151C873.104 522.25 856.67 525.977 835.728 538.872C829.3 533.622 824.598 529.559 818.648 523.799C835.706 509.913 854.812 503.743 876.273 500.988Z'
const S_PATH  = 'M438.532 347.689C466.232 344.584 505.581 349.465 529.745 363.724C526.819 371.238 523.812 378.72 520.726 386.17C496.565 374.864 477.723 371.516 451.744 371.626C432.898 371.705 393.747 376.892 396.627 402.78C402.181 452.685 495.21 415.624 524.433 449.977C534.051 461.284 538.333 468.556 538.756 483.329C539.162 529.497 497.926 539.067 461.429 539.876C427.58 540.636 402.505 536.592 371.777 522.545C373.856 516.241 378.482 506.016 381.147 499.586C412.813 514.903 447.612 518.555 482.304 513.625C491.624 512.3 502.467 509.271 508.621 501.656C512.967 496.375 515.004 489.567 514.274 482.767C510.834 450.619 453.621 458.064 430.541 454.825C403.388 451.014 375.226 442.167 372.154 409.224C368.205 366.885 402.263 351.712 438.532 347.689Z'
const P_PATH  = 'M591.69 349.883L652.183 349.793C668.404 349.779 692.625 348.653 707.674 352.793C716.991 355.371 725.488 360.304 732.346 367.117C755.626 390.443 754.804 434.159 731.747 457.175C715.658 473.236 694.163 475.061 672.712 474.606C662.112 474.381 651.277 474.567 640.664 474.525L640.719 449.79C671.678 449.581 715.744 458.654 724.352 419.908C728.319 387.605 709.827 372.875 679.311 373.975C674.024 374.166 668.029 373.994 662.683 374.01L615.998 374.194L615.955 536.93L591.707 536.764L591.69 349.883Z'
const R1_PATH = 'M1035.43 349.884L1101.63 349.779C1117.18 349.759 1131.76 348.914 1147.46 351.469C1191.83 358.684 1206.77 412.536 1180.62 445.935C1168.85 460.963 1152.77 464.378 1134.59 466.173C1153.69 487.785 1181.92 515.058 1202.56 536.176L1169.71 536.221L1089.56 454.24C1087.09 451.939 1084.2 449.709 1083.21 446.547C1083.28 446.008 1083.28 444.814 1083.5 444.371C1087.25 436.869 1140.71 450.713 1159.9 432.09C1166.14 426.039 1168.6 418.231 1168.74 409.707C1168.9 400.535 1166.81 391.482 1160.2 384.767C1155.36 379.849 1148.98 376.888 1142.31 375.376C1131.3 372.883 1118.95 373.958 1107.7 373.984L1059.72 374.152C1061.08 425.774 1059.83 483.997 1059.86 536.24L1035.47 536.222L1035.43 349.884Z'
const R2_PATH = 'M1246.62 349.875L1312.17 349.807C1327.81 349.78 1343.83 348.82 1359.46 351.591C1403.07 359.319 1417.7 413.269 1391.45 445.997C1379.72 460.624 1363.79 464.578 1345.74 466.108L1413.86 536.156L1381.03 536.212L1303.04 456.941C1299.59 453.51 1295.46 450.323 1293.88 445.95C1293.94 444.993 1293.79 442.698 1295.09 442.617C1309.01 442.651 1323.68 441.158 1337.61 442.158C1371.86 444.615 1391.78 417.024 1372.73 386.625C1363.59 372.027 1336.52 373.922 1319.43 373.972L1271.43 374.171C1270.79 427.888 1271.57 482.37 1271.27 536.215L1246.58 536.273L1246.62 349.875Z'

function SporrWordmark({ color = FOG, breakColor = COPPER, width = 72 }: { color?: string; breakColor?: string; width?: number }) {
  const h = (width / 1046) * 200
  return (
    <svg viewBox="371 344 1046 200" width={width} height={h} aria-label="Sporr" role="img">
      {[S_PATH, P_PATH, O_ARC, R1_PATH, R2_PATH].map((d, i) => <path key={i} fill={color} d={d} />)}
      <path fill={breakColor} d={O_BREAK} />
    </svg>
  )
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/dashboard',             label: 'Overview',     icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/></svg> },
  { href: '/dashboard/sponsors',    label: 'Sponsors',     icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.39 7.26L18 8.18L14 12.08L14.95 17.66L10 15L5.05 17.66L6 12.08L2 8.18L7.61 7.26L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/></svg> },
  { href: '/dashboard/obligations', label: 'Deliverables', icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><path d="M7 7h6M7 10h6M7 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/dashboard/audit',       label: 'Capture',      icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><circle cx="10" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M7 6l1.2-2h3.6L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { href: '/dashboard/contracts',   label: 'Contracts',    icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/dashboard/financial',   label: 'Financial',    icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 14l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { href: '/proof-pack',            label: 'Reports',      icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 10L10 3L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 8.5V17H15V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><path d="M8 17V12h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/dashboard/club',        label: 'Profile',      icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CapturePage() {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [events, setEvents]       = useState<Event[]>([])
  const [sessions, setSessions]   = useState<Session[]>([])
  const [org, setOrg]             = useState<OrgData | null>(null)
  const [orgId, setOrgId]         = useState<string | null>(null)
  const [planTier, setPlanTier]   = useState('foundation')
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [launching, setLaunching] = useState(false)
  const [activeSession, setActiveSession] = useState<{ token: string; qrUrl: string } | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    event_id: '',
    new_event_title: '',
    new_event_venue: '',
    new_event_date: '',
    attendance: '',
    delivery_context: 'match_day',
  })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: userData } = await supabase
        .from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }

      setOrgId(userData.org_id)

      const [orgRes, eventsRes, sessionsRes] = await Promise.all([
        supabase.from('organisations')
          .select('id,name,tier,logo_url,show_logo_on_dashboard,club_colour_primary,club_colour_secondary')
          .eq('id', userData.org_id).single(),
        supabase.from('events')
          .select('id, title, venue, starts_at')
          .eq('org_id', userData.org_id)
          .order('starts_at', { ascending: false }),
        supabase.from('audit_sessions')
          .select('id, session_token, status, created_at, attendance, delivery_context, events(title)')
          .eq('org_id', userData.org_id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      if (orgRes.data) {
        const o = orgRes.data as OrgData
        setOrg(o)
        setPlanTier(normaliseTier(o.tier))
      }
      setEvents(eventsRes.data || [])
      setSessions((sessionsRes.data as unknown as Session[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleLaunch() {
    if (!orgId) return
    setLaunching(true)
    setError(null)
    let eventId = form.event_id

    if (!eventId && form.new_event_title) {
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          org_id: orgId,
          title: form.new_event_title,
          venue: form.new_event_venue || null,
          starts_at: form.new_event_date || null,
        })
        .select().single()
      if (eventError) { setError(eventError.message); setLaunching(false); return }
      eventId = newEvent.id
      setEvents(prev => [newEvent, ...prev])
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('audit_sessions')
      .insert({
        org_id: orgId,
        event_id: eventId || null,
        status: 'active',
        attendance: form.attendance ? parseInt(form.attendance) : null,
        delivery_context: form.delivery_context,
      })
      .select().single()

    if (sessionError) { setError(sessionError.message); setLaunching(false); return }

    const token = sessionData.session_token
    const auditUrl = `${window.location.origin}/audit/${token}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(auditUrl)}`
    setActiveSession({ token, qrUrl })
    setSessions(prev => [sessionData as unknown as Session, ...prev])
    setShowForm(false)
    setLaunching(false)
  }

  async function markComplete(sessionId: string) {
    setClosingId(sessionId)
    await supabase
      .from('audit_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId)
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'completed' } : s))
    setClosingId(null)
  }

  async function updateAttendance(sessionId: string, attendance: number) {
    await supabase.from('audit_sessions').update({ attendance }).eq('id', sessionId)
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, attendance } : s))
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/') }

  const activeSessions = sessions.filter(s => s.status === 'active')
  const totalSeasonAttendance = sessions.reduce((sum, s) => sum + (s.attendance || 0), 0)

  // ── Colour resolution ───────────────────────────────────────────────────────
  // Nav chrome stays consistent with the rest of the app (INK default).
  // Content accents default to the Sporr highlight colours (Blue / Copper) and
  // pick up the club's chosen colours subtly when set in Profile.
  const navActive = org?.club_colour_primary || INK
  const accent    = org?.club_colour_primary || BLUE     // primary subtle accent
  const accent2   = org?.club_colour_secondary || COPPER // secondary subtle accent
  const planLabel = PLAN_TIER_LABELS[planTier] || 'Foundation'
  const crest     = org?.logo_url || null

  const btnPrimary: React.CSSProperties = { background: BLUE, color: '#FFFFFF', fontSize: 14, fontWeight: 600, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }
  const btnNeutral: React.CSSProperties = { background: 'rgba(8,18,22,0.06)', color: INK, fontSize: 14, fontWeight: 500, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="hidden lg:flex flex-col w-[220px] min-h-screen fixed left-0 top-0 bottom-0 z-40"
      style={{ background: SIDE, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SporrWordmark color={FOG} breakColor={COPPER} width={72} />
      </div>
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ background: navActive + '22', border: `1.5px solid ${navActive}55` }}>
            {crest
              ? <img src={crest} alt="" className="w-full h-full object-contain p-0.5" />
              : <span className="text-xs font-bold" style={{ color: FOG }}>{(org?.name || 'O').charAt(0).toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: FOG }}>{org?.name || 'Your organisation'}</p>
            <p className="text-xs" style={{ color: SLATE }}>{planLabel}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          const txt = active ? textOnColour(navActive) : SLATE
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium"
              style={{ color: txt, background: active ? navActive : 'transparent' }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
              <span style={{ color: txt }}>{item.icon(active)}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleSignOut} className="text-xs flex items-center gap-2" style={{ color: SLATE }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = FOG)}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = SLATE)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6 12H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 9l3-3-3-3M13 6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Sign out
        </button>
      </div>
    </aside>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div style={{ color: SLATE, fontSize: 13 }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Sidebar />

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3"
        style={{ background: SIDE, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SporrWordmark color={FOG} breakColor={COPPER} width={56} />
        <Link href="/dashboard" className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.08)', color: FOG }}>← Dashboard</Link>
      </div>

      <main className="lg:pl-[220px] pb-16">
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '36px 24px' }}>

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="font-bold tracking-tight mb-1" style={{ fontSize: 26, color: INK, letterSpacing: '-0.02em' }}>Capture</h1>
              <p style={{ fontSize: 14, color: SLATE }}>Launch a session to capture evidence of sponsor deliverables in the field.</p>
            </div>
            <button onClick={() => { setShowForm(true); setActiveSession(null) }} style={btnPrimary}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0E6AE0')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = BLUE)}>
              Launch session
            </button>
          </div>

          {/* Active sessions — shown at top, in-brand emphasis */}
          {activeSessions.length > 0 && (
            <div className="mb-8">
              <h2 style={{ ...sectionHead, marginBottom: 12 }}>Active sessions</h2>
              <div className="space-y-3">
                {activeSessions.map(session => (
                  <div key={session.id}
                    style={{ background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${accent}`, borderRadius: 16, padding: '20px 24px' }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3">
                        <span className="mt-1.5 flex-shrink-0" style={{ width: 8, height: 8, borderRadius: '50%', background: accent2 }} />
                        <div>
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-medium" style={{ color: INK }}>{session.events?.title || 'No event linked'}</p>
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                              style={{ background: accent, color: textOnColour(accent) }}>Active</span>
                          </div>
                          <p className="text-xs" style={{ color: SLATE }}>
                            {DELIVERY_CONTEXTS.find(c => c.value === session.delivery_context)?.label || 'Match day'}
                            {' · '}
                            {new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <a href={`/audit/${session.session_token}`} style={btnPrimary}
                          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#0E6AE0')}
                          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = BLUE)}>
                          Open field mode →
                        </a>
                        <button onClick={() => markComplete(session.id)} disabled={closingId === session.id}
                          style={{ ...btnNeutral, opacity: closingId === session.id ? 0.5 : 1 }}>
                          {closingId === session.id ? 'Closing...' : 'Mark complete'}
                        </button>
                      </div>
                    </div>

                    {/* Attendance inline */}
                    <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <label className="text-xs whitespace-nowrap" style={{ color: SLATE }}>Attendance</label>
                      <input type="number" style={{ ...inpStyle, width: 96, padding: '6px 12px' }} placeholder="0"
                        defaultValue={session.attendance || ''}
                        onBlur={e => { const val = parseInt(e.target.value); if (!isNaN(val)) updateAttendance(session.id, val) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Season attendance total */}
          {totalSeasonAttendance > 0 && (
            <div style={{ ...CARD, marginBottom: 24 }} className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: SLATE }}>Season attendance total</p>
                <p className="text-3xl font-bold" style={{ color: INK }}>{totalSeasonAttendance.toLocaleString('nb-NO')}</p>
              </div>
              <p className="text-sm max-w-xs text-right" style={{ color: SLATE }}>Used automatically in your Proof Pack audience calculations</p>
            </div>
          )}

          {/* QR — session active confirmation */}
          {activeSession && (
            <div style={{ ...CARD, marginBottom: 32 }} className="text-center">
              <div className="inline-block rounded-xl p-6 mb-6" style={{ background: INK }}>
                <img src={activeSession.qrUrl} alt="Capture session QR code" className="w-48 h-48 mx-auto" />
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: INK }}>Session active</h2>
              <p className="text-sm mb-4" style={{ color: SLATE }}>Scan this QR code on your phone to open Capture field mode</p>
              <div className="rounded-lg px-4 py-3 mb-6" style={{ background: BG }}>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: SLATE }}>Direct link</p>
                <a href={`/audit/${activeSession.token}`} className="text-sm font-medium break-all" style={{ color: INK }}>
                  {typeof window !== 'undefined' ? window.location.origin : ''}/audit/{activeSession.token}
                </a>
              </div>
              <button onClick={() => setActiveSession(null)} style={btnNeutral}>Done</button>
            </div>
          )}

          {/* Launch form */}
          {showForm && (
            <div style={{ ...CARD, marginBottom: 32 }}>
              <h2 className="text-lg font-bold mb-6" style={{ color: INK }}>Launch session</h2>
              {error && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0"><path d="M8 2v7M8 11v2" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <p style={{ fontSize: 13, color: '#92400E' }}>{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label style={lblStyle}>Session type</label>
                <select style={inpStyle} value={form.delivery_context} onChange={e => update('delivery_context', e.target.value)}>
                  {DELIVERY_CONTEXTS.map(ctx => <option key={ctx.value} value={ctx.value}>{ctx.label}</option>)}
                </select>
                <p className="text-xs mt-1" style={{ color: SLATE }}>Only deliverables matching this context will be available to capture in this session</p>
              </div>

              <div className="mb-6">
                <label style={lblStyle}>Link to an event (optional)</label>
                <select style={inpStyle} value={form.event_id} onChange={e => update('event_id', e.target.value)}>
                  <option value="">No event linked</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}{e.venue ? ` — ${e.venue}` : ''}</option>)}
                </select>
              </div>

              {!form.event_id && (
                <div className="pt-6 mb-6" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <p className="text-sm mb-4" style={{ color: SLATE }}>Or create a new event:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label style={lblStyle}>Event name</label>
                      <input style={inpStyle} placeholder="vs Brann — Eliteserien" value={form.new_event_title} onChange={e => update('new_event_title', e.target.value)} />
                    </div>
                    <div>
                      <label style={lblStyle}>Venue</label>
                      <input style={inpStyle} placeholder="Color Line Stadion" value={form.new_event_venue} onChange={e => update('new_event_venue', e.target.value)} />
                    </div>
                    <div>
                      <label style={lblStyle}>Date</label>
                      <input type="date" style={inpStyle} value={form.new_event_date} onChange={e => update('new_event_date', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 mb-6" style={{ borderTop: `1px solid ${BORDER}` }}>
                <label style={lblStyle}>Attendance</label>
                <input type="number" style={{ ...inpStyle, maxWidth: 240 }} placeholder="600" value={form.attendance} onChange={e => update('attendance', e.target.value)} />
                <p className="text-xs mt-1" style={{ color: SLATE }}>Tallied across all sessions for your Proof Pack</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handleLaunch} disabled={launching} style={{ ...btnPrimary, opacity: launching ? 0.5 : 1 }}
                  onMouseEnter={e => { if (!launching) (e.currentTarget as HTMLButtonElement).style.background = '#0E6AE0' }}
                  onMouseLeave={e => { if (!launching) (e.currentTarget as HTMLButtonElement).style.background = BLUE }}>
                  {launching ? 'Launching...' : 'Generate QR code'}
                </button>
                <button onClick={() => { setShowForm(false); setError(null) }} style={btnNeutral}>Cancel</button>
              </div>
            </div>
          )}

          {/* Session history */}
          {sessions.filter(s => s.status !== 'active').length > 0 && (
            <div>
              <h2 style={{ ...sectionHead, marginBottom: 16 }}>Session history</h2>
              <div className="space-y-3">
                {sessions.filter(s => s.status !== 'active').map(session => (
                  <div key={session.id} style={CARD}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-medium" style={{ color: INK }}>{session.events?.title || 'No event linked'}</p>
                        <p className="text-xs mt-0.5" style={{ color: SLATE }}>
                          {DELIVERY_CONTEXTS.find(c => c.value === session.delivery_context)?.label || 'Match day'}
                          {' · '}
                          {new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className="text-xs whitespace-nowrap" style={{ color: SLATE }}>Attendance</label>
                          <input type="number" style={{ ...inpStyle, width: 96, padding: '6px 12px' }} placeholder="0"
                            defaultValue={session.attendance || ''}
                            onBlur={e => { const val = parseInt(e.target.value); if (!isNaN(val)) updateAttendance(session.id, val) }} />
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize" style={{ background: 'rgba(8,18,22,0.06)', color: SLATE }}>
                          {session.status}
                        </span>
                        <a href={`/audit/${session.session_token}`} className="text-sm transition-colors" style={{ color: SLATE }}
                          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = INK)}
                          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = SLATE)}>Open →</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state — no sessions at all */}
          {sessions.length === 0 && !showForm && (
            <div style={{ ...CARD, padding: '40px 24px' }} className="text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: accent + '14' }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="6" width="16" height="12" rx="2" stroke={accent} strokeWidth="1.5"/><circle cx="10" cy="12" r="3" stroke={accent} strokeWidth="1.5"/><path d="M7 6l1.2-2h3.6L13 6" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: INK }}>No capture sessions yet</p>
              <p className="text-sm mb-4" style={{ color: SLATE }}>Launch your first session to start capturing evidence in the field.</p>
              <button onClick={() => { setShowForm(true); setActiveSession(null) }} style={btnPrimary}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0E6AE0')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = BLUE)}>
                Launch session
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
