'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const printRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: userData } = await supabase
        .from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }

      const { data: orgData } = await supabase
        .from('organisations').select('name').eq('id', userData.org_id).single()
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
    load()
  }, [])

  async function loadObligations(contractId: string) {
    setLoadingObligations(true)
    const { data } = await supabase
      .from('obligations')
      .select('id, description, proof_type, status, proofs(id, photo_url, external_link, note, captured_at, geo_lat, geo_lng)')
      .eq('contract_id', contractId)
    setObligations((data as unknown as Obligation[]) || [])
    setLoadingObligations(false)
  }

  function handleSelectContract(contractId: string) {
    const contract = contracts.find(c => c.id === contractId) || null
    setSelectedContract(contract)
    setSent(false)
    setError(null)
    setNarrative('')
    if (contract) loadObligations(contractId)
  }

  function handlePrint() {
    window.print()
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
    } catch {
      setError('Network error. Please try again.')
      setSending(false)
    }
  }

  const delivered = obligations.filter(o => o.status === 'delivered')
  const deliveryScore = obligations.length > 0
    ? Math.round((delivered.length / obligations.length) * 100)
    : 0
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <main className="min-h-screen bg-sporr-cream flex items-center justify-center">
        <div className="text-sporr-muted text-sm">Loading...</div>
      </main>
    )
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
          .print-page { 
            padding: 0;
            margin: 0;
          }
        }
        .print-only { display: none; }
      `}</style>

      {/* Screen UI */}
      <main className="min-h-screen bg-sporr-cream no-print">
        <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <img
              src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
              alt="Sporr" className="h-20"
            />
          </Link>
          <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">
            ← Dashboard
          </Link>
        </nav>

        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h1 className="text-sporr-dark text-2xl font-medium mb-1">Proof Pack</h1>
            <p className="text-sporr-muted text-sm">Generate and send a proof of delivery report to your sponsor</p>
          </div>

          {/* Step 1 */}
          <div className="card mb-6">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">1. Select a contract</h2>
            {contracts.length === 0 ? (
              <p className="text-sporr-muted text-sm">No active contracts. <Link href="/dashboard/contracts" className="text-sporr-dark underline">Add a contract</Link></p>
            ) : (
              <select className="input" value={selectedContract?.id || ''} onChange={e => handleSelectContract(e.target.value)}>
                <option value="">Select a contract...</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>{c.title} — {c.sponsors?.company_name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2 */}
          {selectedContract && (
            <div className="card mb-6">
              <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">2. Delivery summary</h2>
              {loadingObligations ? (
                <p className="text-sporr-muted text-sm">Loading...</p>
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
                          ob.status === 'delivered' ? 'bg-sporr-dark text-sporr-cream' :
                          ob.status === 'not_applicable' ? 'bg-sporr-light text-sporr-muted border border-sporr-sage-lt' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {ob.status === 'delivered' ? '✓ Delivered' : ob.status === 'not_applicable' ? 'Skipped' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3 */}
          {selectedContract && !loadingObligations && (
            <div className="card mb-6">
              <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">3. Season summary (optional)</h2>
              <textarea
                className="input h-28 resize-none"
                placeholder="Write a short summary of the season partnership — highlights, attendance figures, special moments."
                value={narrative}
                onChange={e => setNarrative(e.target.value)}
              />
            </div>
          )}

          {/* Step 4 */}
          {selectedContract && !loadingObligations && (
            <div className="card">
              <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">4. Send or download</h2>
              {selectedContract.sponsors?.contact_email ? (
                <p className="text-sporr-muted text-sm mb-6">
                  Email will be sent to <span className="text-sporr-dark font-medium">{selectedContract.sponsors.contact_email}</span>
                </p>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6">
                  No email on file for {selectedContract.sponsors?.company_name}.{' '}
                  <Link href="/dashboard/sponsors" className="underline">Add one in Your Sponsors</Link>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
              )}

              {sent ? (
                <div className="bg-sporr-sage-lt border border-sporr-sage rounded-lg px-4 py-4 text-center">
                  <p className="text-sporr-dark font-medium mb-1">✓ Proof Pack sent</p>
                  <p className="text-sporr-muted text-sm">{selectedContract.sponsors?.company_name} will receive it shortly.</p>
                </div>
              ) : (
                <div className="flex gap-3 flex-wrap">
                  <button onClick={handlePrint} className="btn-secondary">
                    Download PDF
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={sending || !selectedContract.sponsors?.contact_email}
                    className="btn-primary disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : `Send to ${selectedContract.sponsors?.company_name}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Print view — only visible when printing */}
      {selectedContract && (
        <div className="print-only" ref={printRef} style={{
          fontFamily: 'Helvetica, Arial, sans-serif',
          color: '#111814',
          background: 'white',
          maxWidth: '210mm',
          margin: '0 auto',
          padding: '0',
        }}>
          {/* Cover */}
          <div style={{ background: '#13322A', padding: '48px', minHeight: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pageBreakAfter: 'always' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <img 
  src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
  style={{ height: '40px', width: 'auto' }}
  alt="Sporr"
/>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#808C70', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Prepared for</p>
                <p style={{ color: '#F5F1E6', fontSize: '16px', fontWeight: '700', margin: 0 }}>{selectedContract.sponsors?.company_name}</p>
              </div>
            </div>

            <div>
              <h1 style={{ color: '#F5F1E6', fontSize: '32px', fontWeight: '700', margin: '0 0 12px', lineHeight: '1.2' }}>{selectedContract.title}</h1>
              <p style={{ color: '#808C70', fontSize: '16px', margin: '0 0 8px' }}>{orgName}</p>
              <p style={{ color: '#5C6B63', fontSize: '13px', margin: '0 0 32px' }}>{selectedContract.season} · Generated {dateStr}</p>
              <div style={{ background: '#808C70', borderRadius: '8px', padding: '20px 28px', display: 'inline-block', textAlign: 'center' }}>
                <p style={{ color: 'white', fontSize: '48px', fontWeight: '700', margin: 0, lineHeight: 1 }}>{deliveryScore}%</p>
                <p style={{ color: 'white', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: '6px 0 0' }}>Delivery score</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1D4A38', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#5C6B63', fontSize: '11px' }}>{delivered.length} of {obligations.length} obligations delivered</span>
              <span style={{ color: '#5C6B63', fontSize: '11px' }}>sporr.io</span>
            </div>
          </div>

          {/* Summary page */}
          <div style={{ padding: '48px', pageBreakAfter: 'always' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EEF0E8', paddingBottom: '16px', marginBottom: '32px' }}>
              <div>
                <p style={{ color: '#13322A', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>{orgName}</p>
                <p style={{ color: '#5C6B63', fontSize: '11px', margin: '2px 0 0' }}>Proof of Delivery Report</p>
              </div>
              <span style={{ color: '#808C70', fontSize: '11px' }}>{selectedContract.sponsors?.company_name}</span>
            </div>

            <h2 style={{ color: '#13322A', fontSize: '18px', fontWeight: '700', margin: '0 0 24px' }}>Season summary</h2>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              {[
                { num: obligations.length, label: 'Total obligations' },
                { num: delivered.length, label: 'Delivered' },
                { num: `${deliveryScore}%`, label: 'Delivery score' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: '#EEF0E8', borderRadius: '6px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ color: '#13322A', fontSize: '32px', fontWeight: '700', margin: 0, lineHeight: 1 }}>{s.num}</p>
                  <p style={{ color: '#5C6B63', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', margin: '6px 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {narrative && (
              <div style={{ background: '#F7F5EF', borderLeft: '4px solid #808C70', padding: '16px 20px', borderRadius: '0 6px 6px 0', marginBottom: '32px' }}>
                <p style={{ color: '#2D3830', fontSize: '13px', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>{narrative}</p>
              </div>
            )}
          </div>

          {/* Obligation pages */}
          {delivered.map((ob, i) => (
            <div key={ob.id} style={{ padding: '48px', pageBreakAfter: i < delivered.length - 1 ? 'auto' : 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EEF0E8', paddingBottom: '16px', marginBottom: '32px' }}>
                <p style={{ color: '#13322A', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>{orgName} · Proof of delivery</p>
                <span style={{ color: '#808C70', fontSize: '11px' }}>{selectedContract.sponsors?.company_name}</span>
              </div>

              <div style={{ background: '#F7F5EF', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ color: '#13322A', fontSize: '16px', fontWeight: '700', margin: 0, flex: 1, marginRight: '16px' }}>{ob.description}</h3>
                  <span style={{ background: '#808C70', color: 'white', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '3px', flexShrink: 0 }}>Delivered</span>
                </div>

                {ob.proofs[0]?.captured_at && (
                  <p style={{ color: '#5C6B63', fontSize: '11px', margin: '0 0 12px' }}>
                    Captured: {new Date(ob.proofs[0].captured_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {ob.proofs[0].geo_lat && ` · ${ob.proofs[0].geo_lat.toFixed(4)}°N`}
                  </p>
                )}

                {ob.proofs[0]?.photo_url && (
                  <img src={ob.proofs[0].photo_url} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px' }} alt="Proof" />
                )}

                {ob.proofs[0]?.note && (
                  <div style={{ background: 'white', borderLeft: '3px solid #808C70', padding: '12px 16px', borderRadius: '0 4px 4px 0', marginTop: '12px' }}>
                    <p style={{ color: '#2D3830', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>{ob.proofs[0].note}</p>
                  </div>
                )}

                {ob.proofs[0]?.external_link && (
                  <div style={{ background: 'white', borderLeft: '3px solid #808C70', padding: '12px 16px', borderRadius: '0 4px 4px 0', marginTop: '12px' }}>
                    <p style={{ color: '#2D3830', fontSize: '12px', margin: 0 }}>Link: {ob.proofs[0].external_link}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #EEF0E8' }}>
                <span style={{ color: '#5C6B63', fontSize: '10px' }}>Obligation {i + 1} of {delivered.length}</span>
                <span style={{ color: '#808C70', fontSize: '10px', fontWeight: '700' }}>Generated by Sporr · sporr.io</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
