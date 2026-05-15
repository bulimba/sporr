'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const SPORTS_INTERESTS = [
  'Football', 'Handball', 'Golf', 'Cross country skiing', 'Cycling', 
  'Swimming', 'Athletics', 'Ice hockey', 'Basketball', 'Volleyball',
  'Tennis', 'Triathlon', 'Other',
]

const BUDGET_RANGES = [
  { value: '1500-5000', label: '1500 – 5000NOK' },
  { value: '5000-15000', label: '5000 – 15000NOK' },
  { value: '15000-50000', label: '15000 – 50000NOK' },
  { value: '50000-150000', label: '50000 – 150000NOK' },
  { value: '150000+', label: '150000NOK +' },
  { value: 'unsure', label: 'Not sure yet' },
]

const PARTNERSHIP_TYPES = [
  { value: 'club', label: 'Local club', description: 'Ongoing season partnership with a sports club' },
  { value: 'event', label: 'Event', description: 'Specific tournament, race, or mass-participation event' },
  { value: 'both', label: 'Both', description: 'Open to clubs and events' },
]

export default function SponsorsPage() {
  const supabase = createClient()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    location: '',
    budget_range: '',
    partnership_type: '',
    sports_interests: [] as string[],
    additional_info: '',
  })

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleSport = (sport: string) => {
    setForm(prev => {
      const current = prev.sports_interests
      if (current.includes(sport)) return { ...prev, sports_interests: current.filter(s => s !== sport) }
      return { ...prev, sports_interests: [...current, sport] }
    })
  }

  async function handleSubmit() {
    if (!form.company_name || !form.contact_email || !form.location) {
      setError('Please fill in company name, email, and location.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { error: saveError } = await supabase.from('sponsor_leads').insert({
      company_name: form.company_name,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone || null,
      location: form.location,
      budget_range: form.budget_range || null,
      partnership_type: form.partnership_type || null,
      sports_interests: form.sports_interests,
      additional_info: form.additional_info || null,
    })

    if (saveError) {
      setError('Something went wrong. Please try again or email us at hello@sporr.io')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-sporr-cream text-2xl font-medium mb-4">We'll be in touch</h1>
          <p className="text-sporr-sage text-base leading-relaxed mb-8">
            Thanks for your interest. We'll match you with clubs and events in your area and be in touch within a few days.
          </p>
          <Link href="/" className="btn-secondary inline-block">Back to Sporr</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-sporr-cream">

      {/* Nav */}
      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <img
            src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
            alt="Sporr" className="h-20"
          />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">Sign in</Link>
          <Link href="/signup" className="bg-sporr-cream text-sporr-dark text-sm font-medium px-4 py-2 rounded-lg hover:bg-sporr-sage-lt transition-colors">Club sign up</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-sporr-dark px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="flex-1">
              <p className="text-sporr-sage text-sm uppercase tracking-widest mb-4">For businesses</p>
              <h1 className="text-sporr-cream text-4xl font-medium mb-6 leading-tight">
                Discover your next sports partnership
              </h1>
              <p className="text-sporr-sage text-lg leading-relaxed mb-6">
                Find clubs, tournaments, and mass-participation events in your area. Tell us what you're looking for and we'll make the introduction.
              </p>
              <div className="inline-block bg-sporr-sage text-sporr-dark text-sm font-medium px-4 py-2 rounded-lg">
                Club packages from 1 500kr
              </div>
            </div>

            <div className="flex-1 bg-sporr-mid rounded-2xl p-6 w-full">
              <div className="space-y-3">
                {[
                  { icon: '📍', text: 'Local clubs and events in your area' },
                  { icon: '📊', text: 'Verified proof of delivery — see exactly what you get' },
                  { icon: '🤝', text: 'Direct introduction — no middlemen' },
                  { icon: '📄', text: 'Professional Proof Pack at end of season' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-sporr-cream text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-sporr-dark text-2xl font-medium mb-2">Tell us what you're looking for</h2>
        <p className="text-sporr-muted text-base mb-10">We'll match you with the right clubs and events and make the introduction.</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>}

        {/* Company details */}
        <div className="card mb-6">
          <h3 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Your details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Company name *</label>
              <input className="input" placeholder="Your company or organisation" value={form.company_name} onChange={e => update('company_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Your name</label>
              <input className="input" placeholder="Your full name" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Email address *</label>
              <input type="email" className="input" placeholder="you@company.no" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input className="input" placeholder="+47..." value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Your location *</label>
              <input className="input" placeholder="City or region — e.g. Stavanger, Rogaland" value={form.location} onChange={e => update('location', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Partnership type */}
        <div className="card mb-6">
          <h3 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">What are you looking to sponsor?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PARTNERSHIP_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => update('partnership_type', type.value)}
                className={`text-left p-4 rounded-xl border-2 transition-colors ${
                  form.partnership_type === type.value
                    ? 'border-sporr-dark bg-sporr-sage-lt'
                    : 'border-sporr-sage-lt bg-white hover:border-sporr-dark'
                }`}
              >
                <p className="text-sporr-dark font-medium mb-1">{type.label}</p>
                <p className="text-sporr-muted text-xs leading-relaxed">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sports interests */}
        <div className="card mb-6">
          <h3 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-2">Sports you're interested in</h3>
          <p className="text-sporr-muted text-sm mb-6">Select all that apply — or leave blank if you're open to any sport.</p>
          <div className="flex flex-wrap gap-2">
            {SPORTS_INTERESTS.map(sport => (
              <button
                key={sport}
                onClick={() => toggleSport(sport)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  form.sports_interests.includes(sport)
                    ? 'bg-sporr-dark text-sporr-cream'
                    : 'bg-sporr-sage-lt text-sporr-dark hover:bg-sporr-dark hover:text-sporr-cream'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="card mb-6">
          <h3 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Approximate annual budget</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BUDGET_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => update('budget_range', range.value)}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                  form.budget_range === range.value
                    ? 'border-sporr-dark bg-sporr-sage-lt text-sporr-dark font-medium'
                    : 'border-sporr-sage-lt bg-white text-sporr-muted hover:border-sporr-dark hover:text-sporr-dark'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional info */}
        <div className="card mb-8">
          <h3 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">Anything else we should know?</h3>
          <textarea
            className="input h-24 resize-none"
            placeholder="Specific events, clubs, or areas you have in mind. Any brand guidelines or restrictions. What you're hoping to achieve from the sponsorship."
            value={form.additional_info}
            onChange={e => update('additional_info', e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full text-base py-4 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Find my partnership →'}
        </button>

        <p className="text-sporr-muted text-xs text-center mt-4">
          We'll be in touch within a few days. Your details are never shared without your permission.
        </p>
      </div>

      {/* Footer */}
      <div className="bg-sporr-dark px-6 py-8 text-center">
        <p className="text-sporr-muted text-xs">Sporr — proof of performance made easy · sporr.io</p>
      </div>

    </main>
  )
}
