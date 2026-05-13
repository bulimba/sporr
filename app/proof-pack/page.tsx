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
  start_date: string
  end_date: string
  sponsors: {
    id: string
    company_name: string
    contact_email: string | null
    contact_name: string | null
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

type SeasonMetrics = {
  total_fixtures: string
  total_attendance: string
  social_posts: string
  social_impressions: string
  media_coverage: string
  thank_you_message: string
  club_contact_name: string
  renewal_package: string
  renewal_value_nok: string
  cpm_rate: string
}

const defaultMetrics: SeasonMetrics = {
  total_fixtures: '',
  total_attendance: '',
  social_posts: '',
  social_impressions: '',
  media_coverage: '',
  thank_you_message: '',
  club_contact_name: '',
  renewal_package: '',
  renewal_value_nok: '',
  cpm_rate: '50',
}

export default function ProofPackPage() {
  const router = useRouter()
  const supabase = createClient()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [orgName, setOrgName] = useState('')
  const [metrics, setMetrics] = useState<SeasonMetrics>(defaultMetrics)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingObligations, setLoadingObligations] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateMetric = (field: keyof SeasonMetrics, value: string) =>
    setMetrics(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: userData } = await supabase.from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      const { data: orgData } = await supabase.from('organisations').select('name').eq('id', userData.org_id).single()
      setOrgName(orgData?.name || '')
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, title, season, value_nok, start_date, end_date, sponsors(id, company_name, contact_email, contact_name)')
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
    setMetrics(defaultMetrics)
    setStep(1)
    if (contract) loadObligations(contractId)
  }

  async function handleSendEmail() {
    if (!selectedContract || !selectedContract.sponsors?.contact_email) {
      setError('No sponsor email on file.')
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
          narrative: metrics.thank_you_message,
          obligations,
          metrics,
        }),
      })
      if (!response.ok) {
        const err = await response.json()
        setError(err.error || 'Failed to send.')
        setSending(false)
        return
      }
      setSent(true)
      setSending(false)
    } catch {
      setError('Network error.')
      setSending(false)
    }
  }

  const delivered = obligations.filter(o => o.status === 'delivered')
  const pending = obligations.filter(o => o.status === 'pending')
  const deliveryScore = obligations.length > 0 ? Math.round((delivered.length / obligations.length) * 100) : 0
  const totalAttendance = parseInt(metrics.total_attendance) || 0
  const totalImpressions = parseInt(metrics.social_impressions) || 0
  const totalReach = totalAttendance + totalImpressions
  const contractValue = selectedContract?.value_nok || 0
  const costPerPerson = totalAttendance > 0 ? (contractValue / totalAttendance).toFixed(0) : null
  const estimatedMediaValue = totalImpressions > 0 ? Math.round(totalImpressions * (parseInt(metrics.cpm_rate) || 50) / 1000) : 0
  const roiMultiple = contractValue > 0 && estimatedMediaValue > 0 ? (estimatedMediaValue / contractValue).toFixed(1) : null
  const renewalValue = parseInt(metrics.renewal_value_nok) || 0
  const renewalUplift = contractValue > 0 && renewalValue > 0 ? Math.round(((renewalValue - contractValue) / contractValue) * 100) : null
  const photoProofs = delivered.filter(o => o.proofs[0]?.photo_url)
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const nok = (val: number) => `Kr ${val.toLocaleString('nb-NO')}`

  if (loading) {
    return (
      <main className="min-h-screen bg-sporr-cream flex items-center justify-center">
        <div className="text-sporr-muted text-sm">Loading...</div>
      </main>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; margin: 0; padding: 0; }
          @page { margin: 0; size: A4; }
        }
        .print-only { display: none; }
      `}</style>

      <main className="min-h-screen bg-sporr-cream no-print">
        <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" />
          </Link>
          <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">← Dashboard</Link>
        </nav>

        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h1 className="text-sporr-dark text-2xl font-medium mb-1">Proof Pack</h1>
            <p className="text-sporr-muted text-sm">Build a professional proof of performance report for your sponsor</p>
          </div>

          <div className="card mb-6">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">Select contract</h2>
            <select className="input" value={selectedContract?.id || ''} onChange={e => handleSelectContract(e.target.value)}>
              <option value="">Choose a contract...</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.title} — {c.sponsors?.company_name}</option>)}
            </select>
          </div>

          {selectedContract && !loadingObligations && (
            <>
              <div className="flex gap-2 mb-8">
                {['Season metrics', 'Message & renewal', 'Review & send'].map((label, i) => (
                  <div key={i} className="flex-1">
                    <div className={`h-1.5 rounded-full mb-2 ${step > i + 1 ? 'bg-sporr-dark' : step === i + 1 ? 'bg-sporr-sage' : 'bg-sporr-sage-lt'}`} />
                    <p className={`text-xs ${step === i + 1 ? 'text-sporr-dark font-medium' : 'text-sporr-muted'}`}>{label}</p>
                  </div>
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <div className="card">
                    <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Season at a glance</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Total fixtures / events</label>
                        <input className="input" type="number" placeholder="14" value={metrics.total_fixtures} onChange={e => updateMetric('total_fixtures', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Total season attendance</label>
                        <input className="input" type="number" placeholder="8400" value={metrics.total_attendance} onChange={e => updateMetric('total_attendance', e.target.value)} />
                        <p className="text-sporr-muted text-xs mt-1">Combined across all match days</p>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Audience & exposure</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Social media posts for sponsor</label>
                        <input className="input" type="number" placeholder="24" value={metrics.social_posts} onChange={e => updateMetric('social_posts', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Estimated social impressions</label>
                        <input className="input" type="number" placeholder="45000" value={metrics.social_impressions} onChange={e => updateMetric('social_impressions', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="label">Media coverage (optional)</label>
                        <input className="input" placeholder="Local newspaper, club website, regional TV..." value={metrics.media_coverage} onChange={e => updateMetric('media_coverage', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">CPM rate for value calculation (NOK)</label>
                        <input className="input" type="number" placeholder="50" value={metrics.cpm_rate} onChange={e => updateMetric('cpm_rate', e.target.value)} />
                        <p className="text-sporr-muted text-xs mt-1">Used to calculate estimated media value</p>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">Delivery summary</h2>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-sporr-sage-lt rounded-lg p-4 text-center">
                        <p className="text-sporr-dark text-3xl font-medium">{obligations.length}</p>
                        <p className="text-sporr-muted text-xs uppercase tracking-widest mt-1">Contracted</p>
                      </div>
                      <div className="bg-sporr-sage-lt rounded-lg p-4 text-center">
                        <p className="text-sporr-dark text-3xl font-medium">{delivered.length}</p>
                        <p className="text-sporr-muted text-xs uppercase tracking-widest mt-1">Delivered</p>
                      </div>
                      <div className="bg-sporr-dark rounded-lg p-4 text-center">
                        <p className="text-sporr-cream text-3xl font-medium">{deliveryScore}%</p>
                        <p className="text-sporr-sage text-xs uppercase tracking-widest mt-1">Score</p>
                      </div>
                    </div>
                    <div className="h-2 bg-sporr-sage-lt rounded-full overflow-hidden">
                      <div className="h-full bg-sporr-dark rounded-full" style={{ width: `${deliveryScore}%` }} />
                    </div>
                  </div>

                  <button onClick={() => setStep(2)} className="btn-primary w-full">Continue →</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="card">
                    <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Personal message</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="label">Your name</label>
                        <input className="input" placeholder="Club sponsorship manager" value={metrics.club_contact_name} onChange={e => updateMetric('club_contact_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Thank you message to sponsor</label>
                        <textarea className="input h-36 resize-none" placeholder={`Thank ${selectedContract.sponsors?.company_name} for their support...`} value={metrics.thank_you_message} onChange={e => updateMetric('thank_you_message', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Renewal proposal</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="label">Proposed package for next season</label>
                        <textarea className="input h-24 resize-none" placeholder="Describe what you are offering for renewal..." value={metrics.renewal_package} onChange={e => updateMetric('renewal_package', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Proposed investment (NOK)</label>
                        <input className="input" type="number" placeholder={String(Math.round(contractValue * 1.1))} value={metrics.renewal_value_nok} onChange={e => updateMetric('renewal_value_nok', e.target.value)} />
                        {renewalUplift !== null && (
                          <p className="text-sporr-muted text-xs mt-1">
                            {renewalUplift > 0 ? `${renewalUplift}% increase on current season` : renewalUplift < 0 ? `${Math.abs(renewalUplift)}% reduction` : 'Same as current season'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                    <button onClick={() => setStep(3)} className="btn-primary flex-1">Review →</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="card">
                    <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Ready to send</h2>
                    <div className="space-y-3">
                      {[
                        ['Contract', selectedContract.title],
                        ['Sponsor', selectedContract.sponsors?.company_name || '—'],
                        ['Send to', selectedContract.sponsors?.contact_email || '⚠ No email on file'],
                        ['Season', selectedContract.season],
                        ['Delivery score', `${deliveryScore}% (${delivered.length} of ${obligations.length})`],
                        ['Total attendance', totalAttendance > 0 ? totalAttendance.toLocaleString() : '—'],
                        ['Estimated reach', totalReach > 0 ? totalReach.toLocaleString() : '—'],
                        ['Contract value', contractValue > 0 ? nok(contractValue) : '—'],
                        ['Proposed renewal', renewalValue > 0 ? nok(renewalValue) : '—'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center py-2 border-b border-sporr-sage-lt last:border-0">
                          <span className="text-sporr-muted text-sm">{label}</span>
                          <span className="text-sporr-dark text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

                  {sent ? (
                    <div className="card text-center py-8">
                      <div className="text-4xl mb-4">✓</div>
                      <p className="text-sporr-dark font-medium text-lg mb-2">Proof Pack sent</p>
                      <p className="text-sporr-muted text-sm">{selectedContract.sponsors?.company_name} will receive it shortly.</p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
                      <button onClick={() => window.print()} className="btn-secondary flex-1">Download PDF</button>
                      <button onClick={handleSendEmail} disabled={sending || !selectedContract.sponsors?.contact_email} className="btn-primary flex-1 disabled:opacity-50">
                        {sending ? 'Sending...' : 'Send to sponsor'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedContract && (
        <div className="print-only" style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#111814', background: 'white', width: '210mm', margin: '0 auto' }}>

          {/* COVER PAGE */}
          <div style={{ background: '#13322A', width: '210mm', minHeight: '297mm', padding: '48px', pageBreakAfter: 'always', boxSizing: 'border-box' }}>

            {/* Logo row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1D4A38', paddingBottom: '24px', marginBottom: '48px' }}>
              <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" style={{ height: '36px', width: 'auto' }} alt="Sporr" />
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#808C70', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 3px' }}>Proof of Performance Report</p>
                <p style={{ color: '#F5F1E6', fontSize: '11px', margin: 0 }}>{dateStr}</p>
              </div>
            </div>

            {/* Prepared for */}
            <p style={{ color: '#808C70', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 10px' }}>Prepared for</p>
            <h1 style={{ color: '#F5F1E6', fontSize: '40px', fontWeight: '700', margin: '0 0 8px', lineHeight: 1.1 }}>{selectedContract.sponsors?.company_name}</h1>
            <p style={{ color: '#808C70', fontSize: '16px', margin: '0 0 4px' }}>{orgName}</p>
            <p style={{ color: '#5C6B63', fontSize: '13px', margin: '0 0 48px' }}>{selectedContract.title} · {selectedContract.season}</p>

            {/* Delivery score box */}
            <div style={{ background: '#808C70', borderRadius: '10px', padding: '24px 32px', display: 'inline-block', marginBottom: '32px' }}>
              <p style={{ color: 'white', fontSize: '56px', fontWeight: '700', margin: '0 0 6px', lineHeight: 1 }}>{deliveryScore}%</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', textTransform: 'uppercase', margin: 0 }}>Delivery score</p>
            </div>

            {/* Key stats — stacked */}
            <div style={{ marginBottom: '48px' }}>
              <div style={{ borderBottom: '1px solid #1D4A38', paddingBottom: '12px', marginBottom: '12px' }}>
                <p style={{ color: '#808C70', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 4px' }}>Obligations delivered</p>
                <p style={{ color: '#F5F1E6', fontSize: '24px', fontWeight: '700', margin: 0 }}>{delivered.length} of {obligations.length}</p>
              </div>
              {totalAttendance > 0 && (
                <div style={{ borderBottom: '1px solid #1D4A38', paddingBottom: '12px', marginBottom: '12px' }}>
                  <p style={{ color: '#808C70', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 4px' }}>Season attendance</p>
                  <p style={{ color: '#F5F1E6', fontSize: '24px', fontWeight: '700', margin: 0 }}>{totalAttendance.toLocaleString()}</p>
                </div>
              )}
              {totalReach > 0 && (
                <div style={{ borderBottom: '1px solid #1D4A38', paddingBottom: '12px', marginBottom: '12px' }}>
                  <p style={{ color: '#808C70', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 4px' }}>Total estimated reach</p>
                  <p style={{ color: '#F5F1E6', fontSize: '24px', fontWeight: '700', margin: 0 }}>{totalReach.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Delivery progress bar */}
            <div style={{ marginBottom: '8px' }}>
              <p style={{ color: '#808C70', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 8px' }}>Delivery rate — {deliveryScore}%</p>
<table style={{ width: '100%', borderCollapse: 'collapse', height: '8px' }}>
  <tbody>
    <tr>
      <td style={{ background: '#808C70', width: `${deliveryScore}%`, borderRadius: '3px 0 0 3px' }}></td>
      <td style={{ background: '#1D4A38', width: `${100 - deliveryScore}%`, borderRadius: '0 3px 3px 0' }}></td>
    </tr>
  </tbody>
</table>
            </div>

            {/* Cover footer */}
            <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #1D4A38', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#5C6B63', fontSize: '10px' }}>Sporr — proof of performance made easy</span>
              <span style={{ color: '#5C6B63', fontSize: '10px' }}>sporr.io</span>
            </div>
          </div>

                    {/* PAGE 2: THANK YOU + SEASON SUMMARY */}
          <div style={{ padding: '48px', pageBreakAfter: 'always', position: 'relative', boxSizing: 'border-box', minHeight: '297mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #13322A', paddingBottom: '14px', marginBottom: '40px' }}>
              <span style={{ color: '#13322A', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700' }}>{orgName}</span>
              <span style={{ color: '#808C70', fontSize: '10px' }}>Sporr — proof of performance made easy</span>
              <span style={{ color: '#5C6B63', fontSize: '10px' }}>{selectedContract.sponsors?.company_name}</span>
            </div>

            {metrics.thank_you_message && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#13322A', fontSize: '20px', fontWeight: '700', margin: '0 0 20px' }}>A message from {orgName}</h2>
                <div style={{ background: '#F7F5EF', borderLeft: '5px solid #13322A', padding: '24px 28px', borderRadius: '0 8px 8px 0' }}>
                  <p style={{ color: '#2D3830', fontSize: '13px', lineHeight: '1.8', margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>{metrics.thank_you_message}</p>
                  {metrics.club_contact_name && <p style={{ color: '#5C6B63', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>— {metrics.club_contact_name}, {orgName}</p>}
                </div>
              </div>
            )}

            <h2 style={{ color: '#13322A', fontSize: '20px', fontWeight: '700', margin: '0 0 20px' }}>Season at a glance</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              {[
                { num: metrics.total_fixtures || '—', label: 'Fixtures' },
                { num: obligations.length, label: 'Obligations contracted' },
                { num: delivered.length, label: 'Obligations delivered' },
                { num: `${deliveryScore}%`, label: 'Delivery score', dark: true },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: s.dark ? '#13322A' : '#EEF0E8', borderRadius: '8px', padding: '20px 16px', textAlign: 'center' }}>
                  <p style={{ color: s.dark ? '#F5F1E6' : '#13322A', fontSize: '32px', fontWeight: '700', margin: 0, lineHeight: 1 }}>{s.num}</p>
                  <p style={{ color: s.dark ? '#808C70' : '#5C6B63', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', margin: '8px 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#EEF0E8', borderRadius: '4px', height: '8px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ background: '#13322A', height: '100%', width: `${deliveryScore}%`, borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: '#5C6B63', fontSize: '10px' }}>0%</span>
              <span style={{ color: '#13322A', fontSize: '10px', fontWeight: '700' }}>{deliveryScore}% delivered</span>
              <span style={{ color: '#5C6B63', fontSize: '10px' }}>100%</span>
            </div>

            <div style={{ position: 'absolute', bottom: '24px', left: '48px', right: '48px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EEF0E8', paddingTop: '12px' }}>
              <span style={{ color: '#5C6B63', fontSize: '9px' }}>Sporr — proof of performance made easy · sporr.io</span>
              <span style={{ color: '#808C70', fontSize: '9px', fontWeight: '700' }}>Page 2</span>
            </div>
          </div>

          {/* PAGE 3: AUDIENCE & ROI */}
          {(totalAttendance > 0 || totalImpressions > 0 || metrics.media_coverage) && (
            <div style={{ padding: '48px', pageBreakAfter: 'always', position: 'relative', boxSizing: 'border-box', minHeight: '297mm' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #13322A', paddingBottom: '14px', marginBottom: '40px' }}>
                <span style={{ color: '#13322A', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700' }}>{orgName}</span>
                <span style={{ color: '#808C70', fontSize: '10px' }}>Sporr — proof of performance made easy</span>
                <span style={{ color: '#5C6B63', fontSize: '10px' }}>{selectedContract.sponsors?.company_name}</span>
              </div>

              <h2 style={{ color: '#13322A', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>Audience & exposure</h2>
              <p style={{ color: '#5C6B63', fontSize: '12px', margin: '0 0 28px' }}>Your brand reached real people across {selectedContract.season}</p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                {totalAttendance > 0 && (
                  <div style={{ flex: 1, border: '2px solid #EEF0E8', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                    <p style={{ color: '#13322A', fontSize: '36px', fontWeight: '700', margin: 0, lineHeight: 1 }}>{totalAttendance.toLocaleString()}</p>
                    <p style={{ color: '#5C6B63', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', margin: '8px 0 0' }}>Live attendance</p>
                    {metrics.total_fixtures && <p style={{ color: '#808C70', fontSize: '10px', margin: '4px 0 0' }}>across {metrics.total_fixtures} fixtures</p>}
                  </div>
                )}
                {totalImpressions > 0 && (
                  <div style={{ flex: 1, border: '2px solid #EEF0E8', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                    <p style={{ color: '#13322A', fontSize: '36px', fontWeight: '700', margin: 0, lineHeight: 1 }}>{totalImpressions.toLocaleString()}</p>
                    <p style={{ color: '#5C6B63', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', margin: '8px 0 0' }}>Social impressions</p>
                    {metrics.social_posts && <p style={{ color: '#808C70', fontSize: '10px', margin: '4px 0 0' }}>from {metrics.social_posts} posts</p>}
                  </div>
                )}
                {totalReach > 0 && (
                  <div style={{ flex: 1, background: '#13322A', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                    <p style={{ color: '#F5F1E6', fontSize: '36px', fontWeight: '700', margin: 0, lineHeight: 1 }}>{totalReach.toLocaleString()}</p>
                    <p style={{ color: '#808C70', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', margin: '8px 0 0' }}>Total estimated reach</p>
                  </div>
                )}
              </div>

              <h2 style={{ color: '#13322A', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>ROI & performance metrics</h2>
              <p style={{ color: '#5C6B63', fontSize: '12px', margin: '0 0 24px' }}>The commercial value your investment generated</p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {contractValue > 0 && (
                  <div style={{ flex: 1, background: '#F7F5EF', borderRadius: '8px', padding: '20px' }}>
                    <p style={{ color: '#5C6B63', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>Investment</p>
                    <p style={{ color: '#13322A', fontSize: '24px', fontWeight: '700', margin: 0 }}>{nok(contractValue)}</p>
                  </div>
                )}
                {costPerPerson && (
                  <div style={{ flex: 1, background: '#F7F5EF', borderRadius: '8px', padding: '20px' }}>
                    <p style={{ color: '#5C6B63', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>Cost per audience member</p>
                    <p style={{ color: '#13322A', fontSize: '24px', fontWeight: '700', margin: 0 }}>Kr {parseInt(costPerPerson).toLocaleString()}</p>
                  </div>
                )}
                {estimatedMediaValue > 0 && (
                  <div style={{ flex: 1, background: '#13322A', borderRadius: '8px', padding: '20px' }}>
                    <p style={{ color: '#808C70', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>Estimated media value</p>
                    <p style={{ color: '#F5F1E6', fontSize: '24px', fontWeight: '700', margin: 0 }}>{nok(estimatedMediaValue)}</p>
                    {roiMultiple && <p style={{ color: '#808C70', fontSize: '10px', margin: '4px 0 0' }}>{roiMultiple}× return on investment</p>}
                  </div>
                )}
              </div>

              {metrics.media_coverage && (
                <div style={{ background: '#EEF0E8', borderRadius: '8px', padding: '20px' }}>
                  <p style={{ color: '#13322A', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 8px' }}>Media coverage</p>
                  <p style={{ color: '#2D3830', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{metrics.media_coverage}</p>
                </div>
              )}

              <div style={{ position: 'absolute', bottom: '24px', left: '48px', right: '48px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EEF0E8', paddingTop: '12px' }}>
                <span style={{ color: '#5C6B63', fontSize: '9px' }}>Sporr — proof of performance made easy · sporr.io</span>
                <span style={{ color: '#808C70', fontSize: '9px', fontWeight: '700' }}>Page 3</span>
              </div>
            </div>
          )}

          {/* PAGE 4: DELIVERABLES CHECKLIST */}
          <div style={{ padding: '48px', pageBreakAfter: photoProofs.length > 0 ? 'always' : 'avoid', position: 'relative', boxSizing: 'border-box', minHeight: '297mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #13322A', paddingBottom: '14px', marginBottom: '40px' }}>
              <span style={{ color: '#13322A', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700' }}>{orgName}</span>
              <span style={{ color: '#808C70', fontSize: '10px' }}>Sporr — proof of performance made easy</span>
              <span style={{ color: '#5C6B63', fontSize: '10px' }}>{selectedContract.sponsors?.company_name}</span>
            </div>

            <h2 style={{ color: '#13322A', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>Deliverables — promised vs delivered</h2>
            <p style={{ color: '#5C6B63', fontSize: '12px', margin: '0 0 24px' }}>A verified record of every commitment made and kept</p>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', background: '#13322A', borderRadius: '6px 6px 0 0', padding: '10px 16px' }}>
                <span style={{ color: '#F5F1E6', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', flex: 1 }}>Obligation</span>
                <span style={{ color: '#F5F1E6', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', width: '80px', textAlign: 'center' }}>Proof type</span>
                <span style={{ color: '#F5F1E6', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', width: '80px', textAlign: 'right' }}>Status</span>
              </div>
              {obligations.map((ob, i) => (
                <div key={ob.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: i % 2 === 0 ? '#F7F5EF' : 'white', borderLeft: '1px solid #EEF0E8', borderRight: '1px solid #EEF0E8', borderBottom: '1px solid #EEF0E8', borderRadius: i === obligations.length - 1 ? '0 0 6px 6px' : 0 }}>
                  <span style={{ color: '#13322A', fontSize: '12px', flex: 1, fontWeight: ob.status === 'delivered' ? '600' : '400' }}>{ob.description}</span>
                  <span style={{ color: '#808C70', fontSize: '11px', width: '80px', textAlign: 'center', textTransform: 'capitalize' }}>{ob.proof_type}</span>
                  <span style={{ width: '80px', textAlign: 'right' }}>
                    {ob.status === 'delivered'
                      ? <span style={{ background: '#13322A', color: '#F5F1E6', fontSize: '9px', fontWeight: '700', padding: '3px 8px', borderRadius: '3px' }}>✓ DONE</span>
                      : ob.status === 'not_applicable'
                      ? <span style={{ background: '#EEF0E8', color: '#5C6B63', fontSize: '9px', padding: '3px 8px', borderRadius: '3px' }}>N/A</span>
                      : <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '9px', padding: '3px 8px', borderRadius: '3px' }}>PENDING</span>
                    }
                  </span>
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', padding: '12px 16px', marginBottom: '24px' }}>
                <p style={{ color: '#92400E', fontSize: '11px', margin: 0 }}>
                  <strong>{pending.length} obligation{pending.length > 1 ? 's' : ''} pending</strong> — {orgName} is committed to completing {pending.length > 1 ? 'these deliverables' : 'this deliverable'} as agreed.
                </p>
              </div>
            )}

            <div style={{ position: 'absolute', bottom: '24px', left: '48px', right: '48px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EEF0E8', paddingTop: '12px' }}>
              <span style={{ color: '#5C6B63', fontSize: '9px' }}>Sporr — proof of performance made easy · sporr.io</span>
              <span style={{ color: '#808C70', fontSize: '9px', fontWeight: '700' }}>Page 4</span>
            </div>
          </div>

          {/* PAGE 5: VISUAL EVIDENCE */}
          {photoProofs.length > 0 && (
            <div style={{ padding: '48px', pageBreakAfter: (metrics.renewal_package || renewalValue > 0) ? 'always' : 'avoid', position: 'relative', boxSizing: 'border-box', minHeight: '297mm' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #13322A', paddingBottom: '14px', marginBottom: '40px' }}>
                <span style={{ color: '#13322A', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700' }}>{orgName}</span>
                <span style={{ color: '#808C70', fontSize: '10px' }}>Sporr — proof of performance made easy</span>
                <span style={{ color: '#5C6B63', fontSize: '10px' }}>{selectedContract.sponsors?.company_name}</span>
              </div>

              <h2 style={{ color: '#13322A', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>Visual evidence</h2>
              <p style={{ color: '#5C6B63', fontSize: '12px', margin: '0 0 28px' }}>Geo-tagged, timestamped proof captured on match day by {orgName} volunteers</p>

              {photoProofs[0] && (
                <div style={{ marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #EEF0E8' }}>
                  <img src={photoProofs[0].proofs[0].photo_url!} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} alt="Proof" />
                  <div style={{ padding: '12px 16px', background: '#F7F5EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#13322A', fontSize: '12px', fontWeight: '600' }}>{photoProofs[0].description}</span>
                    <span style={{ color: '#5C6B63', fontSize: '10px' }}>
                      {photoProofs[0].proofs[0].captured_at && new Date(photoProofs[0].proofs[0].captured_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {photoProofs[0].proofs[0].geo_lat && ` · ${photoProofs[0].proofs[0].geo_lat.toFixed(3)}\u00b0N`}
                    </span>
                  </div>
                </div>
              )}

              {photoProofs.length > 1 && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  {photoProofs.slice(1, 4).map((ob, i) => (
                    <div key={i} style={{ flex: '1 1 calc(33% - 8px)', borderRadius: '6px', overflow: 'hidden', border: '1px solid #EEF0E8' }}>
                      <img src={ob.proofs[0].photo_url!} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} alt="Proof" />
                      <div style={{ padding: '8px 10px', background: '#F7F5EF' }}>
                        <p style={{ color: '#13322A', fontSize: '9px', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ob.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ position: 'absolute', bottom: '24px', left: '48px', right: '48px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EEF0E8', paddingTop: '12px' }}>
                <span style={{ color: '#5C6B63', fontSize: '9px' }}>Sporr — proof of performance made easy · sporr.io</span>
                <span style={{ color: '#808C70', fontSize: '9px', fontWeight: '700' }}>Page 5</span>
              </div>
            </div>
          )}

          {/* FINAL PAGE: RENEWAL */}
          {(metrics.renewal_package || renewalValue > 0) && (
            <div style={{ padding: '48px', position: 'relative', boxSizing: 'border-box', minHeight: '297mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #13322A', paddingBottom: '14px', marginBottom: '40px' }}>
                <span style={{ color: '#13322A', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700' }}>{orgName}</span>
                <span style={{ color: '#808C70', fontSize: '10px' }}>Sporr — proof of performance made easy</span>
                <span style={{ color: '#5C6B63', fontSize: '10px' }}>{selectedContract.sponsors?.company_name}</span>
              </div>

              <h2 style={{ color: '#13322A', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>Next season — renewal proposal</h2>
              <p style={{ color: '#5C6B63', fontSize: '12px', margin: '0 0 32px' }}>Building on a successful {deliveryScore}% delivery rate</p>

              {contractValue > 0 && renewalValue > 0 && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ flex: 1, border: '2px solid #EEF0E8', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                    <p style={{ color: '#808C70', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>Current season</p>
                    <p style={{ color: '#13322A', fontSize: '28px', fontWeight: '700', margin: '0 0 4px' }}>{nok(contractValue)}</p>
                    <p style={{ color: '#5C6B63', fontSize: '11px', margin: 0 }}>{selectedContract.season}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#808C70', fontSize: '24px' }}>→</div>
                  <div style={{ flex: 1, background: '#13322A', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                    <p style={{ color: '#808C70', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>Proposed renewal</p>
                    <p style={{ color: '#F5F1E6', fontSize: '28px', fontWeight: '700', margin: '0 0 4px' }}>{nok(renewalValue)}</p>
                    {renewalUplift !== null && <p style={{ color: '#808C70', fontSize: '11px', margin: 0 }}>{renewalUplift > 0 ? `+${renewalUplift}% on current` : renewalUplift < 0 ? `${renewalUplift}% on current` : 'Same as current'}</p>}
                  </div>
                </div>
              )}

              {roiMultiple && (
                <div style={{ background: '#EEF0E8', borderRadius: '8px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'center', minWidth: '80px' }}>
                    <p style={{ color: '#13322A', fontSize: '36px', fontWeight: '700', margin: 0, lineHeight: 1 }}>{roiMultiple}×</p>
                    <p style={{ color: '#5C6B63', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', margin: '4px 0 0' }}>ROI</p>
                  </div>
                  <p style={{ color: '#2D3830', fontSize: '13px', lineHeight: '1.6', margin: 0, flex: 1 }}>
                    Based on an estimated media value of {nok(estimatedMediaValue)} against an investment of {nok(contractValue)}, your sponsorship of {orgName} delivered an estimated {roiMultiple}× return on investment this season.
                  </p>
                </div>
              )}

              {metrics.renewal_package && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: '#13322A', fontSize: '13px', fontWeight: '700', margin: '0 0 12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Proposed package</h3>
                  <div style={{ background: '#F7F5EF', borderLeft: '5px solid #808C70', padding: '20px 24px', borderRadius: '0 8px 8px 0' }}>
                    <p style={{ color: '#2D3830', fontSize: '13px', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>{metrics.renewal_package}</p>
                  </div>
                </div>
              )}

              <div style={{ flex: 1 }} />
              <div style={{ background: '#13322A', borderRadius: '8px', padding: '28px 32px', textAlign: 'center' }}>
                <p style={{ color: '#808C70', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 8px' }}>Next steps</p>
                <p style={{ color: '#F5F1E6', fontSize: '16px', fontWeight: '700', margin: '0 0 8px' }}>We would love to continue this partnership</p>
                <p style={{ color: '#808C70', fontSize: '12px', margin: '0 0 16px' }}>Please reach out to {metrics.club_contact_name || orgName} to confirm your renewal for the upcoming season.</p>
                <p style={{ color: '#5C6B63', fontSize: '11px', margin: 0, fontStyle: 'italic' }}>This proposal was generated automatically by Sporr · sporr.io</p>
              </div>

              <div style={{ position: 'absolute', bottom: '24px', left: '48px', right: '48px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EEF0E8', paddingTop: '12px' }}>
                <span style={{ color: '#5C6B63', fontSize: '9px' }}>Sporr — proof of performance made easy · sporr.io</span>
                <span style={{ color: '#808C70', fontSize: '9px', fontWeight: '700' }}>Final page</span>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  )
}
