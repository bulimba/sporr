'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Palette ───────────────────────────────────────────────────────────────────
const CLUB_PALETTE: { key: string; label: string; hex: string }[] = [
  { key: 'red',           label: 'Red',           hex: '#E10600' },
  { key: 'scarlet',       label: 'Scarlet',        hex: '#FF2400' },
  { key: 'crimson',       label: 'Crimson',        hex: '#A50021' },
  { key: 'maroon',        label: 'Maroon',         hex: '#800000' },
  { key: 'burgundy',      label: 'Burgundy',       hex: '#6D071A' },
  { key: 'pink',          label: 'Pink',           hex: '#FFC0CB' },
  { key: 'magenta',       label: 'Magenta',        hex: '#FF00FF' },
  { key: 'coral',         label: 'Coral',          hex: '#FF7F50' },
  { key: 'navy',          label: 'Navy',           hex: '#000F3F' },
  { key: 'royal_blue',    label: 'Royal Blue',     hex: '#0052CC' },
  { key: 'cobalt',        label: 'Cobalt',         hex: '#0047AB' },
  { key: 'sky_blue',      label: 'Sky Blue',       hex: '#87CEEB' },
  { key: 'azure',         label: 'Azure',          hex: '#007FFF' },
  { key: 'marine_blue',   label: 'Marine Blue',    hex: '#013A63' },
  { key: 'teal',          label: 'Teal',           hex: '#008080' },
  { key: 'turquoise',     label: 'Turquoise',      hex: '#40E0D0' },
  { key: 'green',         label: 'Green',          hex: '#008000' },
  { key: 'forest_green',  label: 'Forest Green',   hex: '#014421' },
  { key: 'emerald',       label: 'Emerald',        hex: '#009B77' },
  { key: 'lime',          label: 'Lime',           hex: '#BFFF00' },
  { key: 'olive',         label: 'Olive',          hex: '#808000' },
  { key: 'mint',          label: 'Mint',           hex: '#98FF98' },
  { key: 'yellow',        label: 'Yellow',         hex: '#FFD300' },
  { key: 'amber',         label: 'Amber',          hex: '#FFBF00' },
  { key: 'gold',          label: 'Gold',           hex: '#D4AF37' },
  { key: 'mustard',       label: 'Mustard',        hex: '#FFDB58' },
  { key: 'orange',        label: 'Orange',         hex: '#FF7F00' },
  { key: 'tangerine',     label: 'Tangerine',      hex: '#FF9505' },
  { key: 'burnt_orange',  label: 'Burnt Orange',   hex: '#CC5500' },
  { key: 'purple',        label: 'Purple',         hex: '#6A0DAD' },
  { key: 'violet',        label: 'Violet',         hex: '#8F00FF' },
  { key: 'lavender',      label: 'Lavender',       hex: '#E6E6FA' },
  { key: 'plum',          label: 'Plum',           hex: '#8E4585' },
  { key: 'black',         label: 'Black',          hex: '#000000' },
  { key: 'charcoal',      label: 'Charcoal',       hex: '#333333' },
  { key: 'grey',          label: 'Grey',           hex: '#808080' },
  { key: 'silver',        label: 'Silver',         hex: '#C0C0C0' },
  { key: 'white',         label: 'White',          hex: '#FFFFFF' },
  { key: 'brown',         label: 'Brown',          hex: '#8B4513' },
  { key: 'tan',           label: 'Tan',            hex: '#D2B48C' },
  { key: 'beige',         label: 'Beige',          hex: '#F5F5DC' },
  { key: 'neon_green',    label: 'Neon Green',     hex: '#39FF14' },
  { key: 'neon_pink',     label: 'Neon Pink',      hex: '#FF10F0' },
  { key: 'electric_blue', label: 'Electric Blue',  hex: '#7DF9FF' },
  { key: 'fluoro_yellow', label: 'Fluoro Yellow',  hex: '#CCFF00' },
]

function textOnColour(hex: string): 'dark' | 'light' {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? 'dark' : 'light'
}

// ── Currency / number formatting (nb-NO) ───────────────────────────────────────
const eur = (n: number) =>
  new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n)
const nb1 = (n: number) =>
  new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(n)

// ── Plan tier system ──────────────────────────────────────────────────────────
// Tiers = operational complexity (number of environments)
// No gates on sponsors, contracts, users, captures, reports, deliverables

function normaliseTier(raw: string | null | undefined): string {
  const map: Record<string, string> = {
    free: 'foundation', club: 'organisation', pro: 'portfolio', agency: 'network',
  }
  return map[raw || ''] ?? raw ?? 'foundation'
}

const PLAN_META: Record<string, { label: string; description: string }> = {
  foundation:   { label: 'Foundation',   description: '1 operational environment · Individual or small initiative' },
  organisation: { label: 'Organisation', description: '1 operational environment · Governance features enabled' },
  portfolio:    { label: 'Portfolio',    description: 'Multiple environments · Roll-up reporting' },
  network:      { label: 'Network',      description: 'Multiple organisations · Ecosystem governance' },
}

const PLANS = [
  {
    tier: 'organisation',
    label: 'Organisation',
    price: '490 NOK / month',
    description: '1 operational environment · Governance, roles, and permissions · Unlimited sponsors, contracts, captures, and reports',
    selfServe: true,
    upgradableFrom: ['foundation'],
  },
  {
    tier: 'portfolio',
    label: 'Portfolio',
    price: '1 490 NOK / month',
    description: 'Multiple operational environments · Roll-up reporting across environments · Unlimited everything',
    selfServe: true,
    upgradableFrom: ['foundation', 'organisation'],
  },
  {
    tier: 'network',
    label: 'Network',
    price: 'Contact us',
    description: 'Multiple organisations and environments · Ecosystem governance, compliance, SSO · Custom storage and services',
    selfServe: false,
    upgradableFrom: ['foundation', 'organisation', 'portfolio'],
  },
]

// ── Storage system ──────────────────────────────────────────────────────────
// Storage is the ONLY metered resource. Never meter users, sponsors,
// contracts, captures, deliverables, or reports — participation is never billed.
// Base allowance is included with each tier; add-ons are a pure utility top-up.
const STORAGE_BASE_GB: Record<string, number | null> = {
  foundation:   5,
  organisation: 25,
  portfolio:    100,
  network:      null, // Custom — provisioned per agreement
}

const STORAGE_ADDONS = [
  { key: '100gb', addLabel: '100 GB', monthly: 10, blurb: 'For growing capture libraries' },
  { key: '500gb', addLabel: '500 GB', monthly: 35, blurb: 'For high-volume operations' },
  { key: '1tb',   addLabel: '1 TB',   monthly: 60, blurb: 'For large portfolios and archives' },
]

// ── Sports ────────────────────────────────────────────────────────────────────
const ALL_SPORTS = [
  'Football', 'Handball', 'Gymnastics', 'Golf', 'Cross country skiing',
  'Cycling', 'Swimming', 'Athletics', 'Ice hockey', 'Basketball', 'Volleyball',
  'Badminton', 'Biathlon', 'Boxing', 'Chess', 'Cricket', 'Curling', 'Dance',
  'Darts', 'Esports', 'Fencing', 'Field Hockey', 'Futsal', 'Gaelic Football',
  'Hurling', 'Kayaking', 'Kickboxing', 'Marathons', 'Martial arts', 'MMA',
  'Motorsport', 'Netball', 'Padel', 'Pickleball', 'Rowing', 'Rugby league',
  'Rugby Union', 'Running', 'Sailing / Regatta', 'Shooting', 'Skiing',
  'Ski jumping', 'Snowboarding', 'Tennis', 'Triathlon', 'Water polo', 'Other',
]

// ── Types ─────────────────────────────────────────────────────────────────────
type OrgData = {
  id: string; name: string; tier: string; sports: string[] | null
  country: string | null; sponsorship_contact_name: string | null
  sponsorship_contact_email: string | null; sponsorship_contact_phone: string | null
  governing_body_name: string | null; governing_body_website: string | null
  logo_url: string | null; show_logo_on_dashboard: boolean | null
  club_colour_primary: string | null; club_colour_secondary: string | null
}
type UserData = { id: string; full_name: string | null; email: string | null; role: string }

// A unified checkout item — used by both tier upgrades and storage add-ons,
// so they share one payment flow (Vipps / Stripe / Invoice).
type CheckoutItem = {
  kind: 'plan' | 'storage'
  label: string
  price: string
  description: string
  selfServe: boolean
}

// ── Style tokens ──────────────────────────────────────────────────────────────
const INK    = '#081216'
const FOG    = '#E7ECEF'
const SLATE  = '#6E7F86'
const BLUE   = '#147BFF'
const COPPER = '#B8734A'
const BG     = '#F5F2ED'
const WHITE  = '#FFFFFF'
const SIDE   = '#0A1A1F'
const BORDER = 'rgba(8,18,22,0.08)'
const CARD   = { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px' }

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

// ── SVG wordmark ──────────────────────────────────────────────────────────────
const O_ARC   = 'M873.735 347.639C898.493 344.775 922.792 349.648 943.469 363.849C964.779 378.522 979.408 401.039 984.155 426.472C989.607 456.155 982.16 481.366 965.308 505.675C957.877 501.095 950.861 497.807 943.039 494.028C951.244 484.183 956.989 472.528 959.799 460.024C963.871 441.089 960.3 421.313 949.863 404.998C938.576 387.638 922.504 377.041 902.392 372.759C901.94 372.676 901.487 372.599 901.033 372.528C880.508 369.277 859.101 373.103 842.11 385.427C826.478 396.918 816.067 414.162 813.178 433.347C809.468 457.588 816.492 475.116 830.476 494.232C822.176 497.845 815.897 501.472 808.117 505.943C798.035 490.808 791.722 477.724 789.052 459.404C785.108 433.179 791.888 406.471 807.864 385.303C824.374 363.356 846.814 351.416 873.735 347.639Z'
const O_BREAK = 'M876.273 500.988C904.427 497.778 932.768 506.786 955.235 523.713C949.48 529.254 944.417 533.62 938.29 538.755C923.817 529.858 914.292 526.66 897.594 524.151C873.104 522.25 856.67 525.977 835.728 538.872C829.3 533.622 824.598 529.559 818.648 523.799C835.706 509.913 854.812 503.743 876.273 500.988Z'
const S_PATH  = 'M438.532 347.689C466.232 344.584 505.581 349.465 529.745 363.724C526.819 371.238 523.812 378.72 520.726 386.17C496.565 374.864 477.723 371.516 451.744 371.626C432.898 371.705 393.747 376.892 396.627 402.78C402.181 452.685 495.21 415.624 524.433 449.977C534.051 461.284 538.333 468.556 538.756 483.329C539.162 529.497 497.926 539.067 461.429 539.876C427.58 540.636 402.505 536.592 371.777 522.545C373.856 516.241 378.482 506.016 381.147 499.586C412.813 514.903 447.612 518.555 482.304 513.625C491.624 512.3 502.467 509.271 508.621 501.656C512.967 496.375 515.004 489.567 514.274 482.767C510.834 450.619 453.621 458.064 430.541 454.825C403.388 451.014 375.226 442.167 372.154 409.224C368.205 366.885 402.263 351.712 438.532 347.689Z'
const P_PATH  = 'M591.69 349.883L652.183 349.793C668.404 349.779 692.625 348.653 707.674 352.793C716.991 355.371 725.488 360.304 732.346 367.117C755.626 390.443 754.804 434.159 731.747 457.175C715.658 473.236 694.163 475.061 672.712 474.606C662.112 474.381 651.277 474.567 640.664 474.525L640.719 449.79C671.678 449.581 715.744 458.654 724.352 419.908C728.319 387.605 709.827 372.875 679.311 373.975C674.024 374.166 668.029 373.994 662.683 374.01L615.998 374.194L615.955 536.93L591.707 536.764L591.69 349.883Z'
const R1_PATH = 'M1035.43 349.884L1101.63 349.779C1117.18 349.759 1131.76 348.914 1147.46 351.469C1191.83 358.684 1206.77 412.536 1180.62 445.935C1168.85 460.963 1152.77 464.378 1134.59 466.173C1153.69 487.785 1181.92 515.058 1202.56 536.176L1169.71 536.221L1089.56 454.24C1087.09 451.939 1084.2 449.709 1083.21 446.547C1083.28 446.008 1083.28 444.814 1083.5 444.371C1087.25 436.869 1140.71 450.713 1159.9 432.09C1166.14 426.039 1168.6 418.231 1168.74 409.707C1168.9 400.535 1166.81 391.482 1160.2 384.767C1155.36 379.849 1148.98 376.888 1142.31 375.376C1131.3 372.883 1118.95 373.958 1107.7 373.984L1059.72 374.152C1061.08 425.774 1059.83 483.997 1059.86 536.24L1035.47 536.222L1035.43 349.884Z'
const R2_PATH = 'M1246.62 349.875L1312.17 349.807C1327.81 349.78 1343.83 348.82 1359.46 351.591C1403.07 359.319 1417.7 413.269 1391.45 445.997C1379.72 460.624 1363.79 464.578 1345.74 466.108L1413.86 536.156L1381.03 536.212L1303.04 456.941C1299.59 453.51 1295.46 450.323 1293.88 445.95C1293.94 444.993 1293.79 442.698 1295.09 442.617C1309.01 442.651 1323.68 441.158 1337.61 442.158C1371.86 444.615 1391.78 417.024 1372.73 386.625C1363.59 372.027 1336.52 373.922 1319.43 373.972L1271.43 374.171C1270.79 427.888 1271.57 482.37 1271.27 536.215L1246.58 536.273L1246.62 349.875Z'

function SporrWordmark({ color = '#E7ECEF', breakColor = '#B8734A', width = 72 }: { color?: string; breakColor?: string; width?: number }) {
  const h = (width / 1046) * 200
  return (
    <svg viewBox="371 344 1046 200" width={width} height={h} aria-label="Sporr" role="img">
      {[S_PATH, P_PATH, O_ARC, R1_PATH, R2_PATH].map((d, i) => <path key={i} fill={color} d={d} />)}
      <path fill={breakColor} d={O_BREAK} />
    </svg>
  )
}

// ── Colour swatch ─────────────────────────────────────────────────────────────
function ColourSwatch({ colour, selected, disabled, onClick }: {
  colour: { key: string; label: string; hex: string }
  selected: boolean; disabled: boolean; onClick: () => void
}) {
  const isLight = textOnColour(colour.hex) === 'dark'
  return (
    <button type="button" title={colour.label} onClick={onClick} disabled={disabled}
      className={`relative w-8 h-8 rounded-lg transition-all flex-shrink-0 ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'} ${selected ? 'scale-110' : ''}`}
      style={{
        backgroundColor: colour.hex,
        border: colour.hex === '#FFFFFF' || colour.hex === '#F5F5DC' || colour.hex === '#E6E6FA' ? `1px solid ${BORDER}` : 'none',
        outline: selected ? `2px solid ${INK}` : 'none',
        outlineOffset: 2,
      }}>
      {selected && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7l3.5 3.5 5.5-6" stroke={isLight ? '#000000' : '#ffffff'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </button>
  )
}

// ── Colour preview ────────────────────────────────────────────────────────────
function ColourPreview({ primary, secondary, name }: { primary: string | null; secondary: string | null; name: string }) {
  const p = primary || INK
  const s = secondary || BG
  const pText = textOnColour(p) === 'dark' ? '#000000' : '#ffffff'
  const sText = textOnColour(s) === 'dark' ? '#000000' : '#ffffff'
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: p }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: s, color: sText }}>
          {name.charAt(0).toUpperCase() || 'O'}
        </div>
        <span className="text-sm font-medium" style={{ color: pText }}>{name || 'Your organisation'}</span>
        <span className="ml-auto text-[10px] font-medium uppercase tracking-widest opacity-70" style={{ color: pText }}>2025/26</span>
      </div>
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: s }}>
        <div className="h-1.5 flex-1 rounded-full opacity-30" style={{ backgroundColor: sText }} />
        <div className="h-5 w-16 rounded-md text-[9px] font-semibold flex items-center justify-center uppercase tracking-wider"
          style={{ backgroundColor: p, color: pText }}>Report</div>
      </div>
    </div>
  )
}

// ── Saved indicator ───────────────────────────────────────────────────────────
function SavedPill() {
  return (
    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#16A34A' }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Saved
    </span>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, clubPrimary }: { value: boolean; onChange: () => void; clubPrimary: string }) {
  return (
    <div onClick={onChange}
      className="relative w-10 h-6 rounded-full cursor-pointer flex-shrink-0 transition-colors"
      style={{ backgroundColor: value ? clubPrimary : BORDER }}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router    = useRouter()
  const pathname  = usePathname()
  const supabase  = createClient()
  const sportRef  = useRef<HTMLInputElement>(null)
  const logoRef   = useRef<HTMLInputElement>(null)

  const [org, setOrg]           = useState<OrgData | null>(null)
  const [user, setUser]         = useState<UserData | null>(null)
  const [orgId, setOrgId]       = useState<string | null>(null)
  const [planTier, setPlanTier] = useState('foundation')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [photoCount, setPhotoCount] = useState(0)

  // Sports
  const [sportSearch, setSportSearch]     = useState('')
  const [showSportDrop, setShowSportDrop] = useState(false)
  const [otherSport, setOtherSport]       = useState('')
  const [showOtherInput, setShowOtherInput] = useState(false)

  // Crest
  const [logoUrl, setLogoUrl]                   = useState<string | null>(null)
  const [showLogoOnDash, setShowLogoOnDash]     = useState(false)
  const [uploadingLogo, setUploadingLogo]       = useState(false)
  const [logoError, setLogoError]               = useState<string | null>(null)
  const [crestSaved, setCrestSaved]             = useState(false)

  // Colours
  const [colourPrimary, setColourPrimary]       = useState<string | null>(null)
  const [colourSecondary, setColourSecondary]   = useState<string | null>(null)
  const [colourPickerTarget, setColourPickerTarget] = useState<'primary' | 'secondary' | null>(null)
  const [coloursSaved, setColoursSaved]         = useState(false)

  // Checkout modal — shared by tier upgrades and storage add-ons
  const [checkout, setCheckout]     = useState<CheckoutItem | null>(null)
  const [payMethod, setPayMethod]   = useState<'vipps' | 'stripe' | 'invoice' | null>(null)

  const [form, setForm] = useState({
    name: '', sports: [] as string[], country: 'NO',
    sponsorship_contact_name: '', sponsorship_contact_email: '', sponsorship_contact_phone: '',
    governing_body_name: '', governing_body_website: '',
  })
  const upd = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const toggleSport = (sport: string) => {
    if (sport === 'Other') { setShowOtherInput(true); setShowSportDrop(false); setSportSearch(''); return }
    setForm(prev => {
      const c = prev.sports
      if (c.includes(sport)) return { ...prev, sports: c.filter(s => s !== sport) }
      if (c.length >= 4) return prev
      return { ...prev, sports: [...c, sport] }
    })
  }
  const addOtherSport = () => {
    const t = otherSport.trim()
    if (!t) return
    setForm(prev => prev.sports.includes(t) || prev.sports.length >= 4 ? prev : { ...prev, sports: [...prev.sports, t] })
    setOtherSport(''); setShowOtherInput(false)
  }
  const removeSport = (sport: string) => setForm(prev => ({ ...prev, sports: prev.sports.filter(s => s !== sport) }))
  const filteredSports = ALL_SPORTS.filter(s => s.toLowerCase().includes(sportSearch.toLowerCase()) && !form.sports.includes(s))

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const { data: userData } = await supabase.from('users').select('id,org_id,full_name,email,role').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      setUser(userData as UserData)
      setOrgId(userData.org_id)
      const [orgRes, photosRes] = await Promise.all([
        supabase.from('organisations').select('id,name,tier,sports,country,sponsorship_contact_name,sponsorship_contact_email,sponsorship_contact_phone,governing_body_name,governing_body_website,logo_url,show_logo_on_dashboard,club_colour_primary,club_colour_secondary').eq('id', userData.org_id).single(),
        supabase.from('proofs').select('id', { count: 'exact' }).eq('org_id', userData.org_id).not('photo_url', 'is', null),
      ])
      if (orgRes.data) {
        const o = orgRes.data as OrgData
        setOrg(o)
        setPlanTier(normaliseTier(o.tier))
        setLogoUrl(o.logo_url)
        setShowLogoOnDash(o.show_logo_on_dashboard || false)
        setColourPrimary(o.club_colour_primary || null)
        setColourSecondary(o.club_colour_secondary || null)
        setForm({ name: o.name || '', sports: o.sports || [], country: o.country || 'NO', sponsorship_contact_name: o.sponsorship_contact_name || '', sponsorship_contact_email: o.sponsorship_contact_email || '', sponsorship_contact_phone: o.sponsorship_contact_phone || '', governing_body_name: o.governing_body_name || '', governing_body_website: o.governing_body_website || '' })
      }
      setPhotoCount(photosRes.count || 0)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!orgId) return
    setSaving(true); setError(null); setSaved(false)
    const { error: e } = await supabase.from('organisations').update({ name: form.name, sports: form.sports, country: form.country, sponsorship_contact_name: form.sponsorship_contact_name || null, sponsorship_contact_email: form.sponsorship_contact_email || null, sponsorship_contact_phone: form.sponsorship_contact_phone || null, governing_body_name: form.governing_body_name || null, governing_body_website: form.governing_body_website || null, club_colour_primary: colourPrimary || null, club_colour_secondary: colourSecondary || null }).eq('id', orgId)
    if (e) { setError(e.message); setSaving(false); return }
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  async function saveColoursNow(p: string | null, s: string | null) {
    if (!orgId) return
    await supabase.from('organisations').update({ club_colour_primary: p || null, club_colour_secondary: s || null }).eq('id', orgId)
    setColoursSaved(true); setTimeout(() => setColoursSaved(false), 2500)
  }

  function selectPrimary(hex: string) { const n = colourPrimary === hex ? null : hex; setColourPrimary(n); saveColoursNow(n, colourSecondary) }
  function selectSecondary(hex: string) { const n = colourSecondary === hex ? null : hex; setColourSecondary(n); saveColoursNow(colourPrimary, n) }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !orgId) return
    setLogoError(null)
    if (!['image/png','image/jpeg','image/jpg','image/svg+xml','image/webp'].includes(file.type)) { setLogoError('Please upload a PNG, JPG, SVG or WebP file.'); return }
    if (file.size > 2 * 1024 * 1024) { setLogoError('File too large — maximum 2MB.'); return }
    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const path = `club-logos/${orgId}.${ext}`
    const { error: uploadError } = await supabase.storage.from('club-assets').upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) { setLogoError(uploadError.message); setUploadingLogo(false); return }
    const { data: urlData } = supabase.storage.from('club-assets').getPublicUrl(path)
    setLogoUrl(urlData.publicUrl)
    await supabase.from('organisations').update({ logo_url: urlData.publicUrl }).eq('id', orgId)
    setUploadingLogo(false); setCrestSaved(true); setTimeout(() => setCrestSaved(false), 2500)
  }

  async function handleToggleLogo() {
    if (!orgId) return
    const n = !showLogoOnDash; setShowLogoOnDash(n)
    await supabase.from('organisations').update({ show_logo_on_dashboard: n }).eq('id', orgId)
    setCrestSaved(true); setTimeout(() => setCrestSaved(false), 2500)
  }

  async function handleRemoveLogo() {
    if (!orgId) return
    setLogoUrl(null); setShowLogoOnDash(false)
    await supabase.from('organisations').update({ logo_url: null, show_logo_on_dashboard: false }).eq('id', orgId)
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/') }

  const clubPrimary    = colourPrimary || INK
  const availablePlans = PLANS.filter(p => p.upgradableFrom.includes(planTier))
  const planLabel      = PLAN_META[planTier]?.label || 'Foundation'
  const estimatedMB    = photoCount

  // Storage — base allowance per tier (null = custom / Network)
  const baseGb   = STORAGE_BASE_GB[planTier] ?? null
  const capMb    = baseGb !== null ? baseGb * 1024 : null
  const usedPct  = capMb ? Math.min((estimatedMB / capMb) * 100, 100) : 0
  const usedLabel = estimatedMB >= 1024 ? `${nb1(estimatedMB / 1024)} GB` : `${estimatedMB} MB`
  const nearLimit = usedPct > 85

  // Build the mailto for the current checkout item
  const checkoutMailto = (method?: string) => {
    if (!checkout) return ''
    const subject = checkout.kind === 'storage'
      ? `Storage add-on — ${checkout.label}${method ? ` — ${method}` : ''}`
      : `Upgrade ${method ? `to ${checkout.label} — ${method}` : `enquiry — ${checkout.label}`}`
    return `mailto:hello@sporr.no?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Organisation: ${form.name}\nContact: ${user?.email || ''}\nItem: ${checkout.label} (${checkout.price})`)}`
  }

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="hidden lg:flex flex-col w-[220px] min-h-screen fixed left-0 top-0 bottom-0 z-40"
      style={{ background: SIDE, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SporrWordmark color={FOG} breakColor="#B8734A" width={72} />
      </div>
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ background: clubPrimary + '22', border: `1.5px solid ${clubPrimary}55` }}>
            {logoUrl
              ? <img src={logoUrl} alt="" className="w-full h-full object-contain p-0.5" />
              : <span className="text-xs font-bold" style={{ color: FOG }}>{form.name.charAt(0) || 'O'}</span>}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: FOG }}>{form.name || 'Your organisation'}</p>
            <p className="text-xs" style={{ color: SLATE }}>{planLabel}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium"
              style={{ color: active ? '#FFFFFF' : SLATE, background: active ? clubPrimary : 'transparent' }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
              <span style={{ color: active ? '#FFFFFF' : SLATE }}>{item.icon(active)}</span>
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div style={{ color: SLATE, fontSize: 13 }}>Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Sidebar />

      {/* ── Checkout modal (tier upgrades + storage add-ons) ──────────────── */}
      {checkout && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: 'rgba(8,18,22,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-8 w-full max-w-md" style={{ background: WHITE }}>

            {!payMethod ? (
              <>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: SLATE }}>
                  {checkout.kind === 'storage' ? 'Add storage' : 'Upgrade to'}
                </p>
                <h2 className="text-xl font-bold mb-1" style={{ color: INK }}>{checkout.label}</h2>
                <p className="font-semibold text-lg mb-2" style={{ color: INK }}>{checkout.price}</p>
                <p className="text-sm leading-relaxed mb-6" style={{ color: SLATE }}>{checkout.description}</p>

                {checkout.selfServe ? (
                  <>
                    <p className="text-sm font-semibold mb-3" style={{ color: INK }}>Choose payment method</p>
                    <div className="space-y-2 mb-5">
                      {([
                        { key: 'vipps',   label: 'Vipps',           sub: 'Recommended for Norway' },
                        { key: 'stripe',  label: 'Card — Stripe',   sub: 'Visa, Mastercard, Amex' },
                        { key: 'invoice', label: 'Invoice',          sub: '30-day payment terms' },
                      ] as const).map(m => (
                        <button key={m.key} onClick={() => setPayMethod(m.key)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                          style={{ border: `2px solid ${BORDER}`, background: WHITE }}
                          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = INK)}
                          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = BORDER)}>
                          <span className="text-sm font-semibold" style={{ color: INK }}>{m.label}</span>
                          <span className="text-xs" style={{ color: SLATE }}>{m.sub}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <a href={checkoutMailto()}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold mb-3"
                    style={{ background: INK, color: FOG }}>
                    Contact Sporr to discuss →
                  </a>
                )}

                <button onClick={() => { setCheckout(null); setPayMethod(null) }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: SLATE }}>
                  {payMethod === 'vipps' ? 'Pay with Vipps' : payMethod === 'stripe' ? 'Pay by card — Stripe' : 'Pay by invoice'}
                </p>
                <h2 className="text-xl font-bold mb-4" style={{ color: INK }}>{checkout.label} — {checkout.price}</h2>

                <div className="rounded-xl px-5 py-6 text-center mb-5" style={{ background: BG }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: '#F0F9FF', border: '1px solid #BFDBFE' }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="7" stroke="#3B82F6" strokeWidth="1.3"/>
                      <path d="M9 6v4M9 12v1" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: INK }}>Coming soon</p>
                  <p className="text-xs leading-relaxed" style={{ color: SLATE }}>
                    {payMethod === 'vipps' && 'Vipps integration is being set up. Contact us to set this up by invoice in the meantime.'}
                    {payMethod === 'stripe' && 'Stripe card payments are being set up. Contact us to set this up by invoice in the meantime.'}
                    {payMethod === 'invoice' && 'Invoice payments are being set up. Contact us directly and we\'ll invoice you within 24 hours.'}
                  </p>
                </div>

                <a href={checkoutMailto(payMethod)}
                  className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold mb-3"
                  style={{ background: INK, color: FOG }}>
                  Contact us to complete {checkout.kind === 'storage' ? 'this add-on' : 'upgrade'} →
                </a>
                <button onClick={() => setPayMethod(null)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>← Back</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3"
        style={{ background: SIDE, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SporrWordmark color={FOG} breakColor="#B8734A" width={56} />
        <Link href="/dashboard" className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.08)', color: FOG }}>← Dashboard</Link>
      </div>

      <main className="lg:pl-[220px] pb-16">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px' }}>

          {/* Page header */}
          <div className="mb-8">
            <h1 className="font-bold tracking-tight mb-1" style={{ fontSize: 26, color: INK, letterSpacing: '-0.02em' }}>Profile</h1>
            <p style={{ fontSize: 14, color: SLATE }}>Organisation identity, branding, and account settings</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0"><path d="M8 2v7M8 11v2" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <p style={{ fontSize: 13, color: '#92400E' }}>{error}</p>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5" style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p style={{ fontSize: 13, color: '#166534' }}>Changes saved</p>
            </div>
          )}

          {/* ── Organisation profile ─────────────────────────────────────── */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <p style={sectionHead}>Organisation profile</p>
            <div className="space-y-4">
              <div>
                <label style={lblStyle}>Organisation name</label>
                <input style={inpStyle} value={form.name} onChange={e => upd('name', e.target.value)} />
              </div>
              <div>
                <label style={lblStyle}>Sports represented <span style={{ color: SLATE, fontWeight: 400 }}>(up to 4)</span></label>
                {form.sports.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.sports.map(sport => (
                      <span key={sport} className="flex items-center gap-1 text-sm px-3 py-1 rounded-full"
                        style={{ background: INK, color: FOG }}>
                        {sport}
                        <button onClick={() => removeSport(sport)} style={{ color: '#6E7F86', marginLeft: 2 }}
                          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = FOG)}
                          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#6E7F86')}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                {form.sports.length < 4 && !showOtherInput && (
                  <div className="relative">
                    <input ref={sportRef} style={inpStyle} placeholder="Type to search sports..."
                      value={sportSearch}
                      onChange={e => { setSportSearch(e.target.value); setShowSportDrop(true) }}
                      onFocus={() => setShowSportDrop(true)}
                      onBlur={() => setTimeout(() => setShowSportDrop(false), 150)} />
                    {showSportDrop && filteredSports.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto"
                        style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
                        {filteredSports.map(sport => (
                          <button key={sport}
                            className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                            style={{ color: sport === 'Other' ? SLATE : INK, fontStyle: sport === 'Other' ? 'italic' : 'normal', borderTop: sport === 'Other' ? `1px solid ${BORDER}` : 'none' }}
                            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = BG)}
                            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                            onMouseDown={() => { toggleSport(sport); setSportSearch('') }}>
                            {sport === 'Other' ? '+ Add a sport not listed here' : sport}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {showOtherInput && (
                  <div className="flex gap-2 mt-1">
                    <input style={{ ...inpStyle, flex: 1 }} placeholder="Type the sport name..."
                      value={otherSport} onChange={e => setOtherSport(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addOtherSport() }} autoFocus />
                    <button onClick={addOtherSport} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: INK, color: FOG }}>Add</button>
                    <button onClick={() => { setShowOtherInput(false); setOtherSport('') }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>Cancel</button>
                  </div>
                )}
              </div>
              <div>
                <label style={lblStyle}>Country</label>
                <select style={inpStyle} value={form.country} onChange={e => upd('country', e.target.value)}>
                  <option value="NO">Norway</option>
                  <option value="SE">Sweden</option>
                  <option value="DK">Denmark</option>
                  <option value="FI">Finland</option>
                  <option value="IE">Ireland</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="NZ">New Zealand</option>
                  <option value="DE">Germany</option>
                  <option value="NL">Netherlands</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Club crest ───────────────────────────────────────────────── */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div className="flex items-center justify-between mb-2">
              <p style={sectionHead}>Organisation crest</p>
              {crestSaved && <SavedPill />}
            </div>
            <p className="text-sm mb-5" style={{ color: SLATE }}>
              Your crest appears on the platform dashboard and all sponsor reports. PNG, JPG, SVG or WebP — max 2MB.
            </p>
            {logoError && (
              <div className="px-4 py-3 rounded-xl mb-4 text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>{logoError}</div>
            )}
            {logoUrl ? (
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center p-2"
                  style={{ background: BG, border: `1px solid ${BORDER}` }}>
                  <img src={logoUrl} alt="Crest" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-1" style={{ color: INK }}>Crest uploaded</p>
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <Toggle value={showLogoOnDash} onChange={handleToggleLogo} clubPrimary={clubPrimary} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: INK }}>Show on dashboard</p>
                      <p className="text-xs" style={{ color: SLATE }}>Replaces sport kit illustration</p>
                    </div>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                      className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                      style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>
                      {uploadingLogo ? 'Uploading...' : 'Replace'}
                    </button>
                    <button onClick={handleRemoveLogo} className="px-4 py-2 text-sm" style={{ color: SLATE }}
                      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#DC2626')}
                      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = SLATE)}>Remove</button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                className="w-full rounded-xl px-6 py-8 text-center transition-colors"
                style={{ border: `2px dashed ${BORDER}`, background: 'transparent' }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = INK)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = BORDER)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3" style={{ color: SLATE }}>
                  <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 16.5V18.75C3 19.993 4.007 21 5.25 21H18.75C19.993 21 21 19.993 21 18.75V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="text-sm font-medium mb-1" style={{ color: INK }}>{uploadingLogo ? 'Uploading...' : 'Upload your crest'}</p>
                <p className="text-xs" style={{ color: SLATE }}>PNG, JPG, SVG or WebP · max 2MB</p>
              </button>
            )}
            <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoUpload} />
          </div>

          {/* ── Club colours ─────────────────────────────────────────────── */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div className="flex items-center justify-between mb-2">
              <p style={sectionHead}>Brand colours</p>
              {coloursSaved && <SavedPill />}
            </div>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: SLATE }}>
              Choose your primary and secondary colours. Applied across the platform and all sponsor reports.
            </p>

            {(colourPrimary || colourSecondary) && (
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-widest font-medium mb-2" style={{ color: SLATE }}>Preview</p>
                <ColourPreview primary={colourPrimary} secondary={colourSecondary} name={form.name} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
              {/* Primary */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: INK }}>Primary</p>
                    <p className="text-xs" style={{ color: SLATE }}>Headers, buttons, report cover</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {colourPrimary && <div className="w-5 h-5 rounded" style={{ backgroundColor: colourPrimary, border: `1px solid ${BORDER}` }} />}
                    <button type="button" className="text-xs font-medium underline underline-offset-2" style={{ color: INK }}
                      onClick={() => setColourPickerTarget(colourPickerTarget === 'primary' ? null : 'primary')}>
                      {colourPickerTarget === 'primary' ? 'Close' : colourPrimary ? 'Change' : 'Choose'}
                    </button>
                    {colourPrimary && (
                      <button type="button" className="text-xs" style={{ color: SLATE }}
                        onClick={() => { setColourPrimary(null); saveColoursNow(null, colourSecondary) }}>Clear</button>
                    )}
                  </div>
                </div>
                {colourPickerTarget === 'primary' && (
                  <div className="rounded-xl p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                    <div className="flex flex-wrap gap-2">
                      {CLUB_PALETTE.map(c => (
                        <ColourSwatch key={c.key} colour={c} selected={colourPrimary === c.hex} disabled={colourSecondary === c.hex}
                          onClick={() => { selectPrimary(c.hex); setColourPickerTarget(null) }} />
                      ))}
                    </div>
                    <p className="text-[10px] mt-3" style={{ color: SLATE }}>Greyed-out colours are selected as secondary</p>
                  </div>
                )}
              </div>

              {/* Secondary */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: INK }}>Secondary</p>
                    <p className="text-xs" style={{ color: SLATE }}>Accents, backgrounds, report body</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {colourSecondary && <div className="w-5 h-5 rounded" style={{ backgroundColor: colourSecondary, border: `1px solid ${BORDER}` }} />}
                    <button type="button" className="text-xs font-medium underline underline-offset-2" style={{ color: INK }}
                      onClick={() => setColourPickerTarget(colourPickerTarget === 'secondary' ? null : 'secondary')}>
                      {colourPickerTarget === 'secondary' ? 'Close' : colourSecondary ? 'Change' : 'Choose'}
                    </button>
                    {colourSecondary && (
                      <button type="button" className="text-xs" style={{ color: SLATE }}
                        onClick={() => { setColourSecondary(null); saveColoursNow(colourPrimary, null) }}>Clear</button>
                    )}
                  </div>
                </div>
                {colourPickerTarget === 'secondary' && (
                  <div className="rounded-xl p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                    <div className="flex flex-wrap gap-2">
                      {CLUB_PALETTE.map(c => (
                        <ColourSwatch key={c.key} colour={c} selected={colourSecondary === c.hex} disabled={colourPrimary === c.hex}
                          onClick={() => { selectSecondary(c.hex); setColourPickerTarget(null) }} />
                      ))}
                    </div>
                    <p className="text-[10px] mt-3" style={{ color: SLATE }}>Greyed-out colours are selected as primary</p>
                  </div>
                )}
              </div>
            </div>

            {/* Colour summary */}
            {(colourPrimary || colourSecondary) ? (
              <div className="flex items-center gap-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                {colourPrimary && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: colourPrimary, border: `1px solid ${BORDER}` }} />
                    <span className="text-xs" style={{ color: SLATE }}>
                      {CLUB_PALETTE.find(c => c.hex === colourPrimary)?.label || colourPrimary}
                      <span className="font-mono ml-1 opacity-60">{colourPrimary}</span>
                    </span>
                  </div>
                )}
                {colourPrimary && colourSecondary && <span style={{ color: BORDER }}>·</span>}
                {colourSecondary && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: colourSecondary, border: `1px solid ${BORDER}` }} />
                    <span className="text-xs" style={{ color: SLATE }}>
                      {CLUB_PALETTE.find(c => c.hex === colourSecondary)?.label || colourSecondary}
                      <span className="font-mono ml-1 opacity-60">{colourSecondary}</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs pt-3" style={{ color: SLATE, borderTop: `1px solid ${BORDER}` }}>
                No colours selected — reports will use Sporr default styling.
              </p>
            )}
          </div>

          {/* ── Sponsorship contact ──────────────────────────────────────── */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <p style={sectionHead}>Sponsorship contact</p>
            <p className="text-sm mb-5" style={{ color: SLATE }}>
              The person who handles sponsor relationships. Appears on all reports sent to sponsors.
            </p>
            <div className="space-y-4">
              <div>
                <label style={lblStyle}>Full name</label>
                <input style={inpStyle} placeholder="President, GM, or sponsorship manager"
                  value={form.sponsorship_contact_name} onChange={e => upd('sponsorship_contact_name', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={lblStyle}>Email</label>
                  <input type="email" style={inpStyle} placeholder="sponsorship@yourorg.no"
                    value={form.sponsorship_contact_email} onChange={e => upd('sponsorship_contact_email', e.target.value)} />
                </div>
                <div>
                  <label style={lblStyle}>Phone</label>
                  <input style={inpStyle} placeholder="+47..."
                    value={form.sponsorship_contact_phone} onChange={e => upd('sponsorship_contact_phone', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Governing body ───────────────────────────────────────────── */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <p style={sectionHead}>Governing body</p>
            <p className="text-sm mb-5" style={{ color: SLATE }}>
              If your organisation is affiliated with a federation or governing body.
            </p>
            <div className="space-y-4">
              <div>
                <label style={lblStyle}>Governing body name</label>
                <input style={inpStyle} placeholder="e.g. Norges Fotballforbund"
                  value={form.governing_body_name} onChange={e => upd('governing_body_name', e.target.value)} />
              </div>
              <div>
                <label style={lblStyle}>Website (optional)</label>
                <input style={inpStyle} placeholder="https://..."
                  value={form.governing_body_website} onChange={e => upd('governing_body_website', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold mb-8 disabled:opacity-40"
            style={{ background: INK, color: FOG }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>

          {/* ── Account ──────────────────────────────────────────────────── */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <p style={sectionHead}>Your account</p>
            <div className="space-y-0">
              {([
                ['Name',         user?.full_name || '—'],
                ['Email',        user?.email     || '—'],
                ['Role',         user?.role      || '—'],
                ['Plan',         planLabel],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-3"
                  style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span className="text-sm" style={{ color: SLATE }}>{label}</span>
                  <span className="text-sm font-medium capitalize" style={{ color: INK }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Storage ──────────────────────────────────────────────────── */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <p style={sectionHead}>Storage</p>

            {baseGb === null ? (
              /* Network — custom allocation */
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: INK }}>Custom storage</span>
                  <span className="text-xs" style={{ color: SLATE }}>{photoCount} proof photo{photoCount !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: SLATE }}>
                  Network plans include custom storage provisioned to your agreement. Contact us to review or adjust your allocation.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: INK }}>{usedLabel} of {baseGb} GB</span>
                  <span className="text-xs" style={{ color: SLATE }}>{photoCount} proof photo{photoCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: BORDER }}>
                  <div className="h-full rounded-full" style={{ width: `${usedPct}%`, background: nearLimit ? COPPER : SLATE }} />
                </div>
                <p className="text-xs leading-relaxed mb-6" style={{ color: SLATE }}>
                  {baseGb} GB is included on the {planLabel} plan. Storage is the only metered resource — users, sponsors,
                  contracts, captures, deliverables, and reports are always unlimited.
                </p>

                {/* Add-ons */}
                <p className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: SLATE }}>Add more storage</p>
                <div className="space-y-2">
                  {STORAGE_ADDONS.map(a => (
                    <div key={a.key} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
                      style={{ border: `1px solid ${BORDER}` }}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold" style={{ color: INK }}>+{a.addLabel} storage</p>
                          <span className="text-xs font-medium" style={{ color: SLATE }}>— {eur(a.monthly)} / month</span>
                        </div>
                        <p className="text-xs" style={{ color: SLATE }}>{a.blurb}</p>
                      </div>
                      <button
                        onClick={() => {
                          setCheckout({
                            kind: 'storage',
                            label: `+${a.addLabel} storage`,
                            price: `${eur(a.monthly)} / month`,
                            description: `Adds ${a.addLabel} of storage on top of your ${planLabel} plan. Billed monthly. Cancel anytime.`,
                            selfServe: true,
                          })
                          setPayMethod(null)
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
                        style={{ background: INK, color: FOG }}
                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0F2A2E')}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = INK)}>
                        Add →
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-xs mt-4 pt-4" style={{ color: SLATE, borderTop: `1px solid ${BORDER}` }}>
                  Storage is measured by photo uploads. Add-ons stack on top of your included allowance — need more than 1 TB?
                  {' '}
                  <a href={`mailto:hello@sporr.no?subject=${encodeURIComponent('Storage enquiry')}&body=${encodeURIComponent(`Organisation: ${form.name}\nContact: ${user?.email || ''}`)}`}
                    className="font-medium underline underline-offset-2" style={{ color: INK }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = BLUE)}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = INK)}>
                    Contact us
                  </a>.
                </p>
              </>
            )}
          </div>

          {/* ── Upgrade plan ─────────────────────────────────────────────── */}
          {availablePlans.length > 0 && (
            <div style={{ ...CARD, marginBottom: 16 }}>
              <p style={sectionHead}>Upgrade plan</p>
              <p className="text-sm mb-5" style={{ color: SLATE }}>
                You&apos;re on the <strong style={{ color: INK }}>{planLabel}</strong> plan.
                Upgrade when your operational structure grows.
              </p>

              <div className="space-y-3">
                {availablePlans.map(plan => (
                  <div key={plan.tier} className="flex items-start justify-between gap-4 px-4 py-4 rounded-xl"
                    style={{ border: `1px solid ${BORDER}` }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold" style={{ color: INK }}>{plan.label}</p>
                        <span className="text-xs font-medium" style={{ color: SLATE }}>— {plan.price}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: SLATE }}>{plan.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        setCheckout({ kind: 'plan', label: plan.label, price: plan.price, description: plan.description, selfServe: plan.selfServe })
                        setPayMethod(null)
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
                      style={{ background: INK, color: FOG }}
                      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0F2A2E')}
                      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = INK)}>
                      Upgrade →
                    </button>
                  </div>
                ))}

                {/* Network / Enterprise */}
                <div className="px-4 py-4 rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: INK }}>Network, Federation &amp; Enterprise</p>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: SLATE }}>
                    Multiple organisations · Ecosystem governance · SSO · Custom storage and services
                  </p>
                  <a href={`mailto:hello@sporr.no?subject=Enterprise enquiry&body=Organisation: ${form.name}%0AContact: ${user?.email || ''}`}
                    className="text-sm font-medium underline underline-offset-2" style={{ color: INK }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = BLUE)}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = INK)}>
                    Contact Sporr to discuss →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── Account actions ───────────────────────────────────────────── */}
          <div style={CARD}>
            <p style={sectionHead}>Account actions</p>
            <div className="space-y-0">
              <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: INK }}>Sign out</p>
                  <p className="text-xs mt-0.5" style={{ color: SLATE }}>Sign out of Sporr on this device</p>
                </div>
                <button onClick={handleSignOut} className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'rgba(8,18,22,0.06)', color: INK }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(8,18,22,0.1)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(8,18,22,0.06)')}>
                  Sign out
                </button>
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-semibold" style={{ color: INK }}>Request data deletion</p>
                  <p className="text-xs mt-0.5" style={{ color: SLATE }}>To delete your account and all data, contact us</p>
                </div>
                <a href="mailto:privacy@sporr.no" className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'rgba(8,18,22,0.06)', color: INK }}>
                  Contact us
                </a>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
