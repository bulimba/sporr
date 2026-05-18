'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ALL_SPORTS = [
 'Football', 'Handball', 'Gymnastics', 'Golf', 'Cross country skiing',
 'Cycling', 'Swimming', 'Athletics', 'Ice hockey', 'Basketball', 'Volleyball',
 'Badminton', 'Biathlon', 'Boxing', 'Chess', 'Cricket',
 'Curling', 'Dance', 'Darts', 'Esports', 'Fencing', 'Field Hockey', 'Futsal',
 'Gaelic Football', 'Hurling', 'Kayaking', 'Kickboxing', 'Marathons',
 'Martial arts', 'MMA', 'Motorsport', 'Netball', 'Padel', 'Pickleball',
 'Rowing', 'Rugby league', 'Rugby Union', 'Running', 'Sailing / Regatta',
 'Shooting', 'Skiing', 'Ski jumping', 'Snowboarding',
 'Tennis', 'Triathlon', 'Water polo', 'Other'
]

const PLANS = [
  {
    tier: 'club',
    label: 'Club',
    price: '490NOK/mnd',
    description: 'Up to 5 sponsors · All tiers · 10GB storage · Unlimited Proof Packs',
    selfServe: true,
    upgradableFrom: ['free'],
  },
  {
    tier: 'pro',
    label: 'Pro',
    price: '1490NOK/mnd',
    description: 'Up to 20 sponsors · 50GB storage · Priority support',
    selfServe: true,
    upgradableFrom: ['free', 'club'],
  },
  {
    tier: 'agency',
    label: 'Agency',
    price: '4900NOK/mnd',
    description: '5–50 clubs · 100GB storage · Dedicated support',
    selfServe: false,
    upgradableFrom: ['free', 'club', 'pro'],
  },
]

const STORAGE_LIMITS: Record<string, number> = {
  free: 100,
  club: 10240,
  pro: 51200,
  agency: 102400,
}

function formatStorage(mb: number): string {
  if (mb < 1024) return `${mb} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

type OrgData = {
  id: string; name: string; tier: string
  sports: string[] | null; country: string | null
  sponsorship_contact_name: string | null
  sponsorship_contact_email: string | null
  sponsorship_contact_phone: string | null
  governing_body_name: string | null
  governing_body_website: string | null
  logo_url: string | null
  show_logo_on_dashboard: boolean | null
}

type UserData = {
  id: string; full_name: string | null; email: string | null; role: string
}

export default function ClubPage() {
  const router = useRouter()
  const supabase = createClient()
  const sportSearchRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [org, setOrg] = useState<OrgData | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sportSearch, setSportSearch] = useState('')
  const [showSportDropdown, setShowSportDropdown] = useState(false)
  const [otherSportInput, setOtherSportInput] = useState('')
  const [showOtherInput, setShowOtherInput] = useState(false)
  const [upgradeTarget, setUpgradeTarget] = useState<typeof PLANS[0] | null>(null)
  const [upgradeMethod, setUpgradeMethod] = useState<'vipps' | 'card' | 'invoice' | null>(null)
  const [photoCount, setPhotoCount] = useState(0)

  // Crest state — managed independently, saves immediately
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [showLogoOnDashboard, setShowLogoOnDashboard] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [crestSaved, setCrestSaved] = useState(false)

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
    if (sport === 'Other') {
      setShowOtherInput(true)
      setShowSportDropdown(false)
      setSportSearch('')
      return
    }
    setForm(prev => {
      const current = prev.sports
      if (current.includes(sport)) return { ...prev, sports: current.filter(s => s !== sport) }
      if (current.length >= 4) return prev
      return { ...prev, sports: [...current, sport] }
    })
  }

  const addOtherSport = () => {
    const trimmed = otherSportInput.trim()
    if (!trimmed) return
    setForm(prev => {
      if (prev.sports.includes(trimmed) || prev.sports.length >= 4) return prev
      return { ...prev, sports: [...prev.sports, trimmed] }
    })
    setOtherSportInput('')
    setShowOtherInput(false)
  }

  const removeSport = (sport: string) => {
    setForm(prev => ({ ...prev, sports: prev.sports.filter(s => s !== sport) }))
  }

  const filteredSports = ALL_SPORTS.filter(s =>
    s.toLowerCase().includes(sportSearch.toLowerCase()) && !form.sports.includes(s)
  )

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const { data: userData } = await supabase
        .from('users').select('id, org_id, full_name, email, role').eq('id', session.user.id).single()
      if (!userData) { setLoading(false); return }
      setUser(userData as UserData)
      setOrgId(userData.org_id)
      const [orgRes, photosRes] = await Promise.all([
        supabase.from('organisations').select('id, name, tier, sports, country, sponsorship_contact_name, sponsorship_contact_email, sponsorship_contact_phone, governing_body_name, governing_body_website, logo_url, show_logo_on_dashboard').eq('id', userData.org_id).single(),
        supabase.from('proofs').select('id', { count: 'exact' }).eq('org_id', userData.org_id).not('photo_url', 'is', null),
      ])
      if (orgRes.data) {
        const o = orgRes.data as OrgData
        setOrg(o)
        setLogoUrl(o.logo_url)
        setShowLogoOnDashboard(o.show_logo_on_dashboard || false)
        setForm({
          name: o.name || '',
          sports: o.sports || [],
          country: o.country || 'NO',
          sponsorship_contact_name: o.sponsorship_contact_name || '',
          sponsorship_contact_email: o.sponsorship_contact_email || '',
          sponsorship_contact_phone: o.sponsorship_contact_phone || '',
          governing_body_name: o.governing_body_name || '',
          governing_body_website: o.governing_body_website || '',
        })
      }
      setPhotoCount(photosRes.count || 0)
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
      // Note: logo_url and show_logo_on_dashboard are NOT saved here — they save immediately in the crest section
    }).eq('id', orgId)
    if (saveError) { setError(saveError.message); setSaving(false); return }
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  // Crest: save logo_url immediately after upload
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !orgId) return
    setLogoError(null)

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowed.includes(file.type)) {
      setLogoError('Please upload a PNG, JPG, SVG or WebP file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('File too large — maximum 2MB.')
      return
    }

    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const path = `club-logos/${orgId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('club-assets')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setLogoError(uploadError.message)
      setUploadingLogo(false)
      return
    }

    const { data: urlData } = supabase.storage.from('club-assets').getPublicUrl(path)
    const newUrl = urlData.publicUrl
    setLogoUrl(newUrl)

    // Save immediately — independent of main Save Changes button
    await supabase.from('organisations').update({ logo_url: newUrl }).eq('id', orgId)
    setUploadingLogo(false)
    setCrestSaved(true)
    setTimeout(() => setCrestSaved(false), 2500)
  }

  // Crest: toggle saves immediately
  async function handleToggleShowOnDashboard() {
    if (!orgId) return
    const newVal = !showLogoOnDashboard
    setShowLogoOnDashboard(newVal)
    await supabase.from('organisations').update({ show_logo_on_dashboard: newVal }).eq('id', orgId)
    setCrestSaved(true)
    setTimeout(() => setCrestSaved(false), 2500)
  }

  // Crest: remove saves immediately
  async function handleRemoveLogo() {
    if (!orgId) return
    setLogoUrl(null)
    setShowLogoOnDashboard(false)
    await supabase.from('organisations').update({ logo_url: null, show_logo_on_dashboard: false }).eq('id', orgId)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const currentTier = org?.tier || 'free'
  const availablePlans = PLANS.filter(p => p.upgradableFrom.includes(currentTier))
  const estimatedUsageMB = photoCount * 1
  const tierLimit = STORAGE_LIMITS[currentTier] || 100
  const usagePct = Math.min(Math.round((estimatedUsageMB / tierLimit) * 100), 100)
  const nearLimit = usagePct >= 80

  if (loading) return (
    <main className="min-h-screen bg-sporr-cream flex items-center justify-center">
      <div className="text-sporr-muted text-sm">Loading...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-sporr-cream">

      {/* Upgrade modal */}
      {upgradeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            {!upgradeMethod ? (
              <>
                <p className="text-sporr-sage text-xs uppercase tracking-widest mb-1">Upgrade to</p>
                <h2 className="text-sporr-dark text-xl font-medium mb-1">{upgradeTarget.label}</h2>
                <p className="text-sporr-dark text-2xl font-medium mb-2">{upgradeTarget.price}</p>
                <p className="text-sporr-muted text-sm leading-relaxed mb-6">{upgradeTarget.description}</p>
                {upgradeTarget.selfServe ? (
                  <>
                    <p className="text-sporr-dark text-sm font-medium mb-3">Choose payment method</p>
                    <div className="space-y-3 mb-6">
                      <button onClick={() => setUpgradeMethod('vipps')} className="w-full flex items-center justify-between border-2 border-sporr-sage-lt rounded-xl px-4 py-3 hover:border-sporr-dark transition-colors">
                        <span className="text-sporr-dark font-medium">Vipps</span>
                        <span className="text-sporr-muted text-xs">Recommended for Norway</span>
                      </button>
                      <button onClick={() => setUpgradeMethod('card')} className="w-full flex items-center justify-between border-2 border-sporr-sage-lt rounded-xl px-4 py-3 hover:border-sporr-dark transition-colors">
                        <span className="text-sporr-dark font-medium">Card payment</span>
                        <span className="text-sporr-muted text-xs">Visa, Mastercard</span>
                      </button>
                      <button onClick={() => setUpgradeMethod('invoice')} className="w-full flex items-center justify-between border-2 border-sporr-sage-lt rounded-xl px-4 py-3 hover:border-sporr-dark transition-colors">
                        <span className="text-sporr-dark font-medium">Invoice</span>
                        <span className="text-sporr-muted text-xs">30-day payment terms</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sporr-muted text-sm leading-relaxed mb-6">This plan requires a tailored setup. Contact us and we'll get you onboarded within 24 hours.</p>
                    <a href={`mailto:hello@sporr.io?subject=Upgrade enquiry — ${upgradeTarget.label} plan&body=Hi Sporr team,%0A%0AI'd like to upgrade to the ${upgradeTarget.label} plan.%0A%0AClub: ${org?.name || ''}%0AContact: ${user?.email || ''}%0A%0APlease get in touch to discuss next steps.`}
                      className="block w-full bg-sporr-dark text-sporr-cream text-sm font-medium px-4 py-3 rounded-lg text-center hover:bg-sporr-mid transition-colors mb-3">
                      Contact Sporr →
                    </a>
                  </>
                )}
                <button onClick={() => { setUpgradeTarget(null); setUpgradeMethod(null) }} className="w-full btn-secondary text-sm py-2.5">Cancel</button>
              </>
            ) : (
              <>
                <p className="text-sporr-sage text-xs uppercase tracking-widest mb-1">
                  {upgradeMethod === 'vipps' ? 'Pay with Vipps' : upgradeMethod === 'card' ? 'Card payment' : 'Invoice'}
                </p>
                <h2 className="text-sporr-dark text-xl font-medium mb-4">{upgradeTarget.label} — {upgradeTarget.price}</h2>
                <div className="bg-sporr-sage-lt rounded-xl p-5 text-center mb-6">
                  <p className="text-sporr-dark font-medium mb-1">Coming soon</p>
                  <p className="text-sporr-muted text-sm leading-relaxed">
                    {upgradeMethod === 'vipps' && 'Vipps payment is being set up. In the meantime, contact us to upgrade by invoice.'}
                    {upgradeMethod === 'card' && 'Card payment via Stripe is being set up. In the meantime, contact us to upgrade by invoice.'}
                    {upgradeMethod === 'invoice' && "Invoice payments are being set up. Contact us directly and we'll invoice you within 24 hours."}
                  </p>
                </div>
                <a href={`mailto:hello@sporr.io?subject=Upgrade to ${upgradeTarget.label} — ${upgradeMethod}&body=Hi Sporr team,%0A%0AI'd like to upgrade to the ${upgradeTarget.label} plan via ${upgradeMethod}.%0A%0AClub: ${org?.name || ''}%0AContact: ${user?.email || ''}%0A%0APlease get in touch to complete the upgrade.`}
                  className="block w-full bg-sporr-dark text-sporr-cream text-sm font-medium px-4 py-3 rounded-lg text-center hover:bg-sporr-mid transition-colors mb-3">
                  Contact us to complete upgrade →
                </a>
                <button onClick={() => setUpgradeMethod(null)} className="w-full btn-secondary text-sm py-2.5">← Back</button>
              </>
            )}
          </div>
        </div>
      )}

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
            <div>
              <label className="label">Sports represented <span className="text-sporr-muted font-normal">(up to 4)</span></label>
              {form.sports.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.sports.map(sport => (
                    <span key={sport} className="flex items-center gap-1 bg-sporr-dark text-sporr-cream text-sm px-3 py-1 rounded-full">
                      {sport}
                      <button onClick={() => removeSport(sport)} className="text-sporr-sage hover:text-sporr-cream ml-1 leading-none">✕</button>
                    </span>
                  ))}
                </div>
              )}
              {form.sports.length < 4 && !showOtherInput && (
                <div className="relative">
                  <input ref={sportSearchRef} className="input" placeholder="Type to search sports..." value={sportSearch}
                    onChange={e => { setSportSearch(e.target.value); setShowSportDropdown(true) }}
                    onFocus={() => setShowSportDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSportDropdown(false), 150)}
                  />
                  {showSportDropdown && filteredSports.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 bg-white border border-sporr-sage-lt rounded-lg shadow-lg mt-1 max-h-56 overflow-y-auto">
                      {filteredSports.map(sport => (
                        <button key={sport}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-sporr-sage-lt transition-colors ${sport === 'Other' ? 'text-sporr-muted italic border-t border-sporr-sage-lt' : 'text-sporr-dark'}`}
                          onMouseDown={() => { toggleSport(sport); setSportSearch('') }}>
                          {sport === 'Other' ? '+ Add a sport not listed here' : sport}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {showOtherInput && (
                <div className="flex gap-2 mt-1">
                  <input className="input flex-1" placeholder="Type the sport name..." value={otherSportInput}
                    onChange={e => setOtherSportInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addOtherSport() }} autoFocus />
                  <button onClick={addOtherSport} className="btn-primary text-sm py-2 px-4">Add</button>
                  <button onClick={() => { setShowOtherInput(false); setOtherSportInput('') }} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                </div>
              )}
              {form.sports.length >= 4 && <p className="text-sporr-muted text-xs mt-1">Maximum of 4 sports selected. Remove one to add another.</p>}
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

        {/* Club crest — Fix 3: self-contained, all actions save immediately */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest">Club crest</h2>
            {crestSaved && (
              <span className="text-sporr-mid text-xs font-medium flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Saved
              </span>
            )}
          </div>
          <p className="text-sporr-muted text-sm mb-6">
            Upload your club crest to personalise your dashboard. Supports PNG, JPG, SVG and WebP up to 2MB.
            All crest shapes are supported — shields, pennants, flags, and irregular historic badges.
          </p>

          {logoError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{logoError}</div>
          )}

          {logoUrl ? (
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-xl bg-sporr-cream border border-sporr-sage-lt flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                <img src={logoUrl} alt="Club crest" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1">
                <p className="text-sporr-dark text-sm font-medium mb-1">Crest uploaded</p>
                <p className="text-sporr-muted text-xs mb-4 leading-relaxed">
                  Your crest is displayed on a cream background to ensure it looks great regardless of its original background colour.
                </p>

                {/* Toggle — saves immediately on click */}
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <div
                    onClick={handleToggleShowOnDashboard}
                    className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${showLogoOnDashboard ? 'bg-sporr-dark' : 'bg-sporr-sage-lt'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${showLogoOnDashboard ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <p className="text-sporr-dark text-sm font-medium">Show crest on dashboard</p>
                    <p className="text-sporr-muted text-xs">Replaces the sport kit illustration on your dashboard</p>
                  </div>
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="btn-secondary text-sm py-2 px-4"
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? 'Uploading...' : 'Replace crest'}
                  </button>
                  <button
                    onClick={handleRemoveLogo}
                    className="text-sporr-muted hover:text-red-600 text-sm transition-colors px-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full border-2 border-dashed border-sporr-sage-lt rounded-xl px-6 py-8 hover:border-sporr-dark transition-colors text-center group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-sporr-sage-lt group-hover:bg-sporr-dark/10 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-sporr-muted group-hover:text-sporr-dark transition-colors">
                    <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 16.5V18.75C3 19.993 4.007 21 5.25 21H18.75C19.993 21 21 19.993 21 18.75V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-sporr-dark text-sm font-medium mb-1">
                  {uploadingLogo ? 'Uploading...' : 'Upload your club crest'}
                </p>
                <p className="text-sporr-muted text-xs">PNG, JPG, SVG or WebP · max 2MB</p>
                <p className="text-sporr-muted text-xs mt-1">All crest shapes supported — shields, pennants, flags</p>
              </button>
            </div>
          )}

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleLogoUpload}
          />
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
          <p className="text-sporr-muted text-sm mb-6">If your club is affiliated with a sports federation or governing body.</p>
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

        {/* Storage usage */}
        <div className="card mb-6">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">Storage</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sporr-muted text-sm">{formatStorage(estimatedUsageMB)} used</span>
            <span className="text-sporr-dark text-sm font-medium">{formatStorage(tierLimit)} included</span>
          </div>
          <div className="h-2 bg-sporr-sage-lt rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${usagePct >= 100 ? 'bg-red-600' : usagePct >= 80 ? 'bg-amber-500' : 'bg-sporr-dark'}`}
              style={{ width: `${Math.max(usagePct, 2)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sporr-muted text-xs">{photoCount} proof photo{photoCount !== 1 ? 's' : ''} · estimated usage</p>
            <p className={`text-xs font-medium ${usagePct >= 100 ? 'text-red-600' : usagePct >= 80 ? 'text-amber-600' : 'text-sporr-muted'}`}>{usagePct}% used</p>
          </div>
          {nearLimit && (
            <div className={`mt-3 rounded-lg px-4 py-3 ${usagePct >= 100 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`text-sm ${usagePct >= 100 ? 'text-red-700' : 'text-amber-700'}`}>
                {usagePct >= 100 ? 'Storage full — upgrade your plan to continue capturing proof photos.' : 'Storage nearly full — consider upgrading before your next match day.'}
              </p>
            </div>
          )}
          <p className="text-sporr-muted text-xs mt-2">Storage is estimated based on photo uploads. Actual usage may vary.</p>
        </div>

        {/* Upgrade plan */}
        {availablePlans.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-2">Upgrade your plan</h2>
            <p className="text-sporr-muted text-sm mb-6">
              You're on the <strong className="text-sporr-dark capitalize">{currentTier}</strong> plan. Upgrade to unlock more sponsors, storage, and features.
            </p>
            <div className="space-y-3">
              {availablePlans.map(plan => (
                <div key={plan.tier} className="flex items-center justify-between border border-sporr-sage-lt rounded-xl px-4 py-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sporr-dark font-medium">{plan.label}</p>
                      <span className="text-sporr-dark text-sm font-medium">— {plan.price}</span>
                    </div>
                    <p className="text-sporr-muted text-xs leading-relaxed">{plan.description}</p>
                  </div>
                  <button
                    onClick={() => { setUpgradeTarget(plan); setUpgradeMethod(null) }}
                    className="bg-sporr-dark text-sporr-cream text-sm font-medium px-4 py-2 rounded-lg hover:bg-sporr-mid transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    Upgrade →
                  </button>
                </div>
              ))}
              <div className="border border-sporr-sage-lt rounded-xl px-4 py-4">
                <p className="text-sporr-dark font-medium mb-0.5">Federation, Enterprise & CSR</p>
                <p className="text-sporr-muted text-xs leading-relaxed mb-3">9900–500000NOK/yr · Custom setup · Dedicated support</p>
                <a href={`mailto:hello@sporr.io?subject=Enterprise enquiry&body=Hi Sporr team,%0A%0AClub: ${org?.name || ''}%0AContact: ${user?.email || ''}%0A%0AI'm interested in a Federation, Enterprise, or CSR plan. Please get in touch.`}
                  className="text-sporr-dark text-sm underline hover:text-sporr-mid transition-colors">
                  Contact Sporr to discuss →
                </a>
              </div>
            </div>
          </div>
        )}

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
