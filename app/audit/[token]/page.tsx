'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Obligation = {
  id: string
  description: string | null
  proof_type: string
  status: string
  assets: { name: string; asset_type: string } | null
  contracts: { sponsors: { company_name: string } | null } | null
}

type SessionData = {
  id: string
  status: string
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
        .select('id, status, events(title, venue)')
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
        .select('id, description, proof_type, status, assets(name, asset_type), contracts(sponsors(company_name))')
        .eq('status', 'pending')

      setObligations((obligationsData as unknown as Obligation[]) || [])
      setLoading(false)
    }
    load()
  }, [params.token])

  async function captureProof(obligationId: string, type: string) {
    if (type === 'photo') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        const fileName = `proofs/${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('public')
          .upload(fileName, file)

        if (uploadError) {
          alert('Photo upload failed: ' + uploadError.message)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(fileName)

        await markDelivered(obligationId, { photo_url: publicUrl })
      }
      input.click()
      return
    }

    if (type === 'link') {
      const link = prompt('Paste the social media post URL:')
      if (!link) return
      await markDelivered(obligationId, { external_link: link })
      return
    }

    if (type === 'timestamp' || type === 'note') {
      const note = prompt('Add a note (optional):') || ''
      await markDelivered(obligationId, { note })
      return
    }
  }

  async function markDelivered(obligationId: string, proofData: object) {
    let lat: number | null = null
    let lng: number | null = null

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        )
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      } catch {}
    }

    const sessionId = session?.id

    await supabase.from('proofs').insert({
      obligation_id: obligationId,
      org_id: null,
      session_id: sessionId,
      geo_lat: lat,
      geo_lng: lng,
      captured_at: new Date().toISOString(),
      ...proofData,
    })

    await supabase
      .from('obligations')
      .update({ status: 'delivered' })
      .eq('id', obligationId)

    setObligations(prev =>
      prev.map(o => o.id === obligationId ? { ...o, status: 'delivered' } : o)
    )
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
  const total = obligations.length

  if (loading) {
    return (
      <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6">
        <div className="text-sporr-cream text-sm">Loading session...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sporr-cream text-lg mb-2">Session not found</p>
          <p className="text-sporr-sage text-sm">{error}</p>
        </div>
      </main>
    )
  }

  if (done) {
    return (
      <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-sporr-sage text-6xl mb-6">✓</div>
          <h1 className="text-sporr-cream text-2xl font-medium mb-3">Session complete</h1>
          <p className="text-sporr-sage text-sm">
            {delivered} obligation{delivered !== 1 ? 's' : ''} documented.
            A Proof Pack will be generated shortly.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sporr-dark pb-24">

      <div className="bg-sporr-mid px-6 py-4">
        <p className="text-sporr-sage text-xs uppercase tracking-widest mb-1">Field auditor</p>
        <h1 className="text-sporr-cream font-medium text-lg">
          {session?.events?.title || 'Audit session'}
        </h1>
        {session?.events?.venue && (
          <p className="text-sporr-sage text-sm">{session.events.venue}</p>
        )}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-sporr-sage mb-1">
            <span>{delivered} of {total} delivered</span>
            <span>{total > 0 ? Math.round((delivered / total) * 100) : 0}%</span>
          </div>
          <div className="h-1.5 bg-sporr-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-sporr-sage rounded-full transition-all duration-300"
              style={{ width: total > 0 ? `${(delivered / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-3">
        {obligations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sporr-sage text-sm">No obligations linked to this session.</p>
            <p className="text-sporr-sage text-xs mt-2">Add obligations to contracts to see them here.</p>
          </div>
        )}

        {obligations.map(ob => (
          <div
            key={ob.id}
            className={`rounded-xl p-4 ${
              ob.status === 'delivered' ? 'bg-sporr-mid opacity-60' :
              ob.status === 'not_applicable' ? 'bg-sporr-dark opacity-40' :
              'bg-sporr-mid'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <p className="text-xs text-sporr-sage uppercase tracking-widest mb-1">
                  {ob.contracts?.sponsors?.company_name || 'Unknown sponsor'}
                  {' · '}{ob.assets?.asset_type?.replace(/_/g, ' ') || ob.proof_type}
                </p>
                <p className="text-sporr-cream text-sm font-medium">
                  {ob.assets?.name || ob.description || 'Obligation'}
                </p>
                {ob.description && ob.assets?.name && (
                  <p className="text-sporr-sage text-xs mt-1">{ob.description}</p>
                )}
              </div>
              {ob.status === 'delivered' && (
                <span className="text-sporr-sage text-xl flex-shrink-0">✓</span>
              )}
              {ob.status === 'not_applicable' && (
                <span className="text-sporr-muted text-sm flex-shrink-0">Skipped</span>
              )}
            </div>

            {ob.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => captureProof(ob.id, ob.proof_type)}
                  className="flex-1 bg-sporr-cream text-sporr-dark text-sm font-medium py-2.5 rounded-lg"
                >
                  {ob.proof_type === 'photo' ? 'Capture photo' :
                   ob.proof_type === 'link' ? 'Paste link' :
                   'Confirm delivery'}
                </button>
                <button
                  onClick={() => skipObligation(ob.id)}
                  className="px-4 bg-sporr-dark text-sporr-muted text-sm py-2.5 rounded-lg"
                >
                  Skip
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-sporr-dark border-t border-sporr-mid">
        <button
          onClick={completeSession}
          disabled={completing || delivered === 0}
          className="w-full bg-sporr-cream text-sporr-dark font-medium py-4 rounded-xl text-base disabled:opacity-40"
        >
          {completing ? 'Completing...' : `Complete session (${delivered} captured)`}
        </button>
      </div>

    </main>
  )
}
