'use client'

import { useRef, useState } from 'react'

const CARBON = '#081216'
const SLATE = '#6E7F86'
const BLUE = '#147BFF'
const GREEN = '#36B37E'

type Phase = 'idle' | 'preview' | 'sending' | 'done' | 'error'

export default function CaptureClient({
  token,
  mode,
}: {
  token: string
  mode: 'first' | 'retake'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState<string>('')

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setPhase('error')
      setMessage('That file is not an image. Please take or choose a photo.')
      return
    }
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setPhase('preview')
    setMessage('')
  }

  async function submit() {
    if (!file) return
    setPhase('sending')
    setMessage('')
    try {
      const form = new FormData()
      form.append('photo', file)
      form.append('capturedAt', new Date().toISOString())
      const res = await fetch(`/api/capture/${token}`, { method: 'POST', body: form })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setPhase('error')
        setMessage(body?.error || 'Upload failed. Please try again.')
        return
      }
      setPhase('done')
    } catch {
      setPhase('error')
      setMessage('Network problem. Please try again.')
    }
  }

  function reset() {
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPhase('idle')
    setMessage('')
    if (inputRef.current) inputRef.current.value = ''
  }

  if (phase === 'done') {
    return (
      <div>
        <p style={{ margin: '4px 0 0', fontSize: 15, color: GREEN, fontWeight: 600 }}>
          Captured — awaiting verification.
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: SLATE, lineHeight: 1.5 }}>
          Your photo has been received. You can close this page.
        </p>
      </div>
    )
  }

  const primaryLabel =
    phase === 'sending' ? 'Sending…' : mode === 'retake' ? 'Submit new photo' : 'Submit photo'

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        style={{ display: 'none' }}
      />

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Capture preview"
          style={{
            width: '100%',
            borderRadius: 10,
            marginBottom: 14,
            border: '1px solid rgba(8,18,22,0.1)',
          }}
        />
      )}

      {phase === 'idle' || phase === 'error' ? (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: 16,
            fontWeight: 600,
            color: '#fff',
            background: BLUE,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          {mode === 'retake' ? 'Take a new photo' : 'Take photo'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={submit}
            disabled={phase === 'sending'}
            style={{
              flex: 1,
              padding: '14px 16px',
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
              background: BLUE,
              border: 'none',
              borderRadius: 10,
              cursor: phase === 'sending' ? 'default' : 'pointer',
              opacity: phase === 'sending' ? 0.7 : 1,
            }}
          >
            {primaryLabel}
          </button>
          <button
            onClick={reset}
            disabled={phase === 'sending'}
            style={{
              padding: '14px 16px',
              fontSize: 15,
              fontWeight: 600,
              color: CARBON,
              background: 'transparent',
              border: '1px solid rgba(8,18,22,0.2)',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            Retake
          </button>
        </div>
      )}

      {message && (
        <p style={{ margin: '12px 0 0', fontSize: 14, color: '#B8734A', lineHeight: 1.4 }}>
          {message}
        </p>
      )}
    </div>
  )
}
