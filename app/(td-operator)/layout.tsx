import { redirect } from 'next/navigation'
import Link from 'next/link'
import { tdOperator } from '@/lib/td/session'
import SporrWordmark from '@/components/td/SporrWordmark'

// ── Operator route group ──────────────────────────────────────────────────────
// FOUNDATIONAL: auth-by-layout, gated once, is the seed of the real operator
// shell. When the legacy dashboard is replaced page-by-page, this group is where
// the canon-native operator experience lives. The parens make (td-operator) a
// route group — it does NOT appear in the URL, so the pages stay at /td-create
// and /td-verify.
export const dynamic = 'force-dynamic'

const FOG = '#E7ECEF'
const CARBON = '#081216'
const SLATE = '#6E7F86'

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const operator = await tdOperator()
  if (!operator) {
    redirect('/login')
  }

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <SporrWordmark width={88} />
          <nav style={{ display: 'flex', gap: 8 }}>
            <NavLink href="/td-create" label="Create" />
            <NavLink href="/td-verify" label="Verify" />
          </nav>
        </div>
        {children}
      </div>
    </main>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: SLATE,
        textDecoration: 'none',
        padding: '6px 12px',
        borderRadius: 8,
        border: '1px solid rgba(8,18,22,0.12)',
      }}
    >
      {label}
    </Link>
  )
}
