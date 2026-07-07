import { NextResponse } from 'next/server'
import { tdAdmin } from '@/lib/td/supabaseAdmin'
import { tdOperator } from '@/lib/td/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Operator-only. Session-gated. Creates ONE obligation (canon §1.5) in state
// 'ready' against a real event, and returns its capture token. Every field maps
// to a canon Obligation field — no invented columns.
export async function POST(req: Request) {
  const operator = await tdOperator()
  if (!operator) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const { eventId, title, spec, ownerName, ownerContact, windowStart, windowEnd } = body ?? {}

  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'Missing event.' }, { status: 400 })
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'A title is required.' }, { status: 400 })
  }

  const admin = tdAdmin()

  // datetime-local arrives without a timezone; treat it as an ISO instant if
  // parseable, otherwise store null rather than a malformed value.
  const toIso = (v: unknown): string | null => {
    if (typeof v !== 'string' || !v) return null
    const t = Date.parse(v)
    return Number.isNaN(t) ? null : new Date(t).toISOString()
  }

  const { data, error } = await admin
    .from('td_obligations')
    .insert({
      event_id: eventId,
      title: title.trim(),
      spec: typeof spec === 'string' && spec.trim() ? spec.trim() : null,
      owner_name: typeof ownerName === 'string' && ownerName.trim() ? ownerName.trim() : null,
      owner_contact:
        typeof ownerContact === 'string' && ownerContact.trim() ? ownerContact.trim() : null,
      window_start: toIso(windowStart),
      window_end: toIso(windowEnd),
      state: 'ready',
    })
    .select('id, capture_link_token')
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Could not create the obligation.' },
      { status: 409 }
    )
  }

  return NextResponse.json(
    { ok: true, id: data.id, token: data.capture_link_token },
    { status: 200 }
  )
}
