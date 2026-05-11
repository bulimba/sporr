'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', password: '' })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  async function handleLogin() {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
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
            Sign in to your account
          </p>
        </div>

        {/* Form card */}
        <div className="bg-sporr-mid rounded-2xl p-8">

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="label text-sporr-sage">Email address</label>
              <input
                type="email"
                className="input bg-sporr-dark border-sporr-dark text-sporr-cream placeholder-sporr-muted"
                placeholder="you@yourclub.no"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="label text-sporr-sage">Password</label>
              <input
                type="password"
                className="input bg-sporr-dark border-sporr-dark text-sporr-cream placeholder-sporr-muted"
                placeholder="Your password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full btn-primary mt-2 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

        </div>

        {/* Sign up link */}
        <p className="text-center text-sporr-muted text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-sporr-sage hover:text-sporr-cream transition-colors">
            Get started
          </Link>
        </p>

      </div>
    </main>
  )
}
