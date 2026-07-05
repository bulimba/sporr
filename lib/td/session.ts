import { createClient } from '@/lib/supabase/server'

// ── Operator session gate ─────────────────────────────────────────────────────
// Thin wrapper over your existing server helper (lib/supabase/server.ts). No
// parallel Supabase client — this only asks "is there a signed-in operator?".
// createClient() is synchronous in your helper (getAll/setAll cookie API,
// @supabase/ssr 0.5.2), so no await on the client itself.
export async function tdOperator() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
