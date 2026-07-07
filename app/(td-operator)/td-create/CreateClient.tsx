'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CARBON = '#081216'
const SLATE = '#6E7F86'
const BLUE = '#147BFF'
const COPPER = '#B8734A'
const GREEN = '#36B37E'

export type PendingRow = {
  id: string
  title: string
  ownerName: string | null
  ownerContact: string | null
  state: string
  captureUrl: string
  linkSentAt: string | null
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid rgba(8,18,22,0.08)',
  padding: 20,
}
const label: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  color: SLATE,
  marginBottom: 6,
}
const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  fontSize: 15,
  color: CARBON,
  background: '#fff',
  border: '1px solid rgba(8,18,22,0.16)',
  borderRadius: 9,
  outline: 'none',
  fontFamily: 'inherit',
}

function fmt(ts: string | null) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export default function CreateClient({
  eventId,
  pending,
}: {
  eventId: string
  pending: PendingRow[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [spec, setSpec] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerContact, setOwnerContact] = useState('')
  const [windowStart, setWindowStart] = useState('')
  const [windowEnd, setWindowEnd] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sendState, setSendState] = useState<Record<string, string>>({})

  async function submit() {
    if (!title.trim()) {
      setError('A title is required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/td-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          title: title.trim(),
          spec: spec.trim() || null,
          ownerName: ownerName.trim() || null,
          ownerContact: ownerContact.trim() || null,
          windowStart: windowStart || null,
          windowEnd: windowEnd || null,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error || 'Could not create the obligation.')
        setBusy(false)
        return
      }
      setTitle('')
      setSpec('')
      setOwnerName('')
      setOwnerContact('')
      setWindowStart('')
      setWindowEnd('')
      router.refresh()
    } catch {
      setError('Network problem. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function copy(row: PendingRow) {
    try {
      await navigator.clipboard.writeText(row.captureUrl)
      setCopiedId(row.id)
      setTimeout(() => setCopiedId((c) => (c === row.id ? null : c)), 1500)
    } catch {
      setCopiedId(null)
    }
  }

  // Reuse the existing operator send action (/api/td-ops) — no parallel send.
  async function send(row: PendingRow) {
    setSendState((s) => ({ ...s, [row.id]: 'sending' }))
    try {
      const res = await fetch('/api/td-ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obligationId: row.id, action: 'send' }),
      })
      const body = await res.json().catch(() => ({}))
      setSendState((s) => ({ ...s, [row.id]: res.ok ? 'sent' : body?.error || 'failed' }))
      if (res.ok) router.refresh()
    } catch {
      setSendState((s) => ({ ...s, [row.id]: 'failed' }))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Create form */}
      <div style={card}>
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Title</label>
          <input
            style={input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What must be true"
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Acceptance criteria</label>
          <textarea
            style={{ ...input, minHeight: 66, resize: 'vertical' }}
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            placeholder="The standard the evidence is judged against"
          />
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={label}>Owner name</label>
            <input
              style={input}
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Responsible person"
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={label}>Owner contact</label>
            <input
              style={input}
              value={ownerContact}
              onChange={(e) => setOwnerContact(e.target.value)}
              placeholder="+47… (send target)"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={label}>Window start (optional)</label>
            <input
              type="datetime-local"
              style={input}
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={label}>Window end (optional)</label>
            <input
              type="datetime-local"
              style={input}
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={submit}
          disabled={busy}
          style={{
            padding: '11px 18px',
            fontSize: 15,
            fontWeight: 600,
            color: '#fff',
            background: BLUE,
            border: 'none',
            borderRadius: 9,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Creating…' : 'Create obligation'}
        </button>
        {error && (
          <p style={{ margin: '12px 0 0', fontSize: 14, color: COPPER }}>{error}</p>
        )}
      </div>

      {/* Awaiting-capture list — durable link handoff */}
      <div>
        <p
          style={{
            margin: '4px 2px 10px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            color: SLATE,
          }}
        >
          Awaiting capture
        </p>
        {pending.length === 0 ? (
          <div style={card}>
            <p style={{ margin: 0, fontSize: 14, color: SLATE }}>
              Nothing awaiting capture. Create one above.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map((row) => {
              const st = sendState[row.id]
              return (
                <div key={row.id} style={card}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 16, color: CARBON }}>{row.title}</h3>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                        color: row.state === 'rejected' ? COPPER : SLATE,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.state === 'rejected' ? 'Rejected' : 'Ready'}
                    </span>
                  </div>
                  {row.ownerName && (
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: SLATE }}>
                      {row.ownerName}
                      {row.ownerContact ? ` · ${row.ownerContact}` : ''}
                    </p>
                  )}
                  <div
                    style={{
                      fontSize: 13,
                      color: CARBON,
                      background: '#F5F2ED',
                      border: '1px solid rgba(8,18,22,0.08)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      wordBreak: 'break-all',
                      marginBottom: 10,
                    }}
                  >
                    {row.captureUrl}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => copy(row)} style={btnOutline(BLUE)}>
                      {copiedId === row.id ? 'Copied' : 'Copy link'}
                    </button>
                    <button
                      onClick={() => send(row)}
                      disabled={st === 'sending' || !row.ownerContact}
                      style={btnFilled(BLUE, st === 'sending' || !row.ownerContact)}
                    >
                      {st === 'sending'
                        ? 'Sending…'
                        : row.linkSentAt
                        ? 'Resend link'
                        : 'Send link'}
                    </button>
                    {!row.ownerContact && (
                      <span style={{ fontSize: 12, color: COPPER }}>No contact on file</span>
                    )}
                    {st === 'sent' && (
                      <span style={{ fontSize: 12, color: GREEN }}>
                        Recorded (dark mode — not delivered)
                      </span>
                    )}
                    {st && st !== 'sent' && st !== 'sending' && (
                      <span style={{ fontSize: 12, color: COPPER }}>{st}</span>
                    )}
                    {!st && row.linkSentAt && (
                      <span style={{ fontSize: 12, color: SLATE }}>
                        Last sent {fmt(row.linkSentAt)} — dark mode
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function btnFilled(bg: string, disabled: boolean): React.CSSProperties {
  return {
    padding: '9px 14px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: bg,
    border: 'none',
    borderRadius: 8,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }
}
function btnOutline(color: string): React.CSSProperties {
  return {
    padding: '9px 14px',
    fontSize: 14,
    fontWeight: 600,
    color,
    background: 'transparent',
    border: `1px solid ${color}`,
    borderRadius: 8,
    cursor: 'pointer',
  }
}
