'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Obligation = {
  id: string
  description: string | null
  proof_type: string
  status: string
  delivery_context: string
  assets: { name: string; asset_type: string } | null
  contracts: { sponsors: { company_name: string } | null } | null
}

type SessionData = {
  id: string
  status: string
  delivery_context: string
  org_id: string
  events: { title: string; venue: string | null } | null
}

type ProofResult = 'delivered' | 'not_applicable'

export default function AuditorPage({ params }: { params: { token: string } }) {
  const supabase = createClient()
  const [session, setSession] = useState<SessionData | null>(null)
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [capturing, setCapturing] = useState(false)
  const [justCaptured, setJustCaptured] = useState(false)
  const [results, setResults] = useState<Record<string, ProofResult>>({})

  useEffect(() => {
    async function load() {
      const { data: sessionData, error: sessionError } = await supabase
        .from('audit_sessions')
        .select('id, status, org_id, delivery_context, events(title, venue)')
        .eq('session_token', params.token)
        .single()

      if (sessionError || !sessionData) {
        setError('Session not found or expired.')
        setLoading(false)
        return
      }

      setSession(sessionData as unknown as SessionData)

      const { data: obligationsData } = await supabase
        .from('obligations')
        .select('id, description, proof_type, status, delivery_context, assets(name, asset_type), contracts(sponsors(company_name))')
        .eq('org_id', (sessionData as any).org_id)
        .eq('delivery_context', (sessionData as any).delivery_context)
        .neq('status', 'not_applicable')

      const obs = (obligationsData as unknown as Obligation[]) || []
      setObligations(obs)

      // Seed results from existing delivered obligations
      const initial: Record<string, ProofResult> = {}
      for (const ob of obs) {
        if (ob.status === 'delivered') initial[ob.id] = 'delivered'
      }
      setResults(initial)

      // Start from first undelivered
      const firstPending = obs.findIndex(o => o.status === 'pending')
      setCurrentIndex(firstPending >= 0 ? firstPending : 0)

      setLoading(false)
    }
    load()
  }, [params.token])

  async function getLocation(): Promise<{ lat: number | null; lng: number | null }> {
    if (!navigator.geolocation) return { lat: null, lng: null }
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      )
      return { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } catch {
      return { lat: null, lng: null }
    }
  }

  async function capturePhoto(obligationId: string) {
    if (capturing) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !session) return

      if (file.size > 5 * 1024 * 1024) {
        alert('Photo is too large. Please use a photo under 5MB.')
        return
      }

      setCapturing(true)

      const fileName = `proofs/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('proofs').upload(fileName, file)
      if (uploadError) {
        alert('Upload failed: ' + uploadError.message)
        setCapturing(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(fileName)
      const { lat, lng } = await getLocation()

      const { error: proofError } = await supabase.from('proofs').insert({
        obligation_id: obligationId,
        org_id: session.org_id,
        session_id: session.id,
        photo_url: publicUrl,
        geo_lat: lat,
        geo_lng: lng,
        captured_at: new Date().toISOString(),
      })

      if (proofError) {
        alert('Failed to save proof: ' + proofError.message)
        setCapturing(false)
        return
      }

      await supabase.from('obligations').update({ status: 'delivered' }).eq('id', obligationId)

      setResults(prev => ({ ...prev, [obligationId]: 'delivered' }))
      setCapturing(false)
      setJustCaptured(true)

      // Brief success flash then advance
      setTimeout(() => {
        setJustCaptured(false)
        advanceToNext(obligationId)
      }, 800)
    }

    input.click()
  }

  async function skipObligation(obligationId: string) {
    await supabase.from('obligations').update({ status: 'not_applicable' }).eq('id', obligationId)
    setResults(prev => ({ ...prev, [obligationId]: 'not_applicable' }))
    advanceToNext(obligationId)
  }

  function advanceToNext(currentObId: string) {
    const currentPos = obligations.findIndex(o => o.id === currentObId)
    // Find next unresolved obligation
    const nextIdx = obligations.findIndex((o, i) => i > currentPos && !results[o.id] && o.id !== currentObId)
    if (nextIdx >= 0) {
      setCurrentIndex(nextIdx)
    } else {
      // Check if any earlier ones are unresolved
      const anyPending = obligations.some(o => !results[o.id] && o.id !== currentObId)
      if (!anyPending) {
        // All resolved — stay on current, let user complete
        setCurrentIndex(currentPos)
      }
    }
  }

  function goToObligation(index: number) {
    setCurrentIndex(index)
  }

  async function completeSession() {
    if (!session) return
    setCompleting(true)
    await supabase
      .from('audit_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', session.id)
    setDone(true)
    setCompleting(false)
  }

  const deliveredCount = Object.values(results).filter(r => r === 'delivered').length
  const skippedCount = Object.values(results).filter(r => r === 'not_applicable').length
  const resolvedCount = deliveredCount + skippedCount
  const totalCount = obligations.length
  const allResolved = resolvedCount === totalCount && totalCount > 0

  const currentOb = obligations[currentIndex] || null
  const currentResult = currentOb ? results[currentOb.id] : null

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6">
        <div className="text-sporr-cream text-base">Loading session...</div>
      </main>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sporr-cream text-xl mb-3">Session not found</p>
          <p className="text-sporr-sage text-base">{error}</p>
          <a href="/dashboard" className="text-sporr-sage mt-8 inline-block text-base hover:text-sporr-cream underline">
            ← Back to dashboard
          </a>
        </div>
      </main>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <main className="min-h-screen bg-sporr-dark flex flex-col items-center justify-center px-6 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
          style={{ backgroundColor: '#4B9560' }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M8 18l7 7 13-13" stroke="#F5F1E6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-sporr-cream text-3xl font-medium mb-3">Session complete</h1>
        <p className="text-sporr-sage text-lg mb-2">
          {deliveredCount} obligation{deliveredCount !== 1 ? 's' : ''} documented
        </p>
        {skippedCount > 0 && (
          <p className="text-sporr-sage text-sm mb-8">{skippedCount} skipped</p>
        )}
        <a
          href="/dashboard"
          className="mt-4 inline-block bg-sporr-cream text-sporr-dark font-medium px-8 py-4 rounded-xl text-base"
          style={{ minHeight: '56px', lineHeight: '1' }}
        >
          Back to dashboard
        </a>
      </main>
    )
  }

  // ── No obligations ───────────────────────────────────────────────────────────
  if (obligations.length === 0) {
    return (
      <main className="min-h-screen bg-sporr-dark flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sporr-cream text-xl mb-3">No obligations for this session</p>
        <p className="text-sporr-sage text-base mb-8 max-w-xs leading-relaxed">
          Add obligations with a matching delivery context in the dashboard.
        </p>
        <a href="/dashboard" className="text-sporr-sage underline text-base hover:text-sporr-cream">
          ← Back to dashboard
        </a>
      </main>
    )
  }

  // ── Main field mode ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-sporr-dark flex flex-col">

      {/* Header — minimal */}
      <header className="flex-shrink-0 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-5">
          <a
            href="/dashboard"
            className="text-sporr-sage hover:text-sporr-cream text-sm transition-colors flex items-center gap-1.5"
            style={{ minHeight: '48px', display: 'flex', alignItems: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </a>
          <div className="text-sporr-sage text-sm font-medium">
            {resolvedCount} / {totalCount}
          </div>
        </div>

        {/* Event name */}
        <div className="mb-4">
          <p className="text-sporr-sage text-xs uppercase tracking-widest mb-1">
            {session?.events?.venue || 'Field mode'}
          </p>
          <h1 className="text-sporr-cream text-xl font-medium leading-snug">
            {session?.events?.title || 'Audit session'}
          </h1>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              backgroundColor: '#4B9560',
              width: totalCount > 0 ? `${(resolvedCount / totalCount) * 100}%` : '0%',
            }}
          />
        </div>
      </header>

      {/* Step dots — tap to navigate */}
      <div className="flex-shrink-0 px-5 pb-4 flex items-center gap-2 flex-wrap">
        {obligations.map((ob, i) => {
          const res = results[ob.id]
          const isCurrent = i === currentIndex
          return (
            <button
              key={ob.id}
              onClick={() => goToObligation(i)}
              style={{
                width: isCurrent ? '28px' : '10px',
                height: '10px',
                minWidth: '10px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label={`Go to obligation ${i + 1}`}
            >
              <span
                style={{
                  display: 'block',
                  width: isCurrent ? '28px' : '10px',
                  height: '10px',
                  borderRadius: '999px',
                  backgroundColor: res === 'delivered'
                    ? '#4B9560'
                    : res === 'not_applicable'
                    ? 'rgba(255,255,255,0.2)'
                    : isCurrent
                    ? '#F5F1E6'
                    : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.2s',
                }}
              />
            </button>
          )
        })}
      </div>

      {/* Main card — current obligation */}
      <div className="flex-1 px-4 pb-4 flex flex-col">
        {currentOb && (
          <div
            className="flex-1 rounded-2xl flex flex-col overflow-hidden"
            style={{
              backgroundColor: currentResult === 'delivered'
                ? '#36573B'
                : currentResult === 'not_applicable'
                ? 'rgba(255,255,255,0.05)'
                : '#1e4a38',
              border: currentResult === 'delivered'
                ? '2px solid #4B9560'
                : currentResult === 'not_applicable'
                ? '2px solid rgba(255,255,255,0.1)'
                : '2px solid rgba(168,213,186,0.2)',
            }}
          >
            {/* Obligation content */}
            <div className="flex-1 px-6 pt-8 pb-6 flex flex-col justify-between">
              <div>
                {/* Sponsor */}
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#A8D5BA' }}>
                  {currentOb.contracts?.sponsors?.company_name || 'Sponsor'}
                </p>

                {/* Obligation name — large */}
                <h2
                  className="font-medium leading-tight mb-4"
                  style={{
                    color: '#F5F1E6',
                    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                  }}
                >
                  {currentOb.description || currentOb.assets?.name || 'Obligation'}
                </h2>

                {/* Proof type badge */}
                <span
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#A8D5BA' }}
                >
                  {currentOb.proof_type === 'photo' && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="1" y="2.5" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="6" cy="6.25" r="1.75" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4 2.5l.75-1.25h2.5L8 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {currentOb.proof_type}
                </span>
              </div>

              {/* Resolved states */}
              {currentResult === 'delivered' && (
                <div className="flex items-center gap-3 mt-6">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#4B9560' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10l5 5 7-7" stroke="#F5F1E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sporr-cream font-medium">Proof captured</p>
                </div>
              )}

              {currentResult === 'not_applicable' && (
                <div className="flex items-center gap-3 mt-6">
                  <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm">Skipped</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action zone — fixed height, always visible */}
      <div
        className="flex-shrink-0 px-4 pb-6 pt-3"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {allResolved ? (
          /* All done — show complete button */
          <button
            onClick={completeSession}
            disabled={completing}
            className="w-full font-medium rounded-xl transition-colors disabled:opacity-50"
            style={{
              backgroundColor: '#F5F1E6',
              color: '#13322A',
              minHeight: '72px',
              fontSize: '1.125rem',
            }}
          >
            {completing ? 'Saving...' : `Complete session · ${deliveredCount} captured`}
          </button>
        ) : currentResult === 'delivered' || currentResult === 'not_applicable' ? (
          /* Current obligation resolved — next button */
          <button
            onClick={() => {
              const nextIdx = obligations.findIndex(
                (o, i) => i > currentIndex && !results[o.id]
              )
              if (nextIdx >= 0) setCurrentIndex(nextIdx)
              else {
                // wrap: find any unresolved
                const anyIdx = obligations.findIndex(o => !results[o.id])
                if (anyIdx >= 0) setCurrentIndex(anyIdx)
              }
            }}
            className="w-full font-medium rounded-xl transition-colors"
            style={{
              backgroundColor: '#4B9560',
              color: '#F5F1E6',
              minHeight: '72px',
              fontSize: '1.125rem',
            }}
          >
            Next →
          </button>
        ) : (
          /* Active obligation — capture + skip */
          <div className="space-y-3">
            {/* Capture — dominant */}
            <button
              onClick={() => currentOb && capturePhoto(currentOb.id)}
              disabled={capturing || justCaptured}
              className="w-full font-medium rounded-xl transition-all disabled:opacity-60"
              style={{
                backgroundColor: justCaptured ? '#4B9560' : '#F5F1E6',
                color: justCaptured ? '#F5F1E6' : '#13322A',
                minHeight: '72px',
                fontSize: '1.125rem',
              }}
            >
              {capturing ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12"/>
                  </svg>
                  Uploading...
                </span>
              ) : justCaptured ? (
                <span className="flex items-center justify-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11l5.5 5.5L18 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Captured
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.75"/>
                    <circle cx="11" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.75"/>
                    <path d="M8 6l1.2-2h3.6L14 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Capture proof
                </span>
              )}
            </button>

            {/* Skip — secondary, still accessible */}
            <button
              onClick={() => currentOb && skipObligation(currentOb.id)}
              disabled={capturing}
              className="w-full font-medium rounded-xl transition-colors disabled:opacity-40"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#A8D5BA',
                minHeight: '52px',
                fontSize: '0.9375rem',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Skip this obligation
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
