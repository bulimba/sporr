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

export default function AuditorPage({ params }: { params: { token: string } }) {
  const supabase = createClient()
  const [session, setSession] = useState<SessionData | null>(null)
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

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

      setObligations((obligationsData as unknown as Obligation[]) || [])
      setLoading(false)
    }
    load()
  }, [params.token])

  async function getLocation(): Promise<{ lat: number | null, lng: number | null }> {
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

  async function captureProof() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) {
        alert('Photo is too large. Please use a photo under 2MB.')
        return
      }

      const fileName = `proofs/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, file)
      if (uploadError) {
        alert('Photo upload failed: ' + uploadError.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(fileName)

      const { lat, lng } = await getLocation()
      const now = new Date().toISOString()

      // Find all pending obligations matching this session's delivery context
      const pendingObligations = obligations.filter(o => o.status === 'pending')

      if (pendingObligations.length === 0) {
        alert('No pending obligations to deliver for this session type.')
        return
      }

      // Insert a proof row for every pending obligation at once
      const proofRows = pendingObligations.map(o => ({
        obligation_id: o.id,
        org_id: session?.org_id || null,
        session_id: session?.id,
        photo_url: publicUrl,
        geo_lat: lat,
        geo_lng: lng,
        captured_at: now,
      }))

      const { error: proofError } = await supabase.from('proofs').insert(proofRows)
      if (proofError) {
        alert('Failed to save proof: ' + proofError.message)
        return
      }

      // Mark all those obligations as delivered
      const ids = pendingObligations.map(o => o.id)
      await supabase
        .from('obligations')
        .update({ status: 'delivered' })
        .in('id', ids)

      setObligations(prev =>
        prev.map(o => ids.includes(o.id) ? { ...o, status: 'delivered' } : o)
      )
    }
    input.click()
  }

  async function skipObligation(obligationId: string) {
    await supabase
      .from('obligations')
      .update({ status: 'not_applicable' })
      .eq('id', obligationId)
    setObligations(prev =>
      prev.map(o => o.id === obligationId ? { ...o, status: 'not_applicable' } : o)
    )
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

  const delivered = obligations.filter(o => o.status === 'delivered').length
  const pending = obligations.filter(o => o.status === 'pending').length
  const total = obligations.filter(o => o.status !== 'not_applicable').length

  if (loading) {
    return (
      <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6">
        <div className="text-sporr-cream text-base">Loading session...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sporr-cream text-xl mb-3">Session not found</p>
          <p className="text-sporr-cream text-base">{error}</p>
          <a href="/dashboard" className="text-sporr-sage mt-6 inline-block text-base hover:text-sporr-cream">
            ← Back to dashboard
          </a>
        </div>
      </main>
    )
  }

  if (done) {
    return (
      <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-sporr-cream text-6xl mb-6">✓</div>
          <h1 className="text-sporr-cream text-2xl font-medium mb-3">Session complete</h1>
          <p className="text-sporr-cream text-base mb-8">
            {delivered} obligation{delivered !== 1 ? 's' : ''} documented.
          </p>
          <a href="/dashboard" className="btn-primary inline-block">
            Back to dashboard
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sporr-dark pb-32">
      <div className="bg-sporr-dark border-b border-sporr-mid px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <a href="/dashboard" className="text-sporr-cream text-sm hover:text-sporr-sage">
            ← Back
          </a>
          <img
            src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
            alt="Sporr"
            className="h-20 mx-auto"
          />
          <div className="w-12"></div>
        </div>
        <h1 className="text-sporr-cream font-medium text-xl text-center">
          {session?.events?.title || 'Audit session'}
        </h1>
        {session?.events?.venue && (
          <p className="text-sporr-cream text-base mt-1 text-center">{session.events.venue}</p>
        )}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-sporr-cream mb-2">
            <span>{delivered} of {total} delivered</span>
            <span>{total > 0 ? Math.round((delivered / total) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-sporr-mid rounded-full overflow-hidden">
            <div
              className="h-full bg-sporr-cream rounded-full transition-all duration-300"
              style={{ width: total > 0 ? `${(delivered / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {obligations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sporr-cream text-base">No obligations linked to this session type.</p>
            <p className="text-sporr-cream text-sm mt-2">Add obligations with a matching delivery context to see them here.</p>
          </div>
        )}

        {/* Pending obligations — shown as a group with one capture button */}
        {pending > 0 && (
          <div className="rounded-xl p-5 border-2 bg-sporr-cream border-sporr-cream">
            <p className="text-sporr-muted text-sm uppercase tracking-widest mb-3 font-medium">
              {pending} obligation{pending !== 1 ? 's' : ''} pending
            </p>
            <div className="space-y-2 mb-4">
              {obligations.filter(o => o.status === 'pending').map(ob => (
                <div key={ob.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sporr-dark font-medium text-sm">{ob.assets?.name || ob.description || 'Obligation'}</p>
                    <p className="text-sporr-muted text-xs">{ob.contracts?.sponsors?.company_name || 'Unknown sponsor'}</p>
                  </div>
                  <button
                    onClick={() => skipObligation(ob.id)}
                    className="text-sporr-muted text-xs px-3 py-1 rounded-lg bg-sporr-sage-lt"
                  >
                    Skip
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={captureProof}
              className="w-full bg-sporr-dark text-sporr-cream text-base font-medium py-3 rounded-lg"
            >
              📷 Capture photo — deliver all
            </button>
          </div>
        )}

        {/* Delivered obligations */}
        {obligations.filter(o => o.status === 'delivered').map(ob => (
          <div key={ob.id} className="rounded-xl p-5 border-2 bg-sporr-mid border-sporr-cream">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sporr-cream text-sm uppercase tracking-widest mb-1 font-medium">
                  {ob.contracts?.sponsors?.company_name || 'Unknown sponsor'}
                </p>
                <p className="text-sporr-cream text-lg font-medium">
                  {ob.assets?.name || ob.description || 'Obligation'}
                </p>
              </div>
              <span className="text-sporr-cream text-2xl flex-shrink-0">✓</span>
            </div>
          </div>
        ))}

        {/* Skipped obligations */}
        {obligations.filter(o => o.status === 'not_applicable').map(ob => (
          <div key={ob.id} className="rounded-xl p-5 border-2 bg-sporr-dark border-sporr-mid opacity-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sporr-cream text-sm uppercase tracking-widest mb-1 font-medium">
                  {ob.contracts?.sponsors?.company_name || 'Unknown sponsor'}
                </p>
                <p className="text-sporr-cream text-lg font-medium">
                  {ob.assets?.name || ob.description || 'Obligation'}
                </p>
              </div>
              <span className="text-sporr-cream text-base flex-shrink-0">Skipped</span>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-sporr-dark border-t border-sporr-mid">
        <button
          onClick={completeSession}
          disabled={completing || delivered === 0}
          className="w-full bg-sporr-cream text-sporr-dark font-medium py-4 rounded-xl text-lg disabled:opacity-40"
        >
          {completing ? 'Completing...' : `Complete session (${delivered} captured)`}
        </button>
      </div>
    </main>
  )
}
