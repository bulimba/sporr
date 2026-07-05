import { NextResponse } from 'next/server'
import { tdAdmin } from '@/lib/td/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 12 * 1024 * 1024 // 12MB
const BUCKET = 'td-evidence'

// Public, unauthenticated. The token in the URL IS the capability. This handler
// is the security boundary — the service-role client below bypasses RLS, so the
// token validation here is the only gate. (Carried flag.)
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const token = params.token
  const admin = tdAdmin()

  // Light pre-check: nice errors + avoid orphaning an upload for a bad token/state.
  // The RPC re-validates inside the transaction, so this is UX, not the gate.
  const { data: pre, error: preErr } = await admin
    .from('td_obligations')
    .select('id, state')
    .eq('capture_link_token', token)
    .maybeSingle()

  if (preErr || !pre) {
    return NextResponse.json({ error: 'Capture link not recognised.' }, { status: 404 })
  }
  if (pre.state !== 'ready' && pre.state !== 'rejected') {
    return NextResponse.json(
      { error: `This capture is not open (state: ${pre.state}).` },
      { status: 409 }
    )
  }

  // Read the photo.
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Could not read the upload.' }, { status: 400 })
  }
  const file = form.get('photo')
  const capturedAtRaw = form.get('capturedAt')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No photo attached.' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Attached file is not an image.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Photo is too large (max 12MB).' }, { status: 413 })
  }

  const capturedAt =
    typeof capturedAtRaw === 'string' && !Number.isNaN(Date.parse(capturedAtRaw))
      ? capturedAtRaw
      : new Date().toISOString()

  // Upload to the private bucket. Path: <obligationId>/<uuid>.<ext>
  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const storagePath = `${pre.id}/${crypto.randomUUID()}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false })

  if (upErr) {
    return NextResponse.json(
      { error: 'Could not store the photo. Please try again.' },
      { status: 502 }
    )
  }

  // Atomic supersede → append → flip. The RPC re-validates token + state.
  const { data: execId, error: rpcErr } = await admin.rpc('td_submit_capture', {
    p_token: token,
    p_storage_path: storagePath,
    p_evidence_captured_at: capturedAt,
  })

  if (rpcErr) {
    // Best-effort cleanup of the now-orphaned upload.
    await admin.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json(
      { error: 'Could not record the capture. Please try again.' },
      { status: 409 }
    )
  }

  return NextResponse.json({ ok: true, executionId: execId }, { status: 200 })
}
