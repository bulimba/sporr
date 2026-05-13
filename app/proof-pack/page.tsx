'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with @react-pdf/renderer
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
)

const ProofPackDocument = dynamic(
  () => import('@/lib/ProofPackDocument').then(mod => mod.ProofPackDocument),
  { ssr: false }
)

type Contract = {
  id: string
  title: string
  season: string
  value_nok: number
  sponsors: {
    id: string
    company_name: string
    contact_email: string | null
  } | null
}

type Obligation = {
  id: string
  description: string | null
  proof_type: string
  status: string
  proofs: {
    id: string
    photo_url: string | null
    external_link: string | null
    note: string | null
    captured_at: string
    geo_lat: number | null
    geo_lng: number | null
  }[]
}

export default function ProofPackPage() {
  const router = useRouter()
  const supabase = createClient()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [orgName, setOrgName] = useState('')
  const [narrative, setNarrative] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingObligations, setLoadingObligations] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfReady, setPdfReady] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) { router.push('/login'); return }
        async (event, session) => {
  if (!session) { router.push('/login'); return }

  const { data: userData } = await supabase

        const { data: userData } = await supabase
          .from('users')
          .select('org_id')
          .eq('id', session.user.id)
          .single()

        if (!userData) { setLoading(false); return }

        const { data: orgData } = await supabase
          .from('organisations')
          .select('name')
          .eq('id', userData.org_id)
          .single()

        setOrgName(orgData?.name || '')

        const { data: contractsData } = await supabase
          .from('contracts')
          .select('id, title, season, value_nok, sponsors(id, company_name, contact_email)')
          .eq('org_id', userData.org_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        setContracts((contractsData as unknown as Contract[]) || [])
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function loadObligations(contractId: string) {
    setLoadingObligations(true)
    setPdfReady(false)

    const { data } = await supabase
      .from('obligations')
      .select(`
        id, description, proof_type, status,
        proofs(id, photo_url, external_link, note, captured_at, geo_lat, geo_lng)
      `)
      .eq('contract_id', contractId)

    setObligations((data as unknown as Obligation[]) || [])
    setLoadingObligations(false)

    // Small delay to allow PDF renderer to initialise
    setTimeout(() => setPdfReady(true), 500)
  }

  function handleSelectContract(contractId: string) {
    const contract = contracts.find(c => c.id === contractId) || null
    setSelectedContract(contract)
    setSent(false)
    setError(null)
    setNarrative('')
    if (contract) loadObligations(contractId)
  }

  async function handleSendEmail() {
    if (!selectedContract || !selectedContract.sponsors?.contact_email) {
      setError('No sponsor email address on file. Add one in Your Sponsors.')
      return
    }

    setSending(true)
    setError(null)

    try {
      const response = await fetch('/api/send-proof-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: selectedContract.id,
          sponsorEmail: selectedContract.sponsors.contact_email,
          sponsorName: selectedContract.sponsors.company_name,
          clubName: orgName,
          contractTitle: selectedContract.title,
          season: selectedContract.season,
          narrative,
          obligations,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        setError(err.error || 'Failed to send. Please try again.')
        setSending(false)
        return
      }

      setSent(true)
      setSending(false)
    } catch (e) {
      setError('Network error. Please try again.')
      setSending(false)
    }
  }

  const delivered = obligations.filter(o => o.status === 'delivered')
  const deliveryScore = obligations.length > 0
    ? Math.round((delivered.length / obligations.length) * 100)
    : 0

  const pdfData = selectedContract ? {
    clubName: orgName,
    sponsorName: selectedContract.sponsors?.company_name || '',
    contractTitle: selectedContract.title,
    season: selectedContract.season || '',
    generatedAt: new Date().toISOString(),
    obligations,
    deliveryScore,
    narrative,
  } : null

  if (loading) {
    return (
      <main className="min-h-screen bg-sporr-cream flex items-center justify-center">
        <div className="text-sporr-muted text-sm">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sporr-cream">

      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard">
          <img
            src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
            alt="Sporr"
            className="h-20"
          />
        </Link>
        <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-sporr-dark text-2xl font-medium mb-1">Proof Pack</h1>
          <p className="text-sporr-muted text-sm">
            Generate and send a proof of delivery report to your sponsor
          </p>
        </div>

        {/* Step 1 — Select contract */}
        <div className="card mb-6">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">
            1. Select a contract
          </h2>
          {contracts.length === 0 ? (
            <p className="text-sporr-muted text-sm">
              No active contracts found.{' '}
              <Link href="/dashboard/contracts" className="text-sporr-dark underline">
                Add a contract
              </Link>
            </p>
          ) : (
            <select
              className="input"
              value={selectedContract?.id || ''}
              onChange={e => handleSelectContract(e.target.value)}
            >
              <option value="">Select a contract...</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} — {c.sponsors?.company_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 2 — Review obligations */}
        {selectedContract && (
          <div className="card mb-6">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">
              2. Delivery summary
            </h2>

            {loadingObligations ? (
              <p className="text-sporr-muted text-sm">Loading obligations...</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-sporr-sage-lt rounded-lg p-4 text-center">
                    <p className="text-sporr-dark text-3xl font-medium">{obligations.length}</p>
                    <p className="text-sporr-muted text-xs uppercase tracking-widest mt-1">Total</p>
                  </div>
                  <div className="bg-sporr-sage-lt rounded-lg p-4 text-center">
                    <p className="text-sporr-dark text-3xl font-medium">{delivered.length}</p>
                    <p className="text-sporr-muted text-xs uppercase tracking-widest mt-1">Delivered</p>
                  </div>
                  <div className="bg-sporr-sage-lt rounded-lg p-4 text-center">
                    <p className="text-sporr-dark text-3xl font-medium">{deliveryScore}%</p>
                    <p className="text-sporr-muted text-xs uppercase tracking-widest mt-1">Score</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {obligations.map(ob => (
                    <div key={ob.id} className="flex items-center justify-between bg-sporr-light rounded-lg px-4 py-3">
                      <p className="text-sporr-dark text-sm">{ob.description}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        ob.status === 'delivered'
                          ? 'bg-sporr-dark text-sporr-cream'
                          : ob.status === 'not_applicable'
                          ? 'bg-sporr-light text-sporr-muted border border-sporr-sage-lt'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ob.status === 'delivered' ? '✓ Delivered' :
                         ob.status === 'not_applicable' ? 'Skipped' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3 — Add narrative */}
        {selectedContract && !loadingObligations && (
          <div className="card mb-6">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">
              3. Add a season summary (optional)
            </h2>
            <textarea
              className="input h-28 resize-none"
              placeholder="Write a short summary of the season partnership — highlights, attendance figures, special moments. This appears in the Proof Pack as a personal message to your sponsor."
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
            />
          </div>
        )}

        {/* Step 4 — Send */}
        {selectedContract && !loadingObligations && (
          <div className="card">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">
              4. Send to sponsor
            </h2>

            {selectedContract.sponsors?.contact_email ? (
              <p className="text-sporr-muted text-sm mb-6">
                Will be sent to{' '}
                <span className="text-sporr-dark font-medium">
                  {selectedContract.sponsors.contact_email}
                </span>
              </p>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6">
                No email address on file for {selectedContract.sponsors?.company_name}.{' '}
                <Link href="/dashboard/sponsors" className="underline">
                  Add one in Your Sponsors
                </Link>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}

            {sent ? (
              <div className="bg-sporr-sage-lt border border-sporr-sage rounded-lg px-4 py-4 text-center">
                <p className="text-sporr-dark font-medium mb-1">✓ Proof Pack sent</p>
                <p className="text-sporr-muted text-sm">
                  {selectedContract.sponsors?.company_name} will receive it shortly.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {/* Download PDF button */}
                {pdfReady && pdfData && (
                  <div className="flex-shrink-0">
                    {/* @ts-ignore */}
                    <PDFDownloadLink
                      document={<ProofPackDocument data={pdfData} />}
                      fileName={`sporr-proof-pack-${selectedContract.sponsors?.company_name?.toLowerCase().replace(/\s+/g, '-')}-${selectedContract.season?.replace(/\//g, '-') || 'season'}.pdf`}
                      className="btn-secondary inline-block"
                    >
                      {({ loading: pdfLoading }: { loading: boolean }) =>
                        pdfLoading ? 'Preparing PDF...' : 'Download PDF'
                      }
                    </PDFDownloadLink>
                  </div>
                )}

                {/* Send by email button */}
                <button
                  onClick={handleSendEmail}
                  disabled={sending || !selectedContract.sponsors?.contact_email}
                  className="btn-primary disabled:opacity-50 flex-shrink-0"
                >
                  {sending ? 'Sending...' : `Send to ${selectedContract.sponsors?.company_name}`}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
