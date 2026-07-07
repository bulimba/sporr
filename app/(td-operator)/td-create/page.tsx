import { tdAdmin } from '@/lib/td/supabaseAdmin'
import { captureUrl } from '@/lib/td/sendCaptureLink'
import CreateClient, { type PendingRow } from './CreateClient'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CARBON = '#081216'
const SLATE = '#6E7F86'

// Ensure a single event exists to attach obligations to, and return its id.
//
// SCAFFOLD: single-event assumption. This is an implementation detail of this
// build stage, NOT the product model. The product model is Event as scope
// boundary (canon §1.1) with real event selection/management. What is permanent
// is that every obligation carries a real event_id to a real td_events row — so
// when event management arrives it is an ADDITION (a picker writing the same
// td_events), never a migration. Removing this scaffold changes operator
// convenience, never stored data. Do not let the single-event assumption leak
// past this helper into the schema, RPCs, capture, or verify surfaces.
async function ensureDemoEventId(admin: ReturnType<typeof tdAdmin>): Promise<string | null> {
  const { data: existing } = await admin
    .from('td_events')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) return existing.id

  const now = new Date()
  const ends = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const { data: created } = await admin
    .from('td_events')
    .insert({
      name: 'Demo event',
      starts_at: now.toISOString(),
      ends_at: ends.toISOString(),
      timezone: 'Europe/Oslo',
      status: 'live',
    })
    .select('id')
    .single()

  return created?.id ?? null
}

export default async function CreatePage() {
  const admin = tdAdmin()
  const eventId = await ensureDemoEventId(admin)

  // Obligations still awaiting capture (ready | rejected) — the durable
  // create→link handoff. SCAFFOLD: this inline list is a create-time
  // convenience, not the management surface; /td-verify is the operator surface.
  const { data: pendingRaw } = await admin
    .from('td_obligations')
    .select('id, title, owner_name, owner_contact, state, capture_link_token, link_sent_at')
    .in('state', ['ready', 'rejected'])
    .order('created_at', { ascending: false })

  const pending: PendingRow[] = (pendingRaw ?? []).map((o) => ({
    id: o.id,
    title: o.title,
    ownerName: o.owner_name,
    ownerContact: o.owner_contact,
    state: o.state,
    captureUrl: captureUrl(o.capture_link_token),
    linkSentAt: o.link_sent_at,
  }))

  if (!eventId) {
    return (
      <div style={panel}>
        <p style={{ margin: 0, fontSize: 15, color: '#B8734A' }}>
          Could not prepare an event to create obligations against. Check the service-role key and
          td_events table, then retry.
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, color: CARBON }}>Create obligation</h1>
        <p style={{ margin: 0, fontSize: 15, color: SLATE }}>
          Define what must be true, assign an owner, and get a capture link.
        </p>
      </div>
      <CreateClient eventId={eventId} pending={pending} />
    </>
  )
}

const panel: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid rgba(8,18,22,0.08)',
  padding: 20,
}
