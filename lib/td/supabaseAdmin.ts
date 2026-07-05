import { createClient } from '@supabase/supabase-js'

// ── SERVER ONLY. Never import this into a client component. ───────────────────
// The service-role key bypasses RLS entirely. That is acceptable here ONLY
// because every call site gates first: the public capture path validates the
// capture token (the token IS the capability), and the operator path validates
// an operator session. There is no database net under those checks — the gate
// in the calling code IS the security boundary. (Carried flag.)
export function tdAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — add the ' +
        'service-role key to Vercel env (server-side only, never NEXT_PUBLIC).'
    )
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
