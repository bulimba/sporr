'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ALL_SPORTS = [
 'Football', 'Golf', 'Handball', 'Gymnastics', 'Cross country skiing',
 'Cycling', 'Swimming', 'Athletics', 'Ice hockey', 'Basketball', 'Volleyball',
 'Badminton', 'Beach volleyball', 'Biathlon', 'Boxing', 'Chess', 'Cricket',
 'Curling', 'Dance', 'Darts', 'Esports', 'Fencing', 'Field Hockey', 'Futsal',
 'Gaelic Football', 'Hurling', 'Kayaking', 'Kickboxing', 'Marathons',
 'Martial arts', 'MMA', 'Motorsport', 'Netball', 'Padel', 'Pickleball',
 'Rowing', 'Rugby league', 'Rugby Union', 'Running', 'Sailing / Regatta',
 'Shooting', 'Skateboarding', 'Skiing', 'Ski jumping', 'Snowboarding',
 'Squash', 'Table tennis', 'Tennis', 'Triathlon', 'Water polo', 'Other'
]

type OrgData = {
  id: string; name: string; tier: string
  sports: string[] | null; country: string | null
  sponsorship_contact_name: string | null
  sponsorship_contact_email: string | null
  sponsorship_contact_phone: string | null
  governing_body_name: string | null
  governing_body_website: string | null
}

type UserData = {
  id: string; full_name: string | null; email: string | null; role: string
}

export default function ClubPage() {
  const router = useRouter()
  const supabase = createClient()
  const sportSearchRef = useRef<HTMLInputElement>(null)

  const [org, setOrg] = useState<OrgData | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sportSearch, setSportSearch] = useState('')
  const [showSportDropdown, setShowSportDropdown] = useState(false)

  const [form, setForm] = useState({
    name: '',
    sports: [] as string[],
    country: 'NO',
    sponsorship_contact_name: '',
    sponsorship_contact_email: '',
    sponsorship_contact_phone: '',
    governing_body_name: '',
    governing_body_website: '',
  })

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleSport = (sport: string) => {
    setForm(prev => {
      const current = prev.sports
      if (current.includes(sport)) return { ...prev, sports: current.filter(s => s !== sport) }
      if (current.length >= 4) return prev
      return { ...prev, sports: [...current, sport] }
    })
  }

  const filteredSports = ALL_SPORTS.filter(s =>
    s.toLowerCase().includes(sportSearch.toLowerCase()) && !form.sports.includes(s)
  )

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: userData } = await supabase.from('users').select('id, org_id, full_name, email, role').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      setUser(userData as UserData)
      setOrgId(userData.org_id)

      const { data: orgData } = await supabase.from('organisations').select('id, name, tier, sports, country, sponsorship_contact_name, sponsorship_contact_email, sponsorship_contact_phone, governing_body_name, governing_body_website').eq('id', userData.org_id).single()

      if (orgData) {
        setOrg(orgData as OrgData)
        setForm({
          name: orgData.name || '',
          sports: orgData.sports || [],
          country: orgData.country || 'NO',
          sponsorship_contact_name: orgData.sponsorship_contact_name || '',
          sponsorship_contact_email: orgData.sponsorship_contact_email || '',
          sponsorship_contact_phone: orgData.sponsorship_contact_phone || '',
          governing_body_name: orgData.governing_body_name || '',
          governing_body_website: orgData.governing_body_website || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!orgId) return
    setSaving(true); setError(null); setSaved(false)

    const { error: saveError } = await supabase.from('organisations').update({
      name: form.name,
      sports: form.sports,
      country: form.country,
      sponsorship_contact_name: form.sponsorship_contact_name || null,
      sponsorship_contact_email: form.sponsorship_contact_email || null,
      sponsorship_contact_phone: form.sponsorship_contact_phone || null,
      governing_body_name: form.governing_body_name || null,
      governing_body_website: form.governing_body_website || null,
    }).eq('id', orgId)

    if (saveError) { setError(saveError.message); setSaving(false); return }
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <main className="min-h-screen bg-sporr-cream flex items-center justify-center">
      <div className="text-sporr-muted text-sm">Loading...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-sporr-cream">
      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard">
          <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" />
        </Link>
        <Link href="/dashboard" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">← Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-sporr-dark text-2xl font-medium mb-1">Your club</h1>
          <p className="text-sporr-muted text-sm">Club profile and account settings</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>}
        {saved && <div className="bg-sporr-sage-lt border border-sporr-sage text-sporr-dark text-sm rounded-lg px-4 py-3 mb-6">✓ Changes saved</div>}

        {/* Club profile */}
        <div className="card mb-6">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Club profile</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Club name</label>
              <input className="input" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>

            {/* Sports represented */}
            <div>
              <label className="label">Sports represented <span className="text-sporr-muted font-normal">(up to 4)</span></label>

              {/* Selected sports tags */}
              {form.sports.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.sports.map(sport => (
                    <span key={sport} className="flex items-center gap-1 bg-sporr-dark text-sporr-cream text-sm px-3 py-1 rounded-full">
                      {sport}
                      <button onClick={() => toggleSport(sport)} className="text-sporr-sage hover:text-sporr-cream ml-1">✕</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search input */}
              {form.sports.length < 4 && (
                <div className="relative">
                  <input
                    ref={sportSearchRef}
                    className="input"
                    placeholder="Type to search sports..."
                    value={sportSearch}
                    onChange={e => { setSportSearch(e.target.value); setShowSportDropdown(true) }}
                    onFocus={() => setShowSportDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSportDropdown(false), 150)}
                  />
                  {showSportDropdown && filteredSports.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 bg-white border border-sporr-sage-lt rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {filteredSports.map(sport => (
                        <button
                          key={sport}
                          className="w-full text-left px-4 py-2.5 text-sporr-dark text-sm hover:bg-sporr-sage-lt transition-colors"
                          onMouseDown={() => { toggleSport(sport); setSportSearch(''); }}
                        >
                          {sport}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {form.sports.length >= 4 && (
                <p className="text-sporr-muted text-xs mt-1">Maximum of 4 sports selected. Remove one to add another.</p>
              )}
            </div>

            <div>
              <label className="label">Country</label>
              <select className="input" value={form.country} onChange={e => update('country', e.target.value)}>
                <option value="NO">Norway</option>
                <option value="SE">Sweden</option>
                <option value="DK">Denmark</option>
                <option value="FI">Finland</option>
                <option value="IE">Ireland</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="NZ">New Zealand</option>
                <option value="DE">Germany</option>
                <option value="NL">Netherlands</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sponsorship contact */}
        <div className="card mb-6">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-2">Sponsorship contact</h2>
          <p className="text-sporr-muted text-sm mb-6">The person at your club who handles sponsorship relationships — appears on Proof Packs sent to sponsors.</p>
          <div className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" placeholder="Club president, GM, or sponsorship manager" value={form.sponsorship_contact_name} onChange={e => update('sponsorship_contact_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="sponsorship@yourclub.no" value={form.sponsorship_contact_email} onChange={e => update('sponsorship_contact_email', e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="+47..." value={form.sponsorship_contact_phone} onChange={e => update('sponsorship_contact_phone', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Governing body */}
        <div className="card mb-6">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-2">Governing body</h2>
          <p className="text-sporr-muted text-sm mb-6">If your club is affiliated with a sports federation or governing body — particularly relevant if sponsors distribute funds through a federation.</p>
          <div className="space-y-4">
            <div>
              <label className="label">Governing body name</label>
              <input className="input" placeholder="e.g. Norges Fotballforbund, Handball Norway..." value={form.governing_body_name} onChange={e => update('governing_body_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Website (optional)</label>
              <input className="input" placeholder="https://..." value={form.governing_body_website} onChange={e => update('governing_body_website', e.target.value)} />
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full mb-10 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save changes'}
        </button>

        {/* Your account */}
        <div className="card mb-6">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Your account</h2>
          <div className="space-y-3">
            {[
              ['Name', user?.full_name || '—'],
              ['Email', user?.email || '—'],
              ['Role', user?.role || '—'],
              ['Plan', org?.tier || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-sporr-sage-lt last:border-0">
                <span className="text-sporr-muted text-sm">{label}</span>
                <span className="text-sporr-dark text-sm font-medium capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Account actions */}
        <div className="card">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">Account actions</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sporr-dark text-sm font-medium">Sign out</p>
                <p className="text-sporr-muted text-xs mt-0.5">Sign out of Sporr on this device</p>
              </div>
              <button onClick={handleSignOut} className="btn-secondary text-sm py-2 px-4">Sign out</button>
            </div>
            <div className="border-t border-sporr-sage-lt pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sporr-dark text-sm font-medium">Request data deletion</p>
                  <p className="text-sporr-muted text-xs mt-0.5">To delete your account and all data, contact us</p>
                </div>
                <a href="mailto:privacy@sporr.io" className="btn-secondary text-sm py-2 px-4">Contact us</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
