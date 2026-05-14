'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const steps = [
  {
    number: '01',
    title: 'Add your sponsors and contracts',
    description: 'Enter the companies supporting your club and define exactly what you have agreed to deliver — LED boards, kit logos, social posts, PA announcements. Every obligation is logged against the sponsor it belongs to.',
  },
  {
    number: '02',
    title: 'Launch a match day session',
    description: 'On match day, open Sporr on your phone and start a session. A QR code appears — any volunteer can scan it and start capturing proof immediately. No login required for volunteers.',
  },
  {
    number: '03',
    title: 'Capture proof in real time',
    description: 'Photograph banners, kit, signage, and screens as they happen. Every photo is automatically timestamped and geo-tagged. Sponsors receive verified proof — not just a photo.',
  },
  {
    number: '04',
    title: 'Send your Proof Pack',
    description: 'At the end of the season, Sporr compiles everything into a professional proof of performance report — delivery score, audience reach, ROI metrics, photo evidence, and a renewal proposal. One click.',
  },
]

export default function Home() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const supabase = createClient()

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (error) { setError(error.message); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  return (
    <main className="min-h-screen bg-sporr-dark flex flex-col lg:flex-row">

      {/* LEFT PANEL — scrollable content */}
      <div className="lg:flex-1 px-8 py-12 lg:px-16 lg:py-20 flex flex-col">

        {/* Logo */}
        <div className="mb-16">
          <img
            src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
            alt="Sporr"
            className="h-16"
          />
        </div>

        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-sporr-cream text-4xl lg:text-5xl font-medium leading-tight mb-6 max-w-lg">
            Proof of sponsorship performance made easy
          </h1>
          <p className="text-sporr-sage text-lg leading-relaxed max-w-md">
            Sporr gives sports clubs the tools to capture, document, and deliver proof of sponsorship — automatically.
          </p>
        </div>

        {/* Sponsor link */}
        <div className="mb-16">
          <Link
            href="/sponsors"
            className="inline-flex items-center gap-3 border border-sporr-mid rounded-xl px-5 py-3 text-sporr-sage text-sm hover:border-sporr-sage hover:text-sporr-cream transition-colors"
          >
            <span className="text-xs uppercase tracking-widest font-medium text-sporr-muted">For sponsors</span>
            <span className="text-sporr-mid">·</span>
            <span>Discover your next sports partnership →</span>
          </Link>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <p className="text-sporr-sage text-xs uppercase tracking-widest font-medium mb-10">How it works</p>
          <div className="space-y-10">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sporr-mid flex items-center justify-center">
                  <span className="text-sporr-sage text-xs font-medium">{step.number}</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-sporr-cream font-medium text-lg mb-2">{step.title}</h3>
                  <p className="text-sporr-sage text-base leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <p className="text-sporr-sage text-xs uppercase tracking-widest font-medium mb-8">Built for clubs</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'No app download', description: 'Volunteers access the field auditor from a QR code in their browser' },
              { title: 'Multi-sponsor', description: 'One session captures proof for all sponsors simultaneously' },
              { title: 'Verified proof', description: 'Every photo is timestamped and geo-tagged automatically' },
              { title: 'GDPR compliant', description: 'All data stored in the EU — clubs control their own data' },
            ].map((f, i) => (
              <div key={i} className="bg-sporr-mid rounded-xl p-5">
                <p className="text-sporr-cream font-medium mb-1">{f.title}</p>
                <p className="text-sporr-sage text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-sporr-mid">
          <p className="text-sporr-muted text-xs">Sporr — proof of performance made easy · sporr.io</p>
        </div>

      </div>

      {/* RIGHT PANEL — fixed form */}
      <div className="lg:w-[440px] lg:flex-shrink-0 bg-sporr-cream lg:sticky lg:top-0 lg:h-screen flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Mode toggle */}
          <div className="flex gap-1 bg-sporr-sage-lt rounded-xl p-1 mb-8">
            <button
              onClick={() => { setMode('signup'); setError(null) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-sporr-dark shadow-sm'
                  : 'text-sporr-muted hover:text-sporr-dark'
              }`}
            >
              Create account
            </button>
            <button
              onClick={() => { setMode('login'); setError(null) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-sporr-dark shadow-sm'
                  : 'text-sporr-muted hover:text-sporr-dark'
              }`}
            >
              Sign in
            </button>
          </div>

          <h2 className="text-sporr-dark text-2xl font-medium mb-2">
            {mode === 'signup' ? 'Start for free' : 'Welcome back'}
          </h2>
          <p className="text-sporr-muted text-sm mb-8">
            {mode === 'signup'
              ? 'Set up your club in under ten minutes. No credit card required.'
              : 'Sign in to your Sporr dashboard.'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@yourclub.no"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sporr-dark text-sporr-cream font-medium py-3.5 rounded-lg hover:bg-sporr-mid transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <Link
                href="/signup"
                className="block w-full bg-sporr-dark text-sporr-cream font-medium py-3.5 rounded-lg hover:bg-sporr-mid transition-colors text-center"
              >
                Create your account →
              </Link>
              <p className="text-sporr-muted text-xs text-center">
                Free to start · No credit card required
              </p>
            </div>
          )}

        </div>
      </div>

    </main>
  )
}
