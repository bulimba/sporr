'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/*
 ─────────────────────────────────────────────────────────────────────────────
 SHARED DASHBOARD NAV — single source of truth for all /dashboard pages.
 Rendered once by app/dashboard/layout.tsx. Pages must NOT render their own
 sidebar/bottom-bar/nav arrays any more.

 - Desktop: fixed 220px sidebar (lg+). Mobile: bottom tab bar + top bar.
 - Active item tinted with the club's primary colour (fetched once on mount);
   falls back to INK.
 - Wordmark links to /dashboard everywhere. Mobile top bar also carries an
   explicit "Dashboard" button (primary affordance on mobile). Sign out lives
   in the desktop sidebar footer and the mobile More sheet.
 - Flat list: Overview · Calendar · Sponsors · Contracts · Capture · Reports ·
   Financial · Profile.  Mobile bottom bar (5): Overview · Calendar · Capture
   (centre) · Sponsors · More.
 ─────────────────────────────────────────────────────────────────────────────
*/

const INK = '#081216'
const FOG = '#E7ECEF'
const SLATE = '#6E7F86'
const COPPER = '#B8734A'
const SIDE = '#0A1A1F'

function textOnColour(hex: string): string {
  if (!hex || hex.length < 7) return '#FFFFFF'
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000000' : '#FFFFFF'
}

const PLAN_LABELS: Record<string, string> = {
  foundation: 'Foundation', organisation: 'Organisation', portfolio: 'Portfolio', network: 'Network',
  free: 'Foundation', club: 'Organisation', pro: 'Portfolio', agency: 'Network',
}

// ── wordmark ──────────────────────────────────────────────────────────────────
const O_ARC   = 'M873.735 347.639C898.493 344.775 922.792 349.648 943.469 363.849C964.779 378.522 979.408 401.039 984.155 426.472C989.607 456.155 982.16 481.366 965.308 505.675C957.877 501.095 950.861 497.807 943.039 494.028C951.244 484.183 956.989 472.528 959.799 460.024C963.871 441.089 960.3 421.313 949.863 404.998C938.576 387.638 922.504 377.041 902.392 372.759C901.94 372.676 901.487 372.599 901.033 372.528C880.508 369.277 859.101 373.103 842.11 385.427C826.478 396.918 816.067 414.162 813.178 433.347C809.468 457.588 816.492 475.116 830.476 494.232C822.176 497.845 815.897 501.472 808.117 505.943C798.035 490.808 791.722 477.724 789.052 459.404C785.108 433.179 791.888 406.471 807.864 385.303C824.374 363.356 846.814 351.416 873.735 347.639Z'
const O_BREAK = 'M876.273 500.988C904.427 497.778 932.768 506.786 955.235 523.713C949.48 529.254 944.417 533.62 938.29 538.755C923.817 529.858 914.292 526.66 897.594 524.151C873.104 522.25 856.67 525.977 835.728 538.872C829.3 533.622 824.598 529.559 818.648 523.799C835.706 509.913 854.812 503.743 876.273 500.988Z'
const S_PATH  = 'M438.532 347.689C466.232 344.584 505.581 349.465 529.745 363.724C526.819 371.238 523.812 378.72 520.726 386.17C496.565 374.864 477.723 371.516 451.744 371.626C432.898 371.705 393.747 376.892 396.627 402.78C402.181 452.685 495.21 415.624 524.433 449.977C534.051 461.284 538.333 468.556 538.756 483.329C539.162 529.497 497.926 539.067 461.429 539.876C427.58 540.636 402.505 536.592 371.777 522.545C373.856 516.241 378.482 506.016 381.147 499.586C412.813 514.903 447.612 518.555 482.304 513.625C491.624 512.3 502.467 509.271 508.621 501.656C512.967 496.375 515.004 489.567 514.274 482.767C510.834 450.619 453.621 458.064 430.541 454.825C403.388 451.014 375.226 442.167 372.154 409.224C368.205 366.885 402.263 351.712 438.532 347.689Z'
const P_PATH  = 'M591.69 349.883L652.183 349.793C668.404 349.779 692.625 348.653 707.674 352.793C716.991 355.371 725.488 360.304 732.346 367.117C755.626 390.443 754.804 434.159 731.747 457.175C715.658 473.236 694.163 475.061 672.712 474.606C662.112 474.381 651.277 474.567 640.664 474.525L640.719 449.79C671.678 449.581 715.744 458.654 724.352 419.908C728.319 387.605 709.827 372.875 679.311 373.975C674.024 374.166 668.029 373.994 662.683 374.01L615.998 374.194L615.955 536.93L591.707 536.764L591.69 349.883Z'
const R1_PATH = 'M1035.43 349.884L1101.63 349.779C1117.18 349.759 1131.76 348.914 1147.46 351.469C1191.83 358.684 1206.77 412.536 1180.62 445.935C1168.85 460.963 1152.77 464.378 1134.59 466.173C1153.69 487.785 1181.92 515.058 1202.56 536.176L1169.71 536.221L1089.56 454.24C1087.09 451.939 1084.2 449.709 1083.21 446.547C1083.28 446.008 1083.28 444.814 1083.5 444.371C1087.25 436.869 1140.71 450.713 1159.9 432.09C1166.14 426.039 1168.6 418.231 1168.74 409.707C1168.9 400.535 1166.81 391.482 1160.2 384.767C1155.36 379.849 1148.98 376.888 1142.31 375.376C1131.3 372.883 1118.95 373.958 1107.7 373.984L1059.72 374.152C1061.08 425.774 1059.83 483.997 1059.86 536.24L1035.47 536.222L1035.43 349.884Z'
const R2_PATH = 'M1246.62 349.875L1312.17 349.807C1327.81 349.78 1343.83 348.82 1359.46 351.591C1403.07 359.319 1417.7 413.269 1391.45 445.997C1379.72 460.624 1363.79 464.578 1345.74 466.108L1413.86 536.156L1381.03 536.212L1303.04 456.941C1299.59 453.51 1295.46 450.323 1293.88 445.95C1293.94 444.993 1293.79 442.698 1295.09 442.617C1309.01 442.651 1323.68 441.158 1337.61 442.158C1371.86 444.615 1391.78 417.024 1372.73 386.625C1363.59 372.027 1336.52 373.922 1319.43 373.972L1271.43 374.171C1270.79 427.888 1271.57 482.37 1271.27 536.215L1246.58 536.273L1246.62 349.875Z'

function SporrWordmark({ width = 72 }: { width?: number }) {
  const h = (width / 1046) * 200
  return (
    <svg viewBox="371 344 1046 200" width={width} height={h} aria-label="Sporr — go to dashboard" role="img">
      {[S_PATH, P_PATH, O_ARC, R1_PATH, R2_PATH].map((d, i) => <path key={i} fill={FOG} d={d} />)}
      <path fill={COPPER} d={O_BREAK} />
    </svg>
  )
}

// ── nav items ───────────────────────────────────────────────────────────────
type Item = { href: string; label: string; icon: (a: boolean) => React.ReactNode }
const NAV: Item[] = [
  { href: '/dashboard',           label: 'Overview',  icon: a => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/></svg> },
  { href: '/dashboard/calendar',  label: 'Calendar',  icon: a => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="3.5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><path d="M6 1.5v3M14 1.5v3M2.5 7.5h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/dashboard/sponsors',  label: 'Sponsors',  icon: a => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.39 7.26L18 8.18L14 12.08L14.95 17.66L10 15L5.05 17.66L6 12.08L2 8.18L7.61 7.26L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/></svg> },
  { href: '/dashboard/contracts', label: 'Contracts', icon: a => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/dashboard/audit',     label: 'Capture',   icon: a => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><circle cx="10" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M7 6l1.2-2h3.6L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { href: '/proof-pack',          label: 'Reports',   icon: a => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 10L10 3L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 8.5V17H15V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={a?'currentColor':'none'} fillOpacity={a?.1:0}/><path d="M8 17V12h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/dashboard/financial', label: 'Financial', icon: a => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 14l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { href: '/dashboard/club',      label: 'Profile',   icon: a => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill={a?'currentColor':'none'} fillOpacity={a?.15:0}/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
]

// mobile bottom bar: 4 direct + More
const BOTTOM = [NAV[0], NAV[1], NAV[4], NAV[2]] // Overview, Calendar, Capture, Sponsors
const MORE   = [NAV[3], NAV[5], NAV[6], NAV[7]] // Contracts, Reports, Financial, Profile

export default function DashboardNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const [org, setOrg] = useState<{ name: string; tier: string; logo_url: string | null; show_logo_on_dashboard: boolean | null; club_colour_primary: string | null } | null>(null)
  const [userName, setUserName] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
      const { data: u } = await supabase.from('users').select('org_id, full_name').eq('id', session.user.id).single()
      if (!u) return
      if (!cancelled) setUserName((metaName || u.full_name || '').split(' ')[0] || '')
      const { data: o } = await supabase.from('organisations')
        .select('name,tier,logo_url,show_logo_on_dashboard,club_colour_primary')
        .eq('id', u.org_id).single()
      if (o && !cancelled) setOrg(o as any)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const accent = org?.club_colour_primary || INK
  const crest  = (org?.show_logo_on_dashboard && org?.logo_url) ? org.logo_url : null
  const planLabel = PLAN_LABELS[org?.tier || ''] || 'Foundation'
  const isActive = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname === href || pathname.startsWith(href + '/')

  async function signOut() { await supabase.auth.signOut(); router.push('/') }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[220px] min-h-screen fixed left-0 top-0 bottom-0 z-40"
        style={{ background: SIDE, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/dashboard" className="px-6 py-5 block" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <SporrWordmark width={72} />
        </Link>
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
          {NAV.map(item => {
            const active = isActive(item.href)
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
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: FOG }}>{userName || 'Account'}</p>
              <p className="text-[11px]" style={{ color: SLATE }}>{planLabel}</p>
            </div>
            <button onClick={signOut} className="p-2 rounded-lg flex-shrink-0" style={{ color: SLATE }} aria-label="Sign out"
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = FOG)}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = SLATE)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar (wordmark → home · explicit Dashboard button) ── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3"
        style={{ background: SIDE, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/dashboard"><SporrWordmark width={56} /></Link>
        <Link href="/dashboard" className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.08)', color: FOG }}>← Dashboard</Link>
      </div>

      {/* ── Mobile bottom tab bar ───────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2"
        style={{ background: SIDE, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {BOTTOM.map(item => {
          const active = isActive(item.href)
          const isCapture = item.href === '/dashboard/audit'
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-3 py-1.5" style={{ color: active ? '#FFFFFF' : SLATE }}>
              {isCapture
                ? <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: active ? accent : 'rgba(255,255,255,0.08)' }}>{item.icon(active)}</div>
                : item.icon(active)}
              <span className="text-[10px] font-medium">{item.label === 'Overview' ? 'Home' : item.label}</span>
            </Link>
          )
        })}
        <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-1 px-3 py-1.5" style={{ color: SLATE }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="4" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="16" cy="10" r="1.5" fill="currentColor"/></svg>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* ── Mobile "More" sheet ─────────────────────────────────────────── */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(8,18,22,0.5)' }} onClick={() => setMoreOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full" style={{ background: SIDE, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <div className="px-5 py-4 space-y-0.5">
              {MORE.map(item => {
                const active = isActive(item.href)
                const txt = active ? textOnColour(accent) : FOG
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium"
                    style={{ color: txt, background: active ? accent : 'transparent' }}>
                    <span style={{ color: txt }}>{item.icon(active)}</span>{item.label}
                  </Link>
                )
              })}
              <button onClick={() => { setMoreOpen(false); signOut() }} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium w-full text-left" style={{ color: SLATE }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
