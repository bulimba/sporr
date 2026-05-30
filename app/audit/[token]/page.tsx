'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/*
 ─────────────────────────────────────────────────────────────────────────────
 FIELD MODE — public, token-only capture surface.

 This page is the CONSUMER. It defines the contract the backend must satisfy.
 None of these RPCs exist yet — they are net-new and must be built before this
 page is deployed (see DEPLOY WARNING in the chat summary).

 The anon client has NO direct insert/select on `proofs` or `obligations`.
 Everything the volunteer does routes through a SECURITY DEFINER function that
 re-checks the token, PIN, active status, TTL, and cap server-side.

 REQUIRED SERVER FUNCTIONS (supabase.rpc):

 1. get_capture_session_public(p_token text)
    → { found, status: 'active'|'closed',          // closed = completed OR past expires_at
        event: { title, venue } | null,
        org:   { name, logo_url, club_colour_primary, club_colour_secondary } | null }
    Non-sensitive only. No deliverables, no sponsors.

 2. open_capture_session(p_token text, p_pin text)
    → ok:  { deliverables: [{ id, description, proof_type, sponsor_name, asset_name }],
             cap: { limit: int|null, used: int },   // limit null = unlimited toggle on
             submitted_ids: uuid[], reported_ids: uuid[] }
    → err: { error: 'invalid_pin'|'session_closed'|'not_found' }
    The PIN check IS this call. Deliverables never queryable without it.

 3. submit_proof(p_token, p_pin, p_obligation_id, p_storage_path, p_mime, p_geo_lat, p_geo_lng)
    → ok:  { used: int, limit: int|null }
    → err: { error: 'cap_reached'|'session_closed'|'invalid_pin'|'invalid_file' }
    Writes proof row status='submitted', scoped to session org_id. Never 'delivered'.

 4. report_no_capture(p_token, p_pin, p_obligation_id, p_reason)  → ok:{} | err
 5. complete_capture_session(p_token, p_pin)                      → ok:{} | err

 STORAGE: photo uploaded to a session-scoped quarantine path BEFORE submit_proof.
 Storage RLS should allow anon INSERT only under `captures/{token}/` and nothing else.
 ─────────────────────────────────────────────────────────────────────────────
*/

const CAPTURE_BUCKET = 'proofs'

// ── Brand tokens ──────────────────────────────────────────────────────────────
const INK    = '#081216' // Carbon Petrol — base surface
const PINE   = '#0F2A2E' // Deep Pine — raised cards
const FOG    = '#E7ECEF'
const SLATE  = '#6E7F86'
const BLUE   = '#147BFF' // primary action + verification workflow
const COPPER = '#B8734A'
// No Verified Green anywhere in field mode. Nothing here is verified.

type PublicSession = {
  found: boolean
  status: 'active' | 'closed'
  event: { title: string | null; venue: string | null } | null
  org: { name: string | null; logo_url: string | null; club_colour_primary: string | null; club_colour_secondary: string | null } | null
}
type Deliverable = { id: string; description: string | null; proof_type: string; sponsor_name: string | null; asset_name: string | null }
type Cap = { limit: number | null; used: number }

const REASONS = [
  { value: 'event_cancelled', label: 'Event cancelled' },
  { value: 'asset_not_present', label: 'Asset not present' },
  { value: 'could_not_access', label: 'Couldn\u2019t access' },
  { value: 'other', label: 'Other' },
]

// ── SVG wordmark ──────────────────────────────────────────────────────────────
const O_ARC   = 'M873.735 347.639C898.493 344.775 922.792 349.648 943.469 363.849C964.779 378.522 979.408 401.039 984.155 426.472C989.607 456.155 982.16 481.366 965.308 505.675C957.877 501.095 950.861 497.807 943.039 494.028C951.244 484.183 956.989 472.528 959.799 460.024C963.871 441.089 960.3 421.313 949.863 404.998C938.576 387.638 922.504 377.041 902.392 372.759C901.94 372.676 901.487 372.599 901.033 372.528C880.508 369.277 859.101 373.103 842.11 385.427C826.478 396.918 816.067 414.162 813.178 433.347C809.468 457.588 816.492 475.116 830.476 494.232C822.176 497.845 815.897 501.472 808.117 505.943C798.035 490.808 791.722 477.724 789.052 459.404C785.108 433.179 791.888 406.471 807.864 385.303C824.374 363.356 846.814 351.416 873.735 347.639Z'
const O_BREAK = 'M876.273 500.988C904.427 497.778 932.768 506.786 955.235 523.713C949.48 529.254 944.417 533.62 938.29 538.755C923.817 529.858 914.292 526.66 897.594 524.151C873.104 522.25 856.67 525.977 835.728 538.872C829.3 533.622 824.598 529.559 818.648 523.799C835.706 509.913 854.812 503.743 876.273 500.988Z'
const S_PATH  = 'M438.532 347.689C466.232 344.584 505.581 349.465 529.745 363.724C526.819 371.238 523.812 378.72 520.726 386.17C496.565 374.864 477.723 371.516 451.744 371.626C432.898 371.705 393.747 376.892 396.627 402.78C402.181 452.685 495.21 415.624 524.433 449.977C534.051 461.284 538.333 468.556 538.756 483.329C539.162 529.497 497.926 539.067 461.429 539.876C427.58 540.636 402.505 536.592 371.777 522.545C373.856 516.241 378.482 506.016 381.147 499.586C412.813 514.903 447.612 518.555 482.304 513.625C491.624 512.3 502.467 509.271 508.621 501.656C512.967 496.375 515.004 489.567 514.274 482.767C510.834 450.619 453.621 458.064 430.541 454.825C403.388 451.014 375.226 442.167 372.154 409.224C368.205 366.885 402.263 351.712 438.532 347.689Z'
const P_PATH  = 'M591.69 349.883L652.183 349.793C668.404 349.779 692.625 348.653 707.674 352.793C716.991 355.371 725.488 360.304 732.346 367.117C755.626 390.443 754.804 434.159 731.747 457.175C715.658 473.236 694.163 475.061 672.712 474.606C662.112 474.381 651.277 474.567 640.664 474.525L640.719 449.79C671.678 449.581 715.744 458.654 724.352 419.908C728.319 387.605 709.827 372.875 679.311 373.975C674.024 374.166 668.029 373.994 662.683 374.01L615.998 374.194L615.955 536.93L591.707 536.764L591.69 349.883Z'
const R1_PATH = 'M1035.43 349.884L1101.63 349.779C1117.18 349.759 1131.76 348.914 1147.46 351.469C1191.83 358.684 1206.77 412.536 1180.62 445.935C1168.85 460.963 1152.77 464.378 1134.59 466.173C1153.69 487.785 1181.92 515.058 1202.56 536.176L1169.71 536.221L1089.56 454.24C1087.09 451.939 1084.2 449.709 1083.21 446.547C1083.28 446.008 1083.28 444.814 1083.5 444.371C1087.25 436.869 1140.71 450.713 1159.9 432.09C1166.14 426.039 1168.6 418.231 1168.74 409.707C1168.9 400.535 1166.81 391.482 1160.2 384.767C1155.36 379.849 1148.98 376.888 1142.31 375.376C1131.3 372.883 1118.95 373.958 1107.7 373.984L1059.72 374.152C1061.08 425.774 1059.83 483.997 1059.86 536.24L1035.47 536.222L1035.43 349.884Z'
const R2_PATH = 'M1246.62 349.875L1312.17 349.807C1327.81 349.78 1343.83 348.82 1359.46 351.591C1403.07 359.319 1417.7 413.269 1391.45 445.997C1379.72 460.624 1363.79 464.578 1345.74 466.108L1413.86 536.156L1381.03 536.212L1303.04 456.941C1299.59 453.51 1295.46 450.323 1293.88 445.95C1293.94 444.993 1293.79 442.698 1295.09 442.617C1309.01 442.651 1323.68 441.158 1337.61 442.158C1371.86 444.615 1391.78 417.024 1372.73 386.625C1363.59 372.027 1336.52 373.922 1319.43 373.972L1271.43 374.171C1270.79 427.888 1271.57 482.37 1271.27 536.215L1246.58 536.273L1246.62 349.875Z'

function SporrWordmark({ width = 64 }: { width?: number }) {
  const h = (width / 1046) * 200
  return (
    <svg viewBox="371 344 1046 200" width={width} height={h} aria-label="Sporr" role="img">
      {[S_PATH, P_PATH, O_ARC, R1_PATH, R2_PATH].map((d, i) => <path key={i} fill={FOG} d={d} />)}
      <path fill={COPPER} d={O_BREAK} />
    </svg>
  )
}

export default function FieldModePage({ params }: { params: { token: string } }) {
  const supabase = createClient()
  const token = params.token

  const [phase, setPhase] = useState<'loading' | 'gate' | 'closed' | 'notfound' | 'capture' | 'done'>('loading')
  const [pub, setPub] = useState<PublicSession | null>(null)

  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [authedPin, setAuthedPin] = useState<string | null>(null)

  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [cap, setCap] = useState<Cap>({ limit: null, used: 0 })
  const [results, setResults] = useState<Record<string, 'submitted' | 'reported'>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [capturing, setCapturing] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [otherReason, setOtherReason] = useState('')
  const [completing, setCompleting] = useState(false)
  const [submittedCount, setSubmittedCount] = useState(0)
  const [reportedCount, setReportedCount] = useState(0)

  const accent = pub?.org?.club_colour_primary || BLUE
  const crest = pub?.org?.logo_url || null
  const eventTitle = pub?.event?.title || 'Capture session'
  const eventVenue = pub?.event?.venue || null

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_capture_session_public', { p_token: token })
      if (error || !data || !(data as PublicSession).found) { setPhase('notfound'); return }
      const p = data as PublicSession
      setPub(p)
      setPhase(p.status === 'closed' ? 'closed' : 'gate')
    }
    load()
  }, [token])

  async function unlock() {
    if (pin.length !== 4 || unlocking) return
    setUnlocking(true); setPinError(null)
    const { data, error } = await supabase.rpc('open_capture_session', { p_token: token, p_pin: pin })
    if (error || !data) { setPinError('Couldn\u2019t reach the session. Try again.'); setUnlocking(false); return }
    const res = data as any
    if (res.error === 'invalid_pin') { setPinError('That code didn\u2019t match. Check with your session organiser.'); setUnlocking(false); return }
    if (res.error === 'session_closed') { setPhase('closed'); return }
    if (res.error === 'not_found') { setPhase('notfound'); return }

    const dels = (res.deliverables || []) as Deliverable[]
    const seeded: Record<string, 'submitted' | 'reported'> = {}
    for (const id of (res.submitted_ids || [])) seeded[id] = 'submitted'
    for (const id of (res.reported_ids || [])) seeded[id] = 'reported'

    setAuthedPin(pin)
    setDeliverables(dels)
    setCap(res.cap || { limit: null, used: 0 })
    setResults(seeded)
    setSubmittedCount(Object.values(seeded).filter(v => v === 'submitted').length)
    setReportedCount(Object.values(seeded).filter(v => v === 'reported').length)
    const firstUnresolved = dels.findIndex(d => !seeded[d.id])
    setCurrentIndex(firstUnresolved >= 0 ? firstUnresolved : 0)
    setPhase('capture')
    setUnlocking(false)
  }

  async function getLocation(): Promise<{ lat: number | null; lng: number | null }> {
    if (!navigator.geolocation) return { lat: null, lng: null }
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }))
      return { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } catch { return { lat: null, lng: null } }
  }

  function capturePhoto(deliverableId: string) {
    if (capturing || !authedPin) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    ;(input as any).capture = 'environment'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) { alert('Please use a photo.'); return }
      if (file.size > 5 * 1024 * 1024) { alert('Photo is too large. Please use a photo under 5MB.'); return }

      setCapturing(true)
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const storagePath = `captures/${token}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage.from(CAPTURE_BUCKET).upload(storagePath, file, { contentType: file.type })
      if (uploadError) { alert('Upload failed. Please try again.'); setCapturing(false); return }

      const { lat, lng } = await getLocation()
      const { data, error } = await supabase.rpc('submit_proof', {
        p_token: token, p_pin: authedPin, p_obligation_id: deliverableId,
        p_storage_path: storagePath, p_mime: file.type, p_geo_lat: lat, p_geo_lng: lng,
      })

      if (error || !data) { alert('Couldn\u2019t save the capture. Please try again.'); setCapturing(false); return }
      const res = data as any
      if (res.error === 'cap_reached') { setCap(c => ({ ...c, used: c.limit ?? c.used })); alert('This session has reached its capture limit. Captures already submitted are safe.'); setCapturing(false); return }
      if (res.error === 'session_closed') { setPhase('closed'); return }
      if (res.error === 'invalid_pin') { setPhase('gate'); setAuthedPin(null); return }
      if (res.error) { alert('Couldn\u2019t save the capture. Please try again.'); setCapturing(false); return }

      setResults(prev => ({ ...prev, [deliverableId]: 'submitted' }))
      setSubmittedCount(c => c + 1)
      setCap({ limit: res.limit ?? null, used: res.used ?? cap.used + 1 })
      setCapturing(false)
      setJustSubmitted(true)
      setTimeout(() => { setJustSubmitted(false); advance(deliverableId) }, 850)
    }
    input.click()
  }

  async function submitReport(reasonValue: string) {
    const del = deliverables[currentIndex]
    if (!del || !authedPin) return
    const reason = reasonValue === 'other' ? (otherReason.trim() || 'Other') : (REASONS.find(r => r.value === reasonValue)?.label || reasonValue)
    setReasonOpen(false); setOtherReason('')
    const { data, error } = await supabase.rpc('report_no_capture', { p_token: token, p_pin: authedPin, p_obligation_id: del.id, p_reason: reason })
    if (error || (data as any)?.error) { alert('Couldn\u2019t send that report. Please try again.'); return }
    setResults(prev => ({ ...prev, [del.id]: 'reported' }))
    setReportedCount(c => c + 1)
    advance(del.id)
  }

  function advance(currentId: string) {
    const pos = deliverables.findIndex(d => d.id === currentId)
    const nextIdx = deliverables.findIndex((d, i) => i > pos && !results[d.id] && d.id !== currentId)
    if (nextIdx >= 0) { setCurrentIndex(nextIdx); return }
    const anyIdx = deliverables.findIndex(d => !results[d.id] && d.id !== currentId)
    if (anyIdx >= 0) setCurrentIndex(anyIdx)
  }

  async function finish() {
    if (!authedPin) return
    setCompleting(true)
    const { error } = await supabase.rpc('complete_capture_session', { p_token: token, p_pin: authedPin })
    if (error) { alert('Couldn\u2019t close the session. Please try again.'); setCompleting(false); return }
    setPhase('done')
    setCompleting(false)
  }

  const total = deliverables.length
  const resolved = Object.keys(results).length
  const allResolved = total > 0 && resolved === total
  const capReached = cap.limit !== null && cap.used >= cap.limit
  const current = deliverables[currentIndex] || null
  const currentResult = current ? results[current.id] : undefined

  const screen: React.CSSProperties = { minHeight: '100svh', background: INK, color: FOG, fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }

  if (phase === 'loading') {
    return <main style={{ ...screen, alignItems: 'center', justifyContent: 'center' }}><p style={{ color: SLATE, fontSize: 15 }}>Loading session\u2026</p></main>
  }

  if (phase === 'notfound') {
    return <main style={{ ...screen, alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ marginBottom: 28 }}><SporrWordmark width={84} /></div>
      <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Session not found</p>
      <p style={{ color: SLATE, fontSize: 15, maxWidth: 300 }}>This link is invalid or has expired. Ask your session organiser for a current one.</p>
    </main>
  }

  if (phase === 'closed') {
    return <main style={{ ...screen, alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ marginBottom: 28 }}><SporrWordmark width={84} /></div>
      <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>This capture session has closed</p>
      <p style={{ color: SLATE, fontSize: 15, maxWidth: 320 }}>{eventTitle ? '\u201C' + eventTitle + '\u201D is no longer accepting captures.' : 'This session is no longer accepting captures.'} Anything already submitted has been kept for review.</p>
    </main>
  }

  if (phase === 'done') {
    return <main style={{ ...screen, alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ width: 76, height: 76, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none"><path d="M8 18l7 7 13-13" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>Session complete</h1>
      <p style={{ color: FOG, fontSize: 16, marginBottom: reportedCount > 0 ? 4 : 14 }}>{submittedCount} capture{submittedCount !== 1 ? 's' : ''} submitted for review</p>
      {reportedCount > 0 && <p style={{ color: SLATE, fontSize: 14, marginBottom: 14 }}>{reportedCount} reported as not captured</p>}
      <p style={{ color: SLATE, fontSize: 14, maxWidth: 320 }}>An administrator will review and verify these. You can close this page.</p>
    </main>
  }

  if (phase === 'gate') {
    return (
      <main style={{ ...screen, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}><SporrWordmark width={72} /></div>
          {crest && (
            <div style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px', background: accent + '22', border: '1.5px solid ' + accent + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={crest} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
            </div>
          )}
          {eventVenue && <p style={{ color: SLATE, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>{eventVenue}</p>}
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>{eventTitle}</h1>
          <p style={{ color: SLATE, fontSize: 14, marginBottom: 28 }}>Enter the session code from your organiser to begin capturing.</p>
          <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={4} value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(null) }}
            onKeyDown={e => { if (e.key === 'Enter') unlock() }} placeholder="\u2022\u2022\u2022\u2022" aria-label="Session code"
            style={{ width: '100%', textAlign: 'center', fontSize: 34, fontWeight: 700, letterSpacing: '0.5em', color: FOG, background: PINE, border: '1px solid ' + (pinError ? COPPER : 'rgba(255,255,255,0.12)'), borderRadius: 14, padding: '16px 0 16px 0.5em', outline: 'none', marginBottom: pinError ? 10 : 20 }} />
          {pinError && <p style={{ color: COPPER, fontSize: 13, marginBottom: 18 }}>{pinError}</p>}
          <button onClick={unlock} disabled={pin.length !== 4 || unlocking}
            style={{ width: '100%', minHeight: 56, borderRadius: 14, border: 'none', cursor: 'pointer', background: BLUE, color: '#FFFFFF', fontSize: 16, fontWeight: 600, opacity: pin.length !== 4 || unlocking ? 0.45 : 1 }}>
            {unlocking ? 'Unlocking\u2026' : 'Unlock session'}
          </button>
        </div>
      </main>
    )
  }

  const dotColour = (id: string, isCurrent: boolean) => {
    const r = results[id]
    if (r === 'submitted') return BLUE
    if (r === 'reported') return 'transparent'
    return isCurrent ? FOG : 'rgba(255,255,255,0.32)'
  }

  return (
    <main style={screen}>
      <header style={{ flexShrink: 0, padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SporrWordmark width={58} />
          <span style={{ color: SLATE, fontSize: 13, fontWeight: 600 }}>{resolved} / {total}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {crest && (
            <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: accent + '22', border: '1.5px solid ' + accent + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={crest} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            {eventVenue && <p style={{ color: SLATE, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>{eventVenue}</p>}
            <h1 style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eventTitle}</h1>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
          <div style={{ height: '100%', borderRadius: 999, background: BLUE, width: total > 0 ? (resolved / total) * 100 + '%' : '0%', transition: 'width 0.4s ease' }} />
        </div>
        <p style={{ color: SLATE, fontSize: 12, marginTop: 10 }}>
          {cap.limit === null ? submittedCount + ' capture' + (submittedCount !== 1 ? 's' : '') + ' submitted' : cap.used + ' of ' + cap.limit + ' captures used'}
        </p>
      </header>

      <div style={{ flexShrink: 0, padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {deliverables.map((d, i) => {
          const isCurrent = i === currentIndex
          const reported = results[d.id] === 'reported'
          return (
            <button key={d.id} onClick={() => setCurrentIndex(i)} aria-label={'Go to deliverable ' + (i + 1)}
              style={{ minHeight: 44, display: 'flex', alignItems: 'center', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ display: 'block', width: isCurrent ? 28 : 10, height: 10, borderRadius: 999, background: dotColour(d.id, isCurrent), border: reported ? '1.5px solid rgba(255,255,255,0.3)' : 'none', transition: 'all 0.2s' }} />
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, padding: '0 16px 16px', display: 'flex', flexDirection: 'column' }}>
        {current && (
          <div style={{ flex: 1, borderRadius: 18, background: PINE, borderLeft: '4px solid ' + (currentResult === 'submitted' ? BLUE : currentResult === 'reported' ? 'rgba(255,255,255,0.18)' : accent), border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px 24px 24px' }}>
            <div>
              <p style={{ color: COPPER, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>{current.sponsor_name || 'Sponsor'}</p>
              <h2 style={{ color: FOG, fontWeight: 600, lineHeight: 1.15, marginBottom: 18, fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>{current.description || current.asset_name || 'Deliverable'}</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: SLATE }}>
                {current.proof_type === 'photo' && (<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="6" cy="6.25" r="1.75" stroke="currentColor" strokeWidth="1.2"/><path d="M4 2.5l.75-1.25h2.5L8 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
                {current.proof_type}
              </span>
            </div>
            {currentResult === 'submitted' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l5 5 7-7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p style={{ color: FOG, fontWeight: 600 }}>Submitted for review</p>
              </div>
            )}
            {currentResult === 'reported' && (<p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 24 }}>Reported as not captured</p>)}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, padding: '12px 16px', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        {allResolved ? (
          <button onClick={finish} disabled={completing} style={{ width: '100%', minHeight: 72, borderRadius: 16, border: 'none', cursor: 'pointer', background: FOG, color: INK, fontSize: 18, fontWeight: 600, opacity: completing ? 0.5 : 1 }}>
            {completing ? 'Saving\u2026' : 'Finish \u2014 ' + submittedCount + ' submitted for review'}
          </button>
        ) : (currentResult === 'submitted' || currentResult === 'reported') ? (
          <button onClick={() => { const n = deliverables.findIndex((d, i) => i > currentIndex && !results[d.id]); if (n >= 0) setCurrentIndex(n); else { const a = deliverables.findIndex(d => !results[d.id]); if (a >= 0) setCurrentIndex(a) } }}
            style={{ width: '100%', minHeight: 72, borderRadius: 16, border: 'none', cursor: 'pointer', background: BLUE, color: '#FFFFFF', fontSize: 18, fontWeight: 600 }}>Next \u2192</button>
        ) : capReached ? (
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <p style={{ color: COPPER, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Session capacity reached</p>
            <p style={{ color: SLATE, fontSize: 13 }}>Captures already submitted are safe.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => current && capturePhoto(current.id)} disabled={capturing || justSubmitted}
              style={{ width: '100%', minHeight: 72, borderRadius: 16, border: 'none', cursor: 'pointer', background: justSubmitted ? BLUE : FOG, color: justSubmitted ? '#FFFFFF' : INK, fontSize: 18, fontWeight: 600, opacity: capturing ? 0.7 : 1, transition: 'background 0.2s' }}>
              {capturing ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12"/></svg>Uploading\u2026</span>)
                : justSubmitted ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11l5.5 5.5L18 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Submitted</span>)
                : (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.75"/><circle cx="11" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.75"/><path d="M8 6l1.2-2h3.6L14 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>Capture proof</span>)}
            </button>
            <button onClick={() => setReasonOpen(true)} disabled={capturing}
              style={{ width: '100%', minHeight: 52, borderRadius: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: SLATE, fontSize: 15, fontWeight: 500, border: '1px solid rgba(255,255,255,0.1)', opacity: capturing ? 0.4 : 1 }}>
              Can\u2019t capture this
            </button>
          </div>
        )}
      </div>

      {reasonOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(8,18,22,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => { setReasonOpen(false); setOtherReason('') }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: PINE, borderTopLeftRadius: 20, borderTopRightRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: FOG, marginBottom: 4 }}>Why can\u2019t this be captured?</p>
            <p style={{ fontSize: 13, color: SLATE, marginBottom: 18 }}>This is reported to your administrator \u2014 it isn\u2019t a final decision.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REASONS.map(r => (
                <button key={r.value} onClick={() => { if (r.value === 'other') return; submitReport(r.value) }}
                  style={{ width: '100%', textAlign: 'left', minHeight: 52, padding: '0 18px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: FOG, fontSize: 15, fontWeight: 500, border: '1px solid rgba(255,255,255,0.1)' }}>{r.label}</button>
              ))}
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Add a reason (optional)" onKeyDown={e => { if (e.key === 'Enter') submitReport('other') }}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0 16px', minHeight: 52, color: FOG, fontSize: 15, outline: 'none' }} />
                <button onClick={() => submitReport('other')} style={{ minHeight: 52, padding: '0 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: BLUE, color: '#FFFFFF', fontSize: 15, fontWeight: 600 }}>Report</button>
              </div>
            </div>
            <button onClick={() => { setReasonOpen(false); setOtherReason('') }} style={{ width: '100%', minHeight: 48, marginTop: 12, borderRadius: 12, cursor: 'pointer', background: 'transparent', color: SLATE, fontSize: 14, fontWeight: 500, border: 'none' }}>Cancel</button>
          </div>
        </div>
      )}
    </main>
  )
}
