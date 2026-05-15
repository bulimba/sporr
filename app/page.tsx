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
  const [rightMode, setRightMode] = useState<'account' | 'reset'>('account')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', password: '', resetEmail: '' })
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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(form.resetEmail, {
      redirectTo: `${window.location.origin}/dashboard`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setResetSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-sporr-dark flex flex-col lg:flex-row">

      {/* ── RIGHT PANEL — sticky account panel ── */}
      <div className="lg:w-[440px] lg:flex-shrink-0 bg-sporr-cream lg:sticky lg:top-0 lg:h-screen flex flex-col px-8 py-12 lg:py-0 lg:order-last">

        {/* Logo on right panel */}
        <div className="hidden lg:flex items-center h-24 flex-shrink-0 border-b border-sporr-sage-lt">
          <img
            src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
            alt="Sporr"
            className="h-12"
          />
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto">

            {rightMode === 'account' && (
              <>
                <h2 className="text-sporr-dark text-2xl font-medium mb-8">My account</h2>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4 mb-4">
                  <div>
                    <label className="label">Sign in</label>
                    <input
                      type="email"
                      className="input mb-3"
                      placeholder="Email address"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      className="input"
                      placeholder="Password"
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => { setRightMode('reset'); setError(null) }}
                    className="text-sporr-muted text-sm hover:text-sporr-dark transition-colors"
                  >
                    Forgot password?
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-sporr-dark text-sporr-cream font-medium py-3.5 rounded-lg hover:bg-sporr-mid transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </form>

                <div className="border-t border-sporr-sage-lt pt-6 flex items-center justify-between gap-4">
                  <p className="text-sporr-muted text-sm">Don't have an account?</p>
                  <Link
                    href="/signup"
                    className="bg-red-700 hover:bg-red-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Create account
                  </Link>
                </div>
              </>
            )}

            {rightMode === 'reset' && (
              <>
                <button
                  onClick={() => { setRightMode('account'); setError(null); setResetSent(false) }}
                  className="text-sporr-muted text-sm hover:text-sporr-dark transition-colors mb-6 flex items-center gap-1"
                >
                  ← Back to sign in
                </button>

                <h2 className="text-sporr-dark text-2xl font-medium mb-2">Reset password</h2>
                <p className="text-sporr-muted text-sm mb-8">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                    {error}
                  </div>
                )}

                {resetSent ? (
                  <div className="bg-sporr-sage-lt border border-sporr-sage rounded-lg px-4 py-4 text-center">
                    <p className="text-sporr-dark font-medium mb-1">Check your inbox</p>
                    <p className="text-sporr-muted text-sm">We've sent a password reset link to {form.resetEmail}</p>
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div>
                      <label className="label">Email address</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="you@yourclub.no"
                        value={form.resetEmail}
                        onChange={e => update('resetEmail', e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-sporr-dark text-sporr-cream font-medium py-3.5 rounded-lg hover:bg-sporr-mid transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send reset link'}
                    </button>
                  </form>
                )}
              </>
            )}

          </div>
        </div>

        {/* Right panel footer */}
        <div className="hidden lg:block h-12 flex-shrink-0 border-t border-sporr-sage-lt" />

      </div>


      {/* ── LEFT PANEL — scrollable content ── */}
      <div className="lg:flex-1 px-8 py-12 lg:px-16 lg:py-20 flex flex-col lg:order-first">

        {/* Logo — sticky on desktop */}
        <div className="lg:sticky lg:top-0 lg:bg-sporr-dark lg:pt-6 lg:pb-4 lg:z-10 mb-12">
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

        {/* Sponsor link — larger */}
        <div className="mb-16">
          <Link
            href="/sponsors"
            className="inline-flex items-center gap-3 border border-red-500 rounded-2xl px-6 py-4 hover:border-red-700 transition-colors group"
          >
            <span className="text-sporr-cream text-sm uppercase tracking-widest font-medium">For sponsors</span>
            <span className="text-sporr-mid">·</span>
            <span className="text-sporr-cream text-lg font-medium group-hover:text-sporr-sage transition-colors">
              Discover your next sports partnership →
            </span>
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
                <p className="text-sporr-cream text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-sporr-mid">
          <div className="flex items-center gap-4 flex-wrap">
  <p className="text-sporr-cream text-xs">Sporr — proof of performance made easy · sporr.io</p>
  <Link href="/terms" className="text-sporr-cream text-xs hover:text-sporr-muted transition-colors">Terms</Link>
  <Link href="/privacy" className="text-sporr-cream text-xs hover:text-sporr-muted transition-colors">Privacy</Link>
</div>
        </div>

      </div>

    </main>
  )
}
