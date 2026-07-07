import { NextResponse } from 'next/server'
import { tdAdmin } from '@/lib/td/supabaseAdmin'
import { tdOperator } from '@/lib/td/session'
import { sendCaptureLink } from '@/lib/td/sendCaptureLink'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
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

    const { action, obligationId } = body ?? {}
    if (!obligationId || typeof obligationId !== 'string') {
      return NextResponse.json({ error: 'Missing obligationId.' }, { status: 400 })
    }

    const admin = tdAdmin()

    // ── verify ────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      const outcome = body?.outcome
      if (!['pass', 'fail', 'needs_more'].includes(outcome)) {
        return NextResponse.json({ error: 'Invalid outcome.' }, { status: 400 })
      }
      const verifiedBy = operator.email ?? operator.id ?? 'operator'
      const { error } = await admin.rpc('td_verify', {
        p_obligation_id: obligationId,
        p_outcome: outcome,
        p_verified_by: verifiedBy,
      })
      if (error) {
        return NextResponse.json(
          { error: error.message || 'Verification failed.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // ── send ──────────────────────────────────────────────────────────────────
    if (action === 'send') {
      const { data: ob, error: obErr } = await admin
        .from('td_obligations')
        .select('id, title, owner_contact, capture_link_token')
        .eq('id', obligationId)
        .maybeSingle()

      if (obErr || !ob) {
        return NextResponse.json({ error: 'Obligation not found.' }, { status: 404 })
      }
      if (!ob.owner_contact) {
        return NextResponse.json({ error: 'No contact on file.' }, { status: 400 })
      }

      let result
      try {
        result = await sendCaptureLink({
          token: ob.capture_link_token,
          toContact: ob.owner_contact,
          obligationTitle: ob.title,
        })
      } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Send failed.' }, { status: 502 })
      }
      if (!result.ok) {
        return NextResponse.json({ error: 'Send failed.' }, { status: 502 })
      }

      const nowIso = new Date().toISOString()
      const { error: stampErr } = await admin
        .from('td_obligations')
        .update({ link_sent_at: nowIso, updated_at: nowIso })
        .eq('id', obligationId)

      if (stampErr) {
        return NextResponse.json({ error: 'Sent, but could not record send time.' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, provider: result.provider }, { status: 200 })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch (e: any) {
    // Anything unhandled now returns its message as JSON instead of a bare 500.
    return NextResponse.json(
      { error: e?.message || 'Unexpected server error.' },
      { status: 500 }
    )
  }
}
