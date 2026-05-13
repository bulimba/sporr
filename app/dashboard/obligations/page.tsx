'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Obligation = {
  id: string
  description: string | null
  proof_type: string
  status: string
  contract_id: string
  contracts: {
    title: string
    sponsors: { company_name: string } | null
  } | null
}

export default function ObligationsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) { router.push('/login'); return }
        if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return

        const { data: userData } = await supabase
          .from('users')
          .select('org_id')
          .eq('id', session.user.id)
          .single()

        if (!userData) { setLoading(false); return }
        setOrgId(userData.org_id)

        const { data: oblData } = await supabase
          .from('obligations')
          .select('id, description, proof_type, status, contract_id, contracts(title, sponsors(company_name))')
          .eq('org_id', userData.org_id)
          .order('status')

        setObligations((oblData as unknown as Obligation[]) || [])
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const pending = obligations.filter(o => o.status === 'pending')
  const delivered = obligations.filter(o => o.status === 'delivered')
  const skipped = obligations.filter(o => o.status === 'not_applicable')

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

      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-sporr-dark text-2xl font-medium mb-1">Your obligations</h1>
            <p className="text-sporr-muted text-sm">
              {pending.length} pending · {delivered.length} delivered · {skipped.length} skipped
            </p>
          </div>
          <Link href="/dashboard/contracts" className="btn-secondary text-sm">
            Manage contracts
          </Link>
        </div>

        {obligations.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-sporr-muted text-lg mb-2">No obligations yet</p>
            <p className="text-sporr-muted text-sm mb-6">
              Add obligations to your contracts to see them here
            </p>
            <Link href="/dashboard/contracts" className="btn-primary">
              Go to contracts
            </Link>
          </div>
        )}

        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">
              Pending — {pending.length}
            </h2>
            <div className="space-y-3">
              {pending.map(ob => (
                <div key={ob.id} className="card border-l-4 border-l-sporr-dark">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sporr-dark font-medium">{ob.description}</p>
                      <p className="text-sporr-muted text-sm mt-0.5">
                        {ob.contracts?.sponsors?.company_name}
                        {ob.contracts?.title && <span> · {ob.contracts.title}</span>}
                      </p>
                      <p className="text-sporr-muted text-xs mt-1 capitalize">
                        {ob.proof_type} proof required
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-sporr-sage-lt text-sporr-dark ml-4 flex-shrink-0">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {delivered.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">
              Delivered — {delivered.length}
            </h2>
            <div className="space-y-3">
              {delivered.map(ob => (
                <div key={ob.id} className="card opacity-60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sporr-dark font-medium line-through">{ob.description}</p>
                      <p className="text-sporr-muted text-sm mt-0.5">
                        {ob.contracts?.sponsors?.company_name}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-sporr-light text-sporr-muted ml-4 flex-shrink-0">
                      ✓ Delivered
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {skipped.length > 0 && (
          <div>
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">
              Skipped — {skipped.length}
            </h2>
            <div className="space-y-3">
              {skipped.map(ob => (
                <div key={ob.id} className="card opacity-40">
                  <p className="text-sporr-dark font-medium">{ob.description}</p>
                  <p className="text-sporr-muted text-sm mt-0.5">
                    {ob.contracts?.sponsors?.company_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
