'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CARBON = '#081216'
const SLATE = '#6E7F86'
const BLUE = '#147BFF'
const GREEN = '#36B37E'
const COPPER = '#B8734A'

export type Row = {
  id: string
  title: string
  ownerName: string | null
  ownerContact: string | null
  state: string
  eventName: string | null
  linkSentAt: string | null
  evidenceUrl: string | null
  method: string | null
  performedAt: string | null
}

function fmt(ts: string | null) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export default function OperatorClient({
  rows,
  operatorLabel,
}: {
  rows: Row[]
  operatorLabel: string
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<{ id: string; msg: string } | null>(null)

  async function call(id: string, payload: Record<string, unknown>) {
    setBusyId(id)
    setErrorId(null)
    try {
      const res = await fetch('/api/td-ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obligationId: id, ...payload }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorId({ id, msg: body?.error || 'Action failed.' })
        setBusyId(null)
        return
      }
      router.refresh()
    } catch {
      setErrorId({ id, msg: 'Network problem.' })
    } finally {
      setBusyId(null)
    }
  }

  if (!rows.length) {
    return (
      <div style={card}>
        <p style={{ margin: 0, color: SLATE }}>No obligations yet.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r) => {
        const busy = busyId === r.id
        return (
          <div key={r.id} style={card}>
            {r.eventName && (
              <p style={{ margin: '0 0 4px', fontSize: 12, color: SLATE }}>{r.eventName}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 17, color: CARBON }}>{r.title}</h3>
              <StateBadge state={r.state} />
            </div>
            {r.ownerName && (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: SLATE }}>
                {r.ownerName}
                {r.ownerContact ? ` · ${r.ownerContact}` : ''}
              </p>
            )}

            {/* Awaiting capture: send-link action (dark) */}
            {(r.state === 'ready' || r.state === 'rejected') && (
              <div>
                <button
                  onClick={() => call(r.id, { action: 'send' })}
                  disabled={busy || !r.ownerContact}
                  style={btn(BLUE, busy || !r.ownerContact)}
                >
                  {busy ? 'Sending…' : r.linkSentAt ? 'Resend capture link' : 'Send capture link'}
                </button>
                {!r.ownerContact && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: COPPER }}>
                    No contact on file for this owner.
                  </p>
                )}
                {r.linkSentAt && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: SLATE }}>
                    Link sent {fmt(r.linkSentAt)} — dark mode, recorded but not delivered.
                  </p>
                )}
              </div>
            )}

            {/* Awaiting verification: photo + three outcomes */}
            {r.state === 'submitted' && (
              <div>
                {r.evidenceUrl ? (
                  <a href={r.evidenceUrl} target="_blank" rel="noreferrer">
                    <img
                      src={r.evidenceUrl}
                      alt="Captured evidence"
                      style={{
                        width: '100%',
                        borderRadius: 10,
                        marginBottom: 10,
                        border: '1px solid rgba(8,18,22,0.1)',
                      }}
                    />
                  </a>
                ) : (
                  <p style={{ fontSize: 13, color: COPPER }}>Evidence image unavailable.</p>
                )}
                <p style={{ margin: '0 0 12px', fontSize: 12, color: SLATE }}>
                  Captured {fmt(r.performedAt)}
                  {r.method ? ` · ${r.method}` : ''}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => call(r.id, { action: 'verify', outcome: 'pass' })}
                    disabled={busy}
                    style={btn(GREEN, busy)}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => call(r.id, { action: 'verify', outcome: 'fail' })}
                    disabled={busy}
                    style={btnOutline(COPPER, busy)}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => call(r.id, { action: 'verify', outcome: 'needs_more' })}
                    disabled={busy}
                    style={btnOutline(SLATE, busy)}
                  >
                    Needs more
                  </button>
                </div>
              </div>
            )}

            {r.state === 'satisfied' && (
              <p style={{ margin: 0, fontSize: 14, color: GREEN, fontWeight: 600 }}>
                Verified — complete.
              </p>
            )}

            {errorId?.id === r.id && (
              <p style={{ margin: '10px 0 0', fontSize: 13, color: COPPER }}>{errorId.msg}</p>
            )}
          </div>
        )
      })}
      <p style={{ margin: '4px 2px 0', fontSize: 12, color: SLATE }}>
        Verifying as {operatorLabel}
      </p>
    </div>
  )
}

function StateBadge({ state }: { state: string }) {
  const map: Record<string, { label: string; color: string }> = {
    ready: { label: 'Ready', color: SLATE },
    rejected: { label: 'Rejected', color: COPPER },
    submitted: { label: 'Awaiting verification', color: BLUE },
    satisfied: { label: 'Verified', color: GREEN },
    expired: { label: 'Expired', color: COPPER },
    blocked: { label: 'Blocked', color: SLATE },
    overridden: { label: 'Overridden', color: SLATE },
  }
  const s = map[state] ?? { label: state, color: SLATE }
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        color: s.color,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  )
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid rgba(8,18,22,0.08)',
  padding: 18,
}

function btn(bg: string, disabled: boolean): React.CSSProperties {
  return {
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: bg,
    border: 'none',
    borderRadius: 9,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }
}

function btnOutline(color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    color,
    background: 'transparent',
    border: `1px solid ${color}`,
    borderRadius: 9,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }
}
