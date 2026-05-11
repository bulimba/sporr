'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    // Step 1 — account
    email: '',
    password: '',
    full_name: '',
    // Step 2 — organisation
    org_name: '',
    sport: '',
    division: '',
  })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  async function handleSignup() {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Signup failed — please try again.')
      setLoading(false)
      return
    }

    // 2. Create organisation
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({ name: form.org_name, tier: 'free', country: 'NO' })
      .select()
      .single()

    if (orgError) {
      setError(orgError.message)
      setLoading(false)
      return
    }

    // 3. Create user record linked to organisation
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        org_id: org.id,
        full_name: form.full_name,
        email: form.email,
        role: 'admin',
      })

    if (userError) {
      setError(userError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="text-sporr-sage text-5xl mb-6">✓</div>
          <h1 className="text-sporr-cream text-2xl font-medium mb-4">
            Check your email
          </h1>
          <p className="text-sporr-sage leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="text-sporr-cream">{form.email}</span>.
            Click it to activate your account and access your dashboard.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/">
            <span className="text-sporr-cream font-medium tracking-[0.25em] text-2xl">
              SPORR
            </span>
          </Link>
          <p className="text-sporr-sage text-sm mt-2">
            {step === 1 ? 'Create your account' : 'Tell us about your club'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? 'bg-sporr-sage' : 'bg-sporr-mid'
              }`}
            />
          ))}
        </div>

        {/* Form card */}
        <div className="bg-sporr-mid rounded-2xl p-8">

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="label text-sporr-sage">Full name</label>
                <input
                  className="input bg-sporr-cream border-sporr-sage text-sporr-dark placeholder-sporr-muted"
                  placeholder="Your name"
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                />
              </div>
              <div>
                <label className="label text-sporr-sage">Email address</label>
                <input
                  type="email"
                  className="input bg-sporr-cream border-sporr-sage text-sporr-dark placeholder-sporr-muted"
                  placeholder="you@yourclub.no"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                />
              </div>
              <div>
                <label className="label text-sporr-sage">Password</label>
                <input
                  type="password"
                  className="input bg-sporr-cream border-sporr-sage text-sporr-dark placeholder-sporr-muted"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  if (!form.full_name || !form.email || form.password.length < 8) {
                    setError('Please fill in all fields. Password must be at least 8 characters.')
                    return
                  }
                  setError(null)
                  setStep(2)
                }}
                className="w-full btn-primary mt-2"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="label text-sporr-sage">Club or organisation name</label>
                <input
                  className="input bg-sporr-cream border-sporr-sage text-sporr-dark placeholder-sporr-muted"
                  placeholder="FK Sandnes Ulf"
                  value={form.org_name}
                  onChange={e => update('org_name', e.target.value)}
                />
              </div>
              <div>
                <label className="label text-sporr-sage">Sport</label>
                <input
                  className="input bg-sporr-cream border-sporr-sage text-sporr-dark placeholder-sporr-muted"
                  placeholder="Football, handball, volleyball..."
                  value={form.sport}
                  onChange={e => update('sport', e.target.value)}
                />
              </div>
              <div>
                <label className="label text-sporr-sage">Division or level</label>
                <input
                  className="input bg-sporr-cream border-sporr-sage text-sporr-dark placeholder-sporr-muted"
                  placeholder="Eliteserien, Division 1, Local league..."
                  value={form.division}
                  onChange={e => update('division', e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!form.org_name) {
                      setError('Please enter your club name.')
                      return
                    }
                    setError(null)
                    handleSignup()
                  }}
                  disabled={loading}
                  className="flex-2 btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Sign in link */}
        <p className="text-center text-sporr-muted text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-sporr-sage hover:text-sporr-cream transition-colors">
            Sign in
          </Link>
        </p>

      </div>
    </main>
  )
}
