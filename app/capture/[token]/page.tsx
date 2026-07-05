import { tdAdmin } from '@/lib/td/supabaseAdmin'
import SporrWordmark from '@/components/td/SporrWordmark'
import CaptureClient from './CaptureClient'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Brand tokens (SPORR-BRAND-SYSTEM). Verified Green is used ONLY on verification success.
const FOG = '#E7ECEF'
const CARBON = '#081216'
const SLATE = '#6E7F86'
const BLUE = '#147BFF'
const GREEN = '#36B37E'
const PINE = '#0F2A2E'

type Obligation = {
  id: string
  title: string
  spec: string | null
  owner_name: string | null
  state: string
  event_name: string | null
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: FOG,
        color: CARBON,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 20px',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <SporrWordmark width={96} />
      </div>
      <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
    </main>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid rgba(8,18,22,0.08)',
        padding: 24,
      }}
    >
      {children}
    </div>
  )
}

function StatusLine({ text, tone }: { text: string; tone: 'neutral' | 'good' | 'warn' }) {
  const color = tone === 'good' ? GREEN : tone === 'warn' ? '#B8734A' : SLATE
  return (
    <p style={{ margin: '0 0 18px', fontSize: 13, letterSpacing: 0.3, color, fontWeight: 600 }}>
      {text.toUpperCase()}
    </p>
  )
}

function ObligationHead({ ob }: { ob: Obligation }) {
  return (
    <>
      {ob.event_name && (
        <p style={{ margin: '0 0 6px', fontSize: 13, color: SLATE }}>{ob.event_name}</p>
      )}
      <h1 style={{ margin: '0 0 10px', fontSize: 22, lineHeight: 1.25, color: CARBON }}>
        {ob.title}
      </h1>
      {ob.spec && (
        <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.5, color: '#33454b' }}>
          {ob.spec}
        </p>
      )}
      {ob.owner_name && (
        <p style={{ margin: '0 0 18px', fontSize: 14, color: SLATE }}>
          Assigned to {ob.owner_name}
        </p>
      )}
    </>
  )
}

export default async function CapturePage({ params }: { params: { token: string } }) {
  const admin = tdAdmin()

  const { data, error } = await admin
    .from('td_obligations')
    .select('id, title, spec, owner_name, state, td_events(name)')
    .eq('capture_link_token', params.token)
    .maybeSingle()

  if (error || !data) {
    return (
      <Shell>
        <Card>
          <StatusLine text="Link not recognised" tone="warn" />
          <p style={{ margin: 0, fontSize: 15, color: '#33454b', lineHeight: 1.5 }}>
            This capture link is invalid or has been retired. Check with the organiser for a current
            link.
          </p>
        </Card>
      </Shell>
    )
  }

  // td_events embed can arrive as an object or a single-element array depending on
  // how the relationship is resolved — normalise defensively.
  const ev = (data as any).td_events
  const event_name = Array.isArray(ev) ? ev[0]?.name ?? null : ev?.name ?? null

  const ob: Obligation = {
    id: data.id,
    title: data.title,
    spec: data.spec,
    owner_name: data.owner_name,
    state: data.state,
    event_name,
  }

  // ── State branches. Capturable = ready | rejected. Explicit copy per state. ──
  switch (ob.state) {
    case 'ready':
      return (
        <Shell>
          <Card>
            <StatusLine text="Ready to capture" tone="neutral" />
            <ObligationHead ob={ob} />
            <CaptureClient token={params.token} mode="first" />
          </Card>
        </Shell>
      )

    case 'rejected':
      return (
        <Shell>
          <Card>
            <StatusLine text="Not accepted — capture again" tone="warn" />
            <ObligationHead ob={ob} />
            <p style={{ margin: '0 0 16px', fontSize: 14, color: SLATE, lineHeight: 1.5 }}>
              The previous submission was reviewed and not accepted. Please capture a fresh photo.
            </p>
            <CaptureClient token={params.token} mode="retake" />
          </Card>
        </Shell>
      )

    case 'submitted':
      return (
        <Shell>
          <Card>
            <StatusLine text="Captured — awaiting verification" tone="neutral" />
            <ObligationHead ob={ob} />
            <p style={{ margin: 0, fontSize: 15, color: '#33454b', lineHeight: 1.5 }}>
              Your photo has been received and is waiting to be verified. Nothing more to do here.
            </p>
          </Card>
        </Shell>
      )

    case 'satisfied':
      return (
        <Shell>
          <Card>
            <StatusLine text="Verified — complete" tone="good" />
            <ObligationHead ob={ob} />
            <p style={{ margin: 0, fontSize: 15, color: PINE, lineHeight: 1.5 }}>
              This has been captured and verified. No further action needed.
            </p>
          </Card>
        </Shell>
      )

    case 'expired':
      return (
        <Shell>
          <Card>
            <StatusLine text="Capture window closed" tone="warn" />
            <ObligationHead ob={ob} />
            <p style={{ margin: 0, fontSize: 15, color: '#33454b', lineHeight: 1.5 }}>
              The window for this capture has closed. Contact the organiser if this needs to be
              reopened.
            </p>
          </Card>
        </Shell>
      )

    case 'overridden':
      return (
        <Shell>
          <Card>
            <StatusLine text="Marked complete by the organiser" tone="neutral" />
            <ObligationHead ob={ob} />
          </Card>
        </Shell>
      )

    default: // blocked, or anything unexpected
      return (
        <Shell>
          <Card>
            <StatusLine text="Not yet ready" tone="neutral" />
            <ObligationHead ob={ob} />
            <p style={{ margin: 0, fontSize: 15, color: '#33454b', lineHeight: 1.5 }}>
              This isn&apos;t open for capture yet. Check back when the organiser has released it.
            </p>
          </Card>
        </Shell>
      )
  }
}

