import { redirect } from 'next/navigation'
import { tdAdmin } from '@/lib/td/supabaseAdmin'
import { tdOperator } from '@/lib/td/session'
import SporrWordmark from '@/components/td/SporrWordmark'
import OperatorClient, { type Row } from './OperatorClient'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FOG = '#E7ECEF'
const CARBON = '#081216'
const SLATE = '#6E7F86'
const GREEN = '#36B37E'
const BUCKET = 'td-evidence'

export default async function VerifyPage() {
  const operator = await tdOperator()
  if (!operator) {
    redirect('/login')
  }

  const admin = tdAdmin()

  // v1: single-event truth demo, but fetch across all td_events so a second
  // event doesn't silently disappear. Event is the scope boundary (canon §1.1).
  const { data: obs, error } = await admin
    .from('td_obligations')
    .select(
      'id, title, owner_name, owner_contact, state, link_sent_at, current_execution_id, td_events(name)'
    )
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <Shell>
        <div style={panel}>
          <p style={{ margin: 0, fontSize: 15, color: '#B8734A' }}>
            Could not load obligations. {error.message}
          </p>
        </div>
      </Shell>
    )
  }

  const list = obs ?? []

  // Sign evidence URLs for submitted obligations (their live execution's photo).
  const submittedExecIds = list
    .filter((o) => o.state === 'submitted' && o.current_execution_id)
    .map((o) => o.current_execution_id as string)

  const execMap = new Map<
    string,
    { path: string | null; method: string | null; performed_at: string | null }
  >()

  if (submittedExecIds.length) {
    const { data: execs } = await admin
      .from('td_executions')
      .select('id, evidence_storage_path, method, performed_at')
      .in('id', submittedExecIds)
    for (const e of execs ?? []) {
      execMap.set(e.id, {
        path: e.evidence_storage_path,
        method: e.method,
        performed_at: e.performed_at,
      })
    }
  }

  const rows: Row[] = []
  for (const o of list) {
    const ev = (o as any).td_events
    const event_name = Array.isArray(ev) ? ev[0]?.name ?? null : ev?.name ?? null

    let evidenceUrl: string | null = null
    let method: string | null = null
    let performedAt: string | null = null

    if (o.state === 'submitted' && o.current_execution_id) {
      const meta = execMap.get(o.current_execution_id)
      method = meta?.method ?? null
      performedAt = meta?.performed_at ?? null
      if (meta?.path) {
        const { data: signed } = await admin.storage
          .from(BUCKET)
          .createSignedUrl(meta.path, 300)
        evidenceUrl = signed?.signedUrl ?? null
      }
    }

    rows.push({
      id: o.id,
      title: o.title,
      ownerName: o.owner_name,
      ownerContact: o.owner_contact,
      state: o.state,
      eventName: event_name,
      linkSentAt: o.link_sent_at,
      evidenceUrl,
      method,
      performedAt,
    })
  }

  const total = rows.length
  const verified = rows.filter((r) => r.state === 'satisfied').length

  return (
    <Shell>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, color: CARBON }}>Captures</h1>
        <p style={{ margin: 0, fontSize: 15, color: SLATE }}>
          <span style={{ color: GREEN, fontWeight: 700 }}>{verified}</span> of {total} verified
        </p>
      </div>
      <OperatorClient rows={rows} operatorLabel={operator.email ?? operator.id} />
    </Shell>
  )
}

const panel: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid rgba(8,18,22,0.08)',
  padding: 20,
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: FOG,
        color: CARBON,
        padding: '32px 20px',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <SporrWordmark width={88} />
        </div>
        {children}
      </div>
    </main>
  )
}

