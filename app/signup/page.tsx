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
    email: '',
    password: '',
    full_name: '',
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

    const callbackUrl = `${window.location.origin}/auth/callback?org_name=${encodeURIComponent(form.org_name)}&full_name=${encodeURIComponent(form.full_name)}&email=${encodeURIComponent(form.email)}`

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name },
        emailRedirectTo: callbackUrl,
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: org } = await supabase
        .from('organisations')
        .insert({ name: form.org_name, tier: 'free', country: 'NO' })
        .select()
        .single()

      if (org) {
        await supabase
          .from('users')
          .insert({
            id: session.user.id,
            org_id: org.id,
            full_name: form.full_name,
            email: form.email,
            role: 'admin',
          })
      }
      window.location.href = '/dashboard'
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

        <div className="bg-sporr-mid rounded-2xl p-8"
