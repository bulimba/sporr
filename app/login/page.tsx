'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.error ? decodeURIComponent(searchParams.error) : null
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <img
            src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
            alt="Sporr"
            className="h-24 mx-auto mb-6"
          />
          <p className="text-sporr-cream text-base mt-2">
            Sign in to your account
          </p>
        </div>

        <div className="bg-sporr-mid rounded-2xl p-8">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-sporr-cream mb-1">
                Email address
              </label>
              <input
                name="email"
                type="email"
                className="w-full border border-sporr-sage rounded-lg px-4 py-3 text-sporr-dark placeholder-sporr-muted focus:outline-none focus:border-sporr-cream transition-colors duration-150 bg-sporr-cream text-base"
                placeholder="you@yourclub.no"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sporr-cream mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                className="w-full border border-sporr-sage rounded-lg px-4 py-3 text-sporr-dark placeholder-sporr-muted focus:outline-none focus:border-sporr-cream transition-colors duration-150 bg-sporr-cream text-base"
                placeholder="Your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sporr-cream text-sporr-dark font-medium px-6 py-4 rounded-lg hover:bg-sporr-sage-lt transition-colors duration-150 text-base mt-2 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sporr-cream text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-sporr-sage hover:text-sporr-cream transition-colors font-medium">
            Get started
          </Link>
        </p>
      </div>
    </main>
  )
}
