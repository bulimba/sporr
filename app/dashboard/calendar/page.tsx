'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

/*
 ─────────────────────────────────────────────────────────────────────────────
 CALENDAR SURFACE  —  app/dashboard/calendar/page.tsx   (build step 3)

 One calendar per Environment, all sports together. Built for use.
 - Desktop month grid; mobile collapsible agenda.
 - Read-time task derivation (hybrid engine, §4): expected tasks per event are
   derived from active commitments at render; materialised capture_tasks carry
   real status and win over the virtual default.
 - Capture chip per event: Session active | Complete | n/m captured | Capture ready.
 - Event drawer: tasks grouped by sponsor, status pills, launch / field-mode CTA.
 - Ongoing & season-long rail for standing (event_id null) commitments.

 Colour discipline (locked): Verified Green = verified only · Blue = in-review ·
 Slate = pending · Alert Red = failed flag ONLY. Club colour is a subtle accent.

 NOTE (step 7): event-scoped launch (PIN/cap/TTL) is not built yet — the drawer
 CTA routes to the existing Capture page for now. Nav repointing of "Deliverables"
 → Calendar is step 9; this page lives at /dashboard/calendar in the meantime.
 ─────────────────────────────────────────────────────────────────────────────
*/

// ── Brand tokens ──────────────────────────────────────────────────────────────
const INK    = '#081216'
const PINE   = '#0F2A2E'
const FOG    = '#E7ECEF'
const SLATE  = '#6E7F86'
const BLUE   = '#147BFF'
const COPPER = '#B8734A'
const GREEN  = '#36B37E' // verified only
const ALERT  = '#E5484D' // failed flag + at-risk icons ONLY
const BG     = '#F5F2ED'
const WHITE  = '#FFFFFF'
const SIDE   = '#0A1A1F'
const BORDER = 'rgba(8,18,22,0.08)'

// ── Types ─────────────────────────────────────────────────────────────────────
type OrgData = {
  id: string; name: string; tier: string; logo_url: string | null
  show_logo_on_dashboard: boolean | null
  club_colour_primary: string | null; club_colour_secondary: string | null
}
type EventRow = {
  id: string; title: string; venue: string | null
  starts_at: string | null; ends_at: string | null
  event_type: string; category: string | null; club: string | null
}
type Commitment = {
  id: string; contract_id: string; asset_id: string | null
  description: string | null; proof_type: string
  recurrence_rule: string; applies_to: string; quantity: number; active: boolean
  contracts: { title: string | null; sponsors: { company_name: string | null } | null } | null
  assets: { name: string | null; asset_type: string | null } | null
}
type CaptureTask = { id: string; commitment_id: string; event_id: string | null; status: string }
type ActiveSession = { id: string; event_id: string | null; session_token: string }

type TaskStatus = 'pending' | 'submitted' | 'verified' | 'failed' | 'make_good'
type DerivedTask = {
  commitment_id: string; sponsor_name: string; label: string
  proof_type: string; quantity: number; status: TaskStatus; materialised: boolean
}

// ── Status meta ───────────────────────────────────────────────────────────────
const TASK_STATUS: Record<TaskStatus, { label: string; color: string; flag?: boolean }> = {
  pending:   { label: 'Pending',   color: SLATE  },
  submitted: { label: 'In review', color: BLUE   },
  verified:  { label: 'Verified',  color: GREEN  },
  failed:    { label: 'Failed',    color: ALERT, flag: true },
  make_good: { label: 'Make-good', color: COPPER },
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  home_match: 'Home match', away_match: 'Away match', training: 'Training',
  community: 'Community', media: 'Media', event: 'Event', other: 'Other',
}

// recurrence → event_type mapping (hybrid engine, §4.1)
function expectedEventTypes(rule: string, appliesTo: string): string[] {
  switch (rule) {
    case 'per_match':
      return appliesTo === 'away' ? ['away_match']
        : appliesTo === 'both' ? ['home_match', 'away_match']
        : ['home_match']
    case 'per_training': return ['training']
    case 'per_event':    return ['event', 'community', 'media']
    default:             return [] // once / season_long → standing, not on events
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const sponsorOf = (c: Commitment) => c.contracts?.sponsors?.company_name || 'Sponsor'
const labelOf   = (c: Commitment) => c.description || c.assets?.name || 'Deliverable'

function textOnColour(hex: string): string {
  if (!hex || hex.length < 7) return '#FFFFFF'
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000000' : '#FFFFFF'
}

// ── SVG wordmark ──────────────────────────────────────────────────────────────
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

const NAV_ITEMS = [
  { href: '/dashboard',             label: 'Overview',     icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/></svg> },
  { href: '/dashboard/sponsors',    label: 'Sponsors',     icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.39 7.26L18 8.18L14 12.08L14.95 17.66L10 15L5.05 17.66L6 12.08L2 8.18L7.61 7.26L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/></svg> },
  { href: '/dashboard/calendar',    label: 'Calendar',     icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="3.5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><path d="M6 1.5v3M14 1.5v3M2.5 7.5h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/dashboard/audit',       label: 'Capture',      icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><circle cx="10" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M7 6l1.2-2h3.6L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { href: '/dashboard/contracts',   label: 'Contracts',    icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/dashboard/financial',   label: 'Financial',    icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 14l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { href: '/proof-pack',            label: 'Reports',      icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 10L10 3L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 8.5V17H15V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><path d="M8 17V12h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/dashboard/club',        label: 'Profile',      icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function FlagIcon({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none"><path d="M2.5 1v10" stroke={ALERT} strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 1.5h6.5l-1.4 2 1.4 2H2.5" fill={ALERT} stroke={ALERT} strokeWidth="1.1" strokeLinejoin="round"/></svg>
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [org, setOrg]               = useState<OrgData | null>(null)
  const [events, setEvents]         = useState<EventRow[]>([])
  const [commitments, setCommits]   = useState<Commitment[]>([])
  const [tasks, setTasks]           = useState<CaptureTask[]>([])
  const [sessions, setSessions]     = useState<ActiveSession[]>([])
  const [loading, setLoading]       = useState(true)

  const [cursor, setCursor]         = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selectedEvent, setSelected] = useState<EventRow | null>(null)
  const [openDays, setOpenDays]     = useState<Record<string, boolean>>({})
  const [orgSports, setOrgSports]   = useState<string[]>([])
  const [eventModal, setEventModal] = useState<null | 'single' | 'season'>(null)
  const [creating, setCreating]     = useState(false)
  const [single, setSingle]         = useState({ title: '', venue: '', date: '', time: '', event_type: 'home_match', category: '', club: '' })
  const [season, setSeason]         = useState({ event_type: 'home_match', club: '', venue: '', titlePrefix: '', dates: '' })

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      const orgId = userData.org_id

      const [orgRes, eventsRes, commitsRes, tasksRes, sessionsRes] = await Promise.all([
        supabase.from('organisations')
          .select('id,name,tier,logo_url,show_logo_on_dashboard,club_colour_primary,club_colour_secondary,sports')
          .eq('id', orgId).single(),
        supabase.from('events')
          .select('id,title,venue,starts_at,ends_at,event_type,category,club')
          .eq('org_id', orgId).order('starts_at', { ascending: true }),
        supabase.from('commitments')
          .select('id,contract_id,asset_id,description,proof_type,recurrence_rule,applies_to,quantity,active,contracts(title,sponsors(company_name)),assets(name,asset_type)')
          .eq('org_id', orgId).eq('active', true),
        supabase.from('capture_tasks')
          .select('id,commitment_id,event_id,status')
          .eq('org_id', orgId),
        supabase.from('audit_sessions')
          .select('id,event_id,session_token')
          .eq('org_id', orgId).eq('status', 'active'),
      ])

      if (orgRes.data) { setOrg(orgRes.data as OrgData); setOrgSports(((orgRes.data as any).sports as string[] | null) || []) }
      setEvents((eventsRes.data as EventRow[]) || [])
      setCommits((commitsRes.data as unknown as Commitment[]) || [])
      setTasks((tasksRes.data as CaptureTask[]) || [])
      setSessions((sessionsRes.data as ActiveSession[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Event authoring (Step 4.6) — writes org-wide events ─────────────────────
  async function createSingleEvent() {
    if (!org || !single.title.trim() || !single.date) { alert('Title and date are required.'); return }
    setCreating(true)
    const startsAt = single.time ? `${single.date}T${single.time}` : single.date
    const { data, error } = await supabase.from('events').insert({
      org_id: org.id,
      title: single.title.trim(),
      venue: single.venue.trim() || null,
      starts_at: startsAt,
      event_type: single.event_type,
      category: single.category.trim() || null,
      club: single.club || null,
    }).select('id,title,venue,starts_at,ends_at,event_type,category,club').single()
    if (error) { alert(error.message); setCreating(false); return }
    setEvents(prev => [...prev, data as EventRow].sort((a, b) => (a.starts_at || '').localeCompare(b.starts_at || '')))
    setSingle({ title: '', venue: '', date: '', time: '', event_type: 'home_match', category: '', club: '' })
    setEventModal(null); setCreating(false)
  }

  async function createSeason() {
    if (!org) return
    // Parse one date per line. Accept `YYYY-MM-DD`, optionally `YYYY-MM-DD HH:MM`,
    // optionally a trailing `, Opponent / label` to vary the title.
    const lines = season.dates.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) { alert('Add at least one date (one per line).'); return }
    const rows: any[] = []
    const bad: string[] = []
    for (const line of lines) {
      const m = line.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?(?:\s*,\s*(.+))?$/)
      if (!m) { bad.push(line); continue }
      const [, date, time, label] = m
      const base = season.titlePrefix.trim() || ({ home_match: 'Home match', away_match: 'Away match', training: 'Training', community: 'Community event', media: 'Media day', event: 'Event', other: 'Event' } as Record<string, string>)[season.event_type]
      rows.push({
        org_id: org.id,
        title: label ? `${base} — ${label}` : base,
        venue: season.venue.trim() || null,
        starts_at: time ? `${date}T${time}` : date,
        event_type: season.event_type,
        category: null,
        club: season.club || null,
      })
    }
    if (bad.length) { alert(`Couldn't read ${bad.length} line(s). Use YYYY-MM-DD, optionally a time and ", label".\nFirst problem: ${bad[0]}`); return }
    setCreating(true)
    const { data, error } = await supabase.from('events').insert(rows).select('id,title,venue,starts_at,ends_at,event_type,category,club')
    if (error) { alert(error.message); setCreating(false); return }
    setEvents(prev => [...prev, ...(data as EventRow[])].sort((a, b) => (a.starts_at || '').localeCompare(b.starts_at || '')))
    setSeason({ event_type: 'home_match', club: '', venue: '', titlePrefix: '', dates: '' })
    setEventModal(null); setCreating(false)
  }

  const accent = org?.club_colour_primary || BLUE
  const crest  = (org?.show_logo_on_dashboard && org?.logo_url) ? org.logo_url : null
  const planLabel = ({ foundation: 'Foundation', organisation: 'Organisation', portfolio: 'Portfolio', network: 'Network' } as Record<string, string>)[org?.tier || ''] || 'Foundation'

  // task index: materialised tasks keyed by `${commitment_id}|${event_id ?? 'standing'}`
  const taskIndex = useMemo(() => {
    const m: Record<string, CaptureTask> = {}
    for (const t of tasks) m[`${t.commitment_id}|${t.event_id ?? 'standing'}`] = t
    return m
  }, [tasks])

  // derive the full task list for one event (expected ∪ materialised) — §4.2/§4.4
  function tasksForEvent(ev: EventRow): DerivedTask[] {
    const out: DerivedTask[] = []
    const seen = new Set<string>()
    // expected (virtual) from active commitments
    for (const c of commitments) {
      if (!expectedEventTypes(c.recurrence_rule, c.applies_to).includes(ev.event_type)) continue
      const mat = taskIndex[`${c.id}|${ev.id}`]
      seen.add(c.id)
      out.push({
        commitment_id: c.id, sponsor_name: sponsorOf(c), label: labelOf(c),
        proof_type: c.proof_type, quantity: c.quantity,
        status: (mat?.status as TaskStatus) || 'pending', materialised: !!mat,
      })
    }
    // materialised tasks on this event whose commitment wasn't expected (ad-hoc / make-good children)
    for (const t of tasks) {
      if (t.event_id !== ev.id || seen.has(t.commitment_id)) continue
      const c = commitments.find(x => x.id === t.commitment_id)
      out.push({
        commitment_id: t.commitment_id,
        sponsor_name: c ? sponsorOf(c) : 'Sponsor',
        label: c ? labelOf(c) : 'Deliverable',
        proof_type: c?.proof_type || 'photo', quantity: c?.quantity || 1,
        status: (t.status as TaskStatus) || 'pending', materialised: true,
      })
    }
    return out
  }

  function chipFor(ev: EventRow): { label: string; color: string; failed: boolean } | null {
    const active = sessions.some(s => s.event_id === ev.id)
    const list = tasksForEvent(ev)
    const failed = list.some(t => t.status === 'failed')
    if (active) return { label: 'Session active', color: BLUE, failed }
    if (list.length === 0) return null
    const verified = list.filter(t => t.status === 'verified').length
    const captured = list.filter(t => t.status === 'verified' || t.status === 'submitted').length
    if (verified === list.length) return { label: 'Complete', color: GREEN, failed }
    if (captured > 0) return { label: `${captured}/${list.length} captured`, color: BLUE, failed }
    return { label: 'Capture ready', color: SLATE, failed }
  }

  // standing commitments → ongoing rail (§8)
  const standing = useMemo(() => commitments
    .filter(c => c.recurrence_rule === 'once' || c.recurrence_rule === 'season_long')
    .map(c => {
      const mat = taskIndex[`${c.id}|standing`]
      return { c, status: ((mat?.status as TaskStatus) || 'pending') as TaskStatus }
    }), [commitments, taskIndex])

  // month grid math (Monday-first)
  const grid = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const startOffset = (first.getDay() + 6) % 7 // Mon=0
    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    const daysIn = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysIn; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [cursor])

  const eventsByDay = useMemo(() => {
    const m: Record<string, EventRow[]> = {}
    for (const ev of events) {
      if (!ev.starts_at) continue
      const key = ymd(new Date(ev.starts_at))
      ;(m[key] ||= []).push(ev)
    }
    return m
  }, [events])

  // agenda (mobile): upcoming + this-month events grouped by day, soonest first
  const agendaDays = useMemo(() => {
    const todayKey = ymd(new Date())
    const byDay: Record<string, EventRow[]> = {}
    for (const ev of events) {
      if (!ev.starts_at) continue
      const key = ymd(new Date(ev.starts_at))
      if (key < todayKey) continue
      ;(byDay[key] ||= []).push(ev)
    }
    return Object.keys(byDay).sort().map(key => ({ key, events: byDay[key] }))
  }, [events])

  const todayKey = ymd(new Date())

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="hidden lg:flex flex-col w-[220px] min-h-screen fixed left-0 top-0 bottom-0 z-40"
      style={{ background: SIDE, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SporrWordmark color={FOG} breakColor={COPPER} width={72} />
      </div>
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ background: accent + '22', border: `1.5px solid ${accent}55` }}>
            {crest ? <img src={crest} alt="" className="w-full h-full object-contain p-0.5" />
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
          const txt = active ? textOnColour(accent) : SLATE
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium"
              style={{ color: txt, background: active ? accent : 'transparent' }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
              <span style={{ color: txt }}>{item.icon(active)}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}><div style={{ color: SLATE, fontSize: 13 }}>Loading…</div></div>
  }

  // ── Event card (shared between grid cell + agenda + drawer trigger) ─────────
  const EventChip = ({ ev, compact }: { ev: EventRow; compact?: boolean }) => {
    const chip = chipFor(ev)
    const club = ev.club
    return (
      <button onClick={() => setSelected(ev)}
        className="w-full text-left rounded-lg transition-colors"
        style={{ background: compact ? 'transparent' : WHITE, border: compact ? 'none' : `1px solid ${BORDER}`, padding: compact ? '3px 6px' : '12px 14px' }}
        onMouseEnter={e => { if (compact) (e.currentTarget as HTMLButtonElement).style.background = BG }}
        onMouseLeave={e => { if (compact) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
        <div className="flex items-center gap-1.5" style={{ minWidth: 0 }}>
          <span className="flex-shrink-0 rounded-full" style={{ width: 6, height: 6, background: chip?.color || SLATE }} />
          <span className="truncate" style={{ fontSize: compact ? 11 : 14, fontWeight: 600, color: INK }}>{ev.title}</span>
          {chip?.failed && <span className="flex-shrink-0"><FlagIcon /></span>}
        </div>
        {!compact && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: 'rgba(8,18,22,0.05)', color: SLATE }}>{EVENT_TYPE_LABELS[ev.event_type] || ev.event_type}</span>
            {ev.category && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: COPPER + '18', color: COPPER }}>{ev.category}</span>}
            {club && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: accent + '18', color: accent }}>{club}</span>}
            {ev.venue && <span className="text-[11px]" style={{ color: SLATE }}>{ev.venue}</span>}
            {ev.starts_at && <span className="text-[11px]" style={{ color: SLATE }}>{new Date(ev.starts_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
            {chip && <span className="text-[11px] font-medium ml-auto" style={{ color: chip.color }}>{chip.label}</span>}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Sidebar />

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3" style={{ background: SIDE, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SporrWordmark color={FOG} breakColor={COPPER} width={56} />
        <Link href="/dashboard" className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: FOG }}>← Dashboard</Link>
      </div>

      <main className="lg:pl-[220px] pb-16">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px' }}>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="font-bold tracking-tight mb-1" style={{ fontSize: 26, color: INK, letterSpacing: '-0.02em' }}>Calendar</h1>
              <p style={{ fontSize: 14, color: SLATE }}>Every fixture, training, and event — with what needs capturing on each.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setEventModal('single')}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Add event
              </button>
              <button onClick={() => setEventModal('season')}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: INK, color: FOG }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0F2A2E')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = INK)}>
                Add a season
              </button>
              <Link href="/dashboard/audit"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: BLUE, color: '#FFFFFF' }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#0E6AE0')}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = BLUE)}>
                Launch capture session
              </Link>
            </div>
          </div>

          {/* Ongoing & season-long rail */}
          {standing.length > 0 && (
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: SLATE }}>Ongoing &amp; season-long</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {standing.map(({ c, status }) => {
                  const meta = TASK_STATUS[status]
                  return (
                    <div key={c.id} className="rounded-xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: COPPER }}>{sponsorOf(c)}</p>
                        <p className="text-sm font-medium truncate" style={{ color: INK }}>{labelOf(c)}</p>
                        <p className="text-[11px]" style={{ color: SLATE }}>{c.recurrence_rule === 'season_long' ? 'Season-long' : 'One-off'} · {c.proof_type}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0" style={{ background: meta.color + '18', color: meta.color }}>
                        {meta.flag && <FlagIcon size={10} />}{meta.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Month switcher */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: INK }}>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Previous month"
                className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: SLATE }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)) }}
                className="px-3 h-9 rounded-lg text-xs font-medium" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK }}>Today</button>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Next month"
                className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: SLATE }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>

          {/* DESKTOP — month grid */}
          <div className="hidden lg:block rounded-2xl overflow-hidden" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
            <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${BORDER}` }}>
              {WEEKDAYS.map(d => <div key={d} className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: SLATE }}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((day, i) => {
                const key = day ? ymd(day) : `empty-${i}`
                const dayEvents = day ? (eventsByDay[ymd(day)] || []) : []
                const isToday = day && ymd(day) === todayKey
                return (
                  <div key={key} style={{ minHeight: 116, borderRight: (i % 7 !== 6) ? `1px solid ${BORDER}` : 'none', borderBottom: i < grid.length - 7 ? `1px solid ${BORDER}` : 'none', background: day ? WHITE : '#FBFAF7', padding: 8 }}>
                    {day && (
                      <>
                        <div className="flex items-center justify-center w-6 h-6 mb-1" style={{ borderRadius: '50%', background: isToday ? accent : 'transparent' }}>
                          <span className="text-xs font-semibold" style={{ color: isToday ? textOnColour(accent) : SLATE }}>{day.getDate()}</span>
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(ev => <EventChip key={ev.id} ev={ev} compact />)}
                          {dayEvents.length > 3 && <p className="text-[10px] px-1.5" style={{ color: SLATE }}>+{dayEvents.length - 3} more</p>}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* MOBILE — collapsible agenda */}
          <div className="lg:hidden space-y-2">
            {agendaDays.length === 0 && (
              <div className="rounded-2xl px-6 py-12 text-center" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
                <p className="text-sm font-medium mb-1" style={{ color: INK }}>No upcoming events</p>
                <p className="text-sm mb-4" style={{ color: SLATE }}>Add fixtures so commitments can generate capture tasks.</p>
                <button onClick={() => setEventModal('season')} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: INK, color: FOG }}>Add a season</button>
              </div>
            )}
            {agendaDays.map(({ key, events: evs }) => {
              const d = new Date(key)
              const isOpen = openDays[key] ?? true
              const isToday = key === todayKey
              return (
                <div key={key} className="rounded-2xl overflow-hidden" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
                  <button onClick={() => setOpenDays(p => ({ ...p, [key]: !isOpen }))}
                    className="w-full flex items-center justify-between px-4 py-3" style={{ background: isToday ? accent + '10' : 'transparent' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center w-11 h-11 rounded-xl" style={{ background: isToday ? accent : BG }}>
                        <span className="text-[10px] uppercase" style={{ color: isToday ? textOnColour(accent) : SLATE }}>{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                        <span className="text-base font-bold leading-none" style={{ color: isToday ? textOnColour(accent) : INK }}>{d.getDate()}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold" style={{ color: INK }}>{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</p>
                        <p className="text-xs" style={{ color: SLATE }}>{evs.length} event{evs.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: SLATE, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  {isOpen && <div className="px-3 pb-3 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>{evs.map(ev => <div key={ev.id} className="pt-2"><EventChip ev={ev} /></div>)}</div>}
                </div>
              )
            })}
          </div>

        </div>
      </main>

      {/* ── Add event / Add a season modals (Step 4.6) ──────────────────────── */}
      {eventModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(8,18,22,0.5)' }} onClick={() => !creating && setEventModal(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-[480px] sm:rounded-2xl" style={{ background: BG, maxHeight: '92vh', overflowY: 'auto', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <div className="px-6 py-5 sticky top-0 z-10 flex items-center justify-between" style={{ background: SIDE }}>
              <h2 className="text-lg font-bold" style={{ color: FOG }}>{eventModal === 'single' ? 'Add event' : 'Add a season'}</h2>
              <button onClick={() => !creating && setEventModal(null)} aria-label="Close" className="p-1.5 rounded-lg" style={{ color: SLATE }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {eventModal === 'single' ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Title</label>
                    <input value={single.title} onChange={e => setSingle(p => ({ ...p, title: e.target.value }))} placeholder="vs Brann — Eliteserien"
                      className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Date</label>
                      <input type="date" value={single.date} onChange={e => setSingle(p => ({ ...p, date: e.target.value }))} className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Time (optional)</label>
                      <input type="time" value={single.time} onChange={e => setSingle(p => ({ ...p, time: e.target.value }))} className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Type</label>
                      <select value={single.event_type} onChange={e => setSingle(p => ({ ...p, event_type: e.target.value }))} className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }}>
                        {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    {orgSports.length > 1 && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Sport / group</label>
                        <select value={single.club} onChange={e => setSingle(p => ({ ...p, club: e.target.value }))} className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }}>
                          <option value="">Whole club</option>
                          {orgSports.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Venue (optional)</label>
                      <input value={single.venue} onChange={e => setSingle(p => ({ ...p, venue: e.target.value }))} placeholder="Color Line Stadion" className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Label (optional)</label>
                      <input value={single.category} onChange={e => setSingle(p => ({ ...p, category: e.target.value }))} placeholder="Corporate, Race…" className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm" style={{ color: SLATE }}>Add a whole run of fixtures at once. They all share the type, sport, and venue below — tasks generate automatically against matching commitments.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Type</label>
                      <select value={season.event_type} onChange={e => setSeason(p => ({ ...p, event_type: e.target.value }))} className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }}>
                        {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    {orgSports.length > 1 && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Sport / group</label>
                        <select value={season.club} onChange={e => setSeason(p => ({ ...p, club: e.target.value }))} className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }}>
                          <option value="">Whole club</option>
                          {orgSports.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Venue (optional)</label>
                      <input value={season.venue} onChange={e => setSeason(p => ({ ...p, venue: e.target.value }))} placeholder="Color Line Stadion" className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Title prefix (optional)</label>
                      <input value={season.titlePrefix} onChange={e => setSeason(p => ({ ...p, titlePrefix: e.target.value }))} placeholder="Home match" className="w-full rounded-lg px-3.5 py-2.5 text-sm" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: SLATE }}>Dates — one per line</label>
                    <textarea value={season.dates} onChange={e => setSeason(p => ({ ...p, dates: e.target.value }))} rows={7}
                      placeholder={'2026-08-09\n2026-08-23 15:00\n2026-09-06, vs Brann\n2026-09-20'}
                      className="w-full rounded-lg px-3.5 py-2.5 text-sm font-mono" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK, outline: 'none', resize: 'vertical' }} />
                    <p className="text-[11px] mt-1.5" style={{ color: SLATE }}>Format: <code>YYYY-MM-DD</code>, optionally a time, optionally <code>, label</code> (e.g. opponent). One date per line.</p>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 flex gap-2 sticky bottom-0" style={{ background: BG, borderTop: `1px solid ${BORDER}`, paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button onClick={eventModal === 'single' ? createSingleEvent : createSeason} disabled={creating}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40" style={{ background: INK, color: FOG }}>
                {creating ? 'Saving…' : eventModal === 'single' ? 'Add event' : 'Add fixtures'}
              </button>
              <button onClick={() => !creating && setEventModal(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Event detail drawer ─────────────────────────────────────────────── */}
      {selectedEvent && (() => {
        const ev = selectedEvent
        const list = tasksForEvent(ev)
        const active = sessions.find(s => s.event_id === ev.id)
        const bySponsor: Record<string, DerivedTask[]> = {}
        for (const t of list) (bySponsor[t.sponsor_name] ||= []).push(t)
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(8,18,22,0.45)' }} onClick={() => setSelected(null)}>
            <div onClick={e => e.stopPropagation()} className="w-full max-w-[440px] h-full overflow-y-auto" style={{ background: BG }}>
              {/* drawer header */}
              <div className="px-6 py-5 sticky top-0 z-10" style={{ background: SIDE }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)', color: FOG }}>{EVENT_TYPE_LABELS[ev.event_type] || ev.event_type}</span>
                      {ev.category && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: COPPER + '33', color: '#E8C9B4' }}>{ev.category}</span>}
                      {ev.club && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: accent + '33', color: FOG }}>{ev.club}</span>}
                    </div>
                    <h2 className="text-lg font-bold leading-tight" style={{ color: FOG }}>{ev.title}</h2>
                    <p className="text-xs mt-1" style={{ color: SLATE }}>
                      {ev.starts_at ? new Date(ev.starts_at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No date'}
                      {ev.ends_at && ` – ${new Date(ev.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      {ev.venue && ` · ${ev.venue}`}
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label="Close" className="p-1.5 rounded-lg flex-shrink-0" style={{ color: SLATE }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="px-6 pt-5">
                {active ? (
                  <a href={`/audit/${active.session_token}`} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold mb-1" style={{ background: BLUE, color: '#FFFFFF' }}>
                    Open field mode →
                  </a>
                ) : (
                  <Link href="/dashboard/audit" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold mb-1" style={{ background: INK, color: FOG }}>
                    Launch capture session
                  </Link>
                )}
                <p className="text-[11px] text-center" style={{ color: SLATE }}>{active ? 'A session is active for this event.' : 'Captures land in review and are verified by an admin.'}</p>
              </div>

              {/* tasks grouped by sponsor */}
              <div className="px-6 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: SLATE }}>
                  Deliverables {list.length > 0 && <span style={{ color: INK }}>· {list.filter(t => t.status === 'verified').length} verified of {list.length}</span>}
                </p>
                {list.length === 0 ? (
                  <p className="text-sm py-2" style={{ color: SLATE }}>No deliverables expected for this event type. Add a commitment on the contract, or check the event type.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(bySponsor).map(([sponsor, items]) => (
                      <div key={sponsor}>
                        <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: COPPER }}>{sponsor}</p>
                        <div className="space-y-2">
                          {items.map((t, idx) => {
                            const meta = TASK_STATUS[t.status]
                            return (
                              <div key={t.commitment_id + idx} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl" style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate" style={{ color: INK }}>{t.label}</p>
                                  <p className="text-[11px]" style={{ color: SLATE }}>{t.proof_type}{t.quantity > 1 ? ` · ${t.quantity} expected` : ''}{!t.materialised ? ' · not yet captured' : ''}</p>
                                </div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0" style={{ background: meta.color + '18', color: meta.color }}>
                                  {meta.flag && <FlagIcon size={10} />}{meta.label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
