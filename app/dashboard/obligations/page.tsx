'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TIER_ORDER: Record<string, number> = {
  title: 0,      // Platinum
  principal: 1,  // Gold
  official: 2,   // Silver
  community: 3,  // Bronze
}

const TIER_LABELS: Record<string, string> = {
  title: 'Platinum',
  principal: 'Gold',
  official: 'Silver',
  community: 'Bronze',
}

const PROOF_TYPE_LABELS: Record<string, string> = {
  photo: 'Photo',
  link: 'Link',
  timestamp: 'Timestamp',
  note: 'Note',
}

const DELIVERY_CONTEXT_LABELS: Record<string, string> = {
  match_day: 'Match day',
  training: 'Training',
  digital: 'Digital',
  season_long: 'Season long',
  event: 'Event',
}

type Obligation = {
  id: string
  description: string | null
  proof_type: string
  status: string
  delivery_context: string
  contract_id: string
}

type SponsorGroup = {
  sponsor_id: string
  company_name: string
  sponsorship_tier: string
  contract_id: string
  contract_title: string
  delivery_context: string
  pending: Obligation[]
  delivered: number
  total: number
  next_event_date: string | null
}

export default function ObligationsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [sponsorGroups, setSponsorGroups] = useState<SponsorGroup[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fulfilling, setFulfilling] = useState<string | null>(null) // contract_id being fulfilled
  const [showAdHocForm, setShowAdHocForm] = useState(false)
  const [sponsors, setSponsors] = useState<{ id: string; company_name: string }[]>([])
  const [contracts, setContracts] = useState<{ id: string; title: string; sponsor_id: string; company_name: string }[]>([])
  const [adHocForm, setAdHocForm] = useState({
    contract_id: '',
    description: '',
    proof_type: 'photo',
    delivery_context: 'match_day',
  })
  const [savingAdHoc, setSavingAdHoc] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: userData } = await supabase
        .from('users').select('org_id').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      setOrgId(userData.org_id)

      // Fetch contracts with sponsor and tier info
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, title, sponsorship_tier, sponsor_id, delivery_context, sponsors(id, company_name)')
        .eq('org_id', userData.org_id)
        .eq('status', 'active')

      // Fetch sponsors independently so dropdown is always populated
      const { data: sponsorsData } = await supabase
        .from('sponsors')
        .select('id, company_name')
        .eq('org_id', userData.org_id)
        .order('company_name')

      // Fetch all obligations
      const { data: obligationsData } = await supabase
        .from('obligations')
        .select('id, description, proof_type, status, delivery_context, contract_id')
        .eq('org_id', userData.org_id)
        .neq('status', 'not_applicable')

      // Fetch next upcoming event per contract (via audit_sessions linked events)
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, starts_at, org_id')
        .eq('org_id', userData.org_id)
        .gte('starts_at', new Date().toISOString().split('T')[0])
        .order('starts_at', { ascending: true })
        .limit(1)

      const nextEventDate = eventsData?.[0]?.starts_at || null

      if (contractsData && obligationsData) {
        const groups: SponsorGroup[] = contractsData.map((contract: any) => {
          const contractObligations = (obligationsData as Obligation[]).filter(
            o => o.contract_id === contract.id
          )
          const pending = contractObligations.filter(o => o.status === 'pending')
          const delivered = contractObligations.filter(o => o.status === 'delivered').length

          return {
            sponsor_id: contract.sponsor_id,
            company_name: contract.sponsors?.company_name || 'Unknown sponsor',
            sponsorship_tier: contract.sponsorship_tier || 'community',
            contract_id: contract.id,
            contract_title: contract.title,
            delivery_context: contract.delivery_context || 'match_day',
            pending,
            delivered,
            total: contractObligations.length,
            next_event_date: nextEventDate,
          }
        })

        // Sort: tier first (platinum → bronze), then most pending obligations
        groups.sort((a, b) => {
          const tierDiff = (TIER_ORDER[a.sponsorship_tier] ?? 99) - (TIER_ORDER[b.sponsorship_tier] ?? 99)
          if (tierDiff !== 0) return tierDiff
          return b.pending.length - a.pending.length
        })

        setSponsorGroups(groups)
        setSponsors(sponsorsData || [])
        setContracts(contractsData.map((c: any) => ({
          id: c.id,
          title: c.title,
          sponsor_id: c.sponsor_id,
          company_name: c.sponsors?.company_name || 'Unknown',
        })))
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleFulfill(group: SponsorGroup) {
    if (!orgId || fulfilling) return
    setFulfilling(group.contract_id)

    // Create a session for this delivery context
    const { data: sessionData, error: sessionError } = await supabase
      .from('audit_sessions')
      .insert({
        org_id: orgId,
        status: 'active',
        delivery_context: group.pending[0]?.delivery_context || 'match_day',
      })
      .select().single()

    if (sessionError || !sessionData) {
      alert('Could not start session: ' + sessionError?.message)
      setFulfilling(null)
      return
    }

    router.push(`/audit/${sessionData.session_token}`)
  }

  async function handleSaveAdHoc() {
    if (!orgId || !adHocForm.contract_id || !adHocForm.description) return
    setSavingAdHoc(true)

    const { data, error } = await supabase
      .from('obligations')
      .insert({
        org_id: orgId,
        contract_id: adHocForm.contract_id,
        description: adHocForm.description,
        proof_type: adHocForm.proof_type,
        delivery_context: adHocForm.delivery_context,
        status: 'pending',
      })
      .select().single()

    if (error) { alert(error.message); setSavingAdHoc(false); return }

    // Add to the relevant sponsor group
    setSponsorGroups(prev => prev.map(g => {
      if (g.contract_id !== adHocForm.contract_id) return g
      return {
        ...g,
        pending: [...g.pending, data as Obligation],
        total: g.total + 1,
      }
    }))

    setAdHocForm({ contract_id: '', description: '', proof_type: 'photo', delivery_context: 'match_day' })
    setShowAdHocForm(false)
    setSavingAdHoc(false)
  }

  const totalPending = sponsorGroups.reduce((sum, g) => sum + g.pending.length, 0)
  const totalDelivered = sponsorGroups.reduce((sum, g) => sum + g.delivered, 0)
  const totalObligations = sponsorGroups.reduce((sum, g) => sum + g.total, 0)

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
          <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" />
        </Link>
        <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">← Dashboard</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-sporr-dark text-2xl font-medium mb-1">Obligations</h1>
            <p className="text-sporr-muted text-sm">
              {totalDelivered} of {totalObligations} fulfilled this season
              {totalPending > 0 && <span className="text-sporr-dark font-medium"> · {totalPending} pending</span>}
            </p>
          </div>
          <button
            onClick={() => setShowAdHocForm(!showAdHocForm)}
            className="btn-secondary text-sm"
          >
            + Add obligation
          </button>
        </div>

        {/* Season progress bar */}
        {totalObligations > 0 && (
          <div className="mb-8">
            <div className="h-1.5 bg-sporr-sage-lt rounded-full overflow-hidden">
              <div
                className="h-full bg-sporr-mid rounded-full transition-all duration-500"
                style={{ width: `${Math.round((totalDelivered / totalObligations) * 100)}%` }}
              />
            </div>
            <p className="text-[#6B7D72] text-xs mt-1.5">
              {Math.round((totalDelivered / totalObligations) * 100)}% of season obligations fulfilled
            </p>
          </div>
        )}

        {/* Ad-hoc obligation form */}
        {showAdHocForm && (
          <div className="card mb-6">
            <h2 className="text-sporr-dark text-sm font-medium mb-4">Add an obligation</h2>
            <p className="text-sporr-muted text-xs mb-4 leading-relaxed">
              Log additional sponsor exposure or activity outside the original contract terms.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Sponsor contract</label>
                <select
                  className="input"
                  value={adHocForm.contract_id}
                  onChange={e => setAdHocForm(p => ({ ...p, contract_id: e.target.value }))}
                >
                  <option value="">Select a contract...</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} — {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Proof type</label>
                <select
                  className="input"
                  value={adHocForm.proof_type}
                  onChange={e => setAdHocForm(p => ({ ...p, proof_type: e.target.value }))}
                >
                  <option value="photo">Photo</option>
                  <option value="link">Link</option>
                  <option value="timestamp">Timestamp</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <input
                  className="input"
                  placeholder="e.g. Extra banner placement at finals night"
                  value={adHocForm.description}
                  onChange={e => setAdHocForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">When is it delivered?</label>
                <select
                  className="input"
                  value={adHocForm.delivery_context}
                  onChange={e => setAdHocForm(p => ({ ...p, delivery_context: e.target.value }))}
                >
                  {Object.entries(DELIVERY_CONTEXT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveAdHoc}
                disabled={savingAdHoc || !adHocForm.contract_id || !adHocForm.description}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {savingAdHoc ? 'Saving...' : 'Add obligation'}
              </button>
              <button onClick={() => setShowAdHocForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {sponsorGroups.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-sporr-muted text-lg mb-2">No obligations yet</p>
            <p className="text-sporr-muted text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              Add sponsors and contracts first, then define what each sponsor expects in return.
            </p>
            <Link href="/dashboard/contracts" className="btn-primary">Go to contracts</Link>
          </div>
        )}

        {/* Sponsor obligation groups */}
        <div className="space-y-4">
          {sponsorGroups.map(group => {
            const pct = group.total > 0 ? Math.round((group.delivered / group.total) * 100) : 0
            const allDone = group.pending.length === 0

            return (
              <div
                key={group.contract_id}
                className="card"
                style={{ opacity: allDone ? 0.6 : 1 }}
              >
                {/* Sponsor header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sporr-dark font-medium">{group.company_name}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sporr-sage-lt text-sporr-dark">
                        {TIER_LABELS[group.sponsorship_tier] || group.sponsorship_tier}
                      </span>
                      {allDone && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sporr-mid text-sporr-cream">
                          All fulfilled ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[#6B7D72] text-xs">{group.contract_title}</p>
                  </div>

                  {/* Progress fraction */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sporr-dark text-sm font-medium">{group.delivered}/{group.total}</p>
                    <p className="text-[#6B7D72] text-xs">fulfilled</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-sporr-sage-lt rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: allDone ? '#4B9560' : '#13322A',
                    }}
                  />
                </div>

                {/* Pending obligations list */}
                {group.pending.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {group.pending.map(ob => (
                      <div
                        key={ob.id}
                        className="flex items-center justify-between bg-sporr-light rounded-lg px-4 py-3"
                      >
                        <div>
                          <p className="text-sporr-dark text-sm font-medium">{ob.description}</p>
                          <p className="text-[#6B7D72] text-xs mt-0.5">
                            {PROOF_TYPE_LABELS[ob.proof_type] || ob.proof_type} · {DELIVERY_CONTEXT_LABELS[ob.delivery_context] || ob.delivery_context}
                          </p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-sporr-sage-lt flex-shrink-0 ml-3" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Fulfill button */}
                {!allDone && (
                  <button
                    onClick={() => handleFulfill(group)}
                    disabled={fulfilling === group.contract_id}
                    className="w-full font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: '#13322A',
                      color: '#F5F1E6',
                    }}
                  >
                    {fulfilling === group.contract_id
                      ? 'Starting session...'
                      : `Fulfill obligation${group.pending.length > 1 ? 's' : ''} →`}
                  </button>
                )}

                {/* All done state */}
                {allDone && (
                  <p className="text-sporr-mid text-sm font-medium text-center py-2">
                    All {group.total} obligations fulfilled this season
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Link to manage contracts */}
        {sponsorGroups.length > 0 && (
          <div className="mt-8 text-center">
            <Link href="/dashboard/contracts" className="text-[#6B7D72] text-sm hover:text-sporr-dark transition-colors underline underline-offset-2">
              Manage contracts and obligations →
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}
