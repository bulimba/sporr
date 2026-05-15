import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Snapshot = {
  id: string
  token: string
  sponsor_name: string
  club_name: string
  contract_title: string
  season: string
  delivery_score: number
  delivered_count: number
  total_count: number
  total_attendance: number
  total_impressions: number
  contract_value_nok: number
  estimated_media_value_nok: number
  roi_multiple: string | null
  cost_per_person: string | null
  thank_you_message: string | null
  club_contact_name: string | null
  renewal_package: string | null
  renewal_value_nok: number | null
  media_coverage: string | null
  total_fixtures: string | null
  obligations: { description: string; proof_type: string; status: string }[]
  photo_urls: { url: string; description: string; captured_at: string; geo_lat: number | null }[]
  created_at: string
}

const nok = (val: number) => `Kr ${val.toLocaleString('nb-NO')}`

export default async function PackPage({ params }: { params: { token: string } }) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('proof_pack_snapshots')
    .select('*')
    .eq('token', params.token)
    .single()

  if (error || !data) notFound()

  const snap = data as Snapshot
  const totalReach = (snap.total_attendance || 0) + (snap.total_impressions || 0)
  const renewalUplift = snap.contract_value_nok && snap.renewal_value_nok
    ? Math.round(((snap.renewal_value_nok - snap.contract_value_nok) / snap.contract_value_nok) * 100)
    : null
  const dateStr = new Date(snap.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const delivered = snap.obligations?.filter(o => o.status === 'delivered') || []
  const pending = snap.obligations?.filter(o => o.status === 'pending') || []

  return (
    <main className="min-h-screen bg-sporr-cream">

      {/* Nav */}
      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <img
          src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
          alt="Sporr"
          className="h-16"
        />
        <span className="text-sporr-sage text-xs uppercase tracking-widest">Proof of Performance Report</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Cover */}
        <div className="bg-sporr-dark rounded-2xl p-8 mb-8">
          <p className="text-sporr-sage text-xs uppercase tracking-widest mb-2">Prepared for</p>
          <h1 className="text-sporr-cream text-3xl font-medium mb-1">{snap.sponsor_name}</h1>
          <p className="text-sporr-sage text-base mb-1">{snap.club_name}</p>
          <p className="text-sporr-muted text-sm mb-8">{snap.contract_title} · {snap.season}</p>

          {/* Delivery score hero */}
          <div className="flex items-end gap-6 mb-6">
            <div>
              <p className="text-sporr-cream text-6xl font-medium leading-none mb-1">{snap.delivery_score}%</p>
              <p className="text-sporr-sage text-xs uppercase tracking-widest">Delivery score</p>
            </div>
            <div className="flex-1 pb-2">
              <div className="h-2 bg-sporr-mid rounded-full overflow-hidden">
                <div
                  className="h-full bg-sporr-sage rounded-full"
                  style={{ width: `${snap.delivery_score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Key stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="border-t border-sporr-mid pt-4">
              <p className="text-sporr-sage text-xs uppercase tracking-widest mb-1">Delivered</p>
              <p className="text-sporr-cream text-xl font-medium">{snap.delivered_count} of {snap.total_count}</p>
            </div>
            {snap.total_attendance > 0 && (
              <div className="border-t border-sporr-mid pt-4">
                <p className="text-sporr-sage text-xs uppercase tracking-widest mb-1">Season attendance</p>
                <p className="text-sporr-cream text-xl font-medium">{snap.total_attendance.toLocaleString('nb-NO')}</p>
              </div>
            )}
            {totalReach > 0 && (
              <div className="border-t border-sporr-mid pt-4">
                <p className="text-sporr-sage text-xs uppercase tracking-widest mb-1">Total reach</p>
                <p className="text-sporr-cream text-xl font-medium">{totalReach.toLocaleString('nb-NO')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Thank you message */}
        {snap.thank_you_message && (
          <div className="card mb-6">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">A message from {snap.club_name}</h2>
            <div className="border-l-4 border-sporr-dark pl-5">
              <p className="text-sporr-dark leading-relaxed whitespace-pre-wrap">{snap.thank_you_message}</p>
              {snap.club_contact_name && (
                <p className="text-sporr-muted text-sm mt-3 italic">— {snap.club_contact_name}, {snap.club_name}</p>
              )}
            </div>
          </div>
        )}

        {/* Season at a glance */}
        <div className="card mb-6">
          <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Season at a glance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { num: snap.total_fixtures || '—', label: 'Fixtures' },
              { num: snap.total_count, label: 'Contracted' },
              { num: snap.delivered_count, label: 'Delivered' },
              { num: `${snap.delivery_score}%`, label: 'Score', dark: true },
            ].map((s, i) => (
              <div key={i} className={`rounded-xl p-4 text-center ${s.dark ? 'bg-sporr-dark' : 'bg-sporr-sage-lt'}`}>
                <p className={`text-2xl font-medium mb-1 ${s.dark ? 'text-sporr-cream' : 'text-sporr-dark'}`}>{s.num}</p>
                <p className={`text-xs uppercase tracking-widest ${s.dark ? 'text-sporr-sage' : 'text-sporr-muted'}`}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="h-2 bg-sporr-sage-lt rounded-full overflow-hidden">
            <div className="h-full bg-sporr-dark rounded-full" style={{ width: `${snap.delivery_score}%` }} />
          </div>
        </div>

        {/* Audience & ROI */}
        {(snap.total_attendance > 0 || snap.total_impressions > 0) && (
          <div className="card mb-6">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Audience & exposure</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {snap.total_attendance > 0 && (
                <div className="border border-sporr-sage-lt rounded-xl p-5 text-center">
                  <p className="text-sporr-dark text-2xl font-medium mb-1">{snap.total_attendance.toLocaleString('nb-NO')}</p>
                  <p className="text-sporr-muted text-xs uppercase tracking-widest">Live attendance</p>
                  {snap.total_fixtures && <p className="text-sporr-muted text-xs mt-1">across {snap.total_fixtures} fixtures</p>}
                </div>
              )}
              {snap.total_impressions > 0 && (
                <div className="border border-sporr-sage-lt rounded-xl p-5 text-center">
                  <p className="text-sporr-dark text-2xl font-medium mb-1">{snap.total_impressions.toLocaleString('nb-NO')}</p>
                  <p className="text-sporr-muted text-xs uppercase tracking-widest">Social impressions</p>
                </div>
              )}
              {totalReach > 0 && (
                <div className="bg-sporr-dark rounded-xl p-5 text-center">
                  <p className="text-sporr-cream text-2xl font-medium mb-1">{totalReach.toLocaleString('nb-NO')}</p>
                  <p className="text-sporr-sage text-xs uppercase tracking-widest">Total reach</p>
                </div>
              )}
            </div>

            {/* ROI metrics */}
            {(snap.contract_value_nok > 0 || snap.estimated_media_value_nok > 0) && (
              <>
                <h3 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-4">ROI & performance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {snap.contract_value_nok > 0 && (
                    <div className="bg-sporr-light rounded-xl p-4">
                      <p className="text-sporr-muted text-xs uppercase tracking-widest mb-1">Investment</p>
                      <p className="text-sporr-dark text-lg font-medium">{nok(snap.contract_value_nok)}</p>
                    </div>
                  )}
                  {snap.cost_per_person && (
                    <div className="bg-sporr-light rounded-xl p-4">
                      <p className="text-sporr-muted text-xs uppercase tracking-widest mb-1">Cost per person</p>
                      <p className="text-sporr-dark text-lg font-medium">Kr {parseInt(snap.cost_per_person).toLocaleString('nb-NO')}</p>
                    </div>
                  )}
                  {snap.estimated_media_value_nok > 0 && (
                    <div className="bg-sporr-dark rounded-xl p-4">
                      <p className="text-sporr-sage text-xs uppercase tracking-widest mb-1">Estimated media value</p>
                      <p className="text-sporr-cream text-lg font-medium">{nok(snap.estimated_media_value_nok)}</p>
                      {snap.roi_multiple && <p className="text-sporr-sage text-xs mt-1">{snap.roi_multiple}× ROI</p>}
                    </div>
                  )}
                </div>
              </>
            )}

            {snap.media_coverage && (
              <div className="bg-sporr-sage-lt rounded-xl p-4 mt-4">
                <p className="text-sporr-dark text-xs font-medium uppercase tracking-widest mb-2">Media coverage</p>
                <p className="text-sporr-dark text-sm">{snap.media_coverage}</p>
              </div>
            )}
          </div>
        )}

        {/* Deliverables checklist */}
        {snap.obligations && snap.obligations.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Deliverables — promised vs delivered</h2>
            <div className="space-y-2">
              {snap.obligations.map((ob, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-4 py-3 bg-sporr-light">
                  <div>
                    <p className="text-sporr-dark text-sm font-medium">{ob.description}</p>
                    <p className="text-sporr-muted text-xs mt-0.5 capitalize">{ob.proof_type} proof</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ml-4 ${
                    ob.status === 'delivered'
                      ? 'bg-sporr-dark text-sporr-cream'
                      : ob.status === 'not_applicable'
                      ? 'bg-sporr-sage-lt text-sporr-muted'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ob.status === 'delivered' ? '✓ Delivered' : ob.status === 'not_applicable' ? 'N/A' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
            {pending.length > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-amber-800 text-sm">
                  <strong>{pending.length} obligation{pending.length > 1 ? 's' : ''} pending</strong> — {snap.club_name} is committed to completing {pending.length > 1 ? 'these' : 'this'} as agreed.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Visual evidence */}
        {snap.photo_urls && snap.photo_urls.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Visual evidence</h2>
            <p className="text-sporr-muted text-sm mb-4">Geo-tagged, timestamped proof captured on match day</p>
            <div className="grid grid-cols-1 gap-4">
              {snap.photo_urls[0] && (
                <div className="rounded-xl overflow-hidden border border-sporr-sage-lt">
                  <img src={snap.photo_urls[0].url} alt="Proof" className="w-full h-56 object-cover" />
                  <div className="px-4 py-3 bg-sporr-light flex items-center justify-between">
                    <p className="text-sporr-dark text-sm font-medium">{snap.photo_urls[0].description}</p>
                    <p className="text-sporr-muted text-xs">
                      {snap.photo_urls[0].captured_at && new Date(snap.photo_urls[0].captured_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {snap.photo_urls[0].geo_lat && ` · ${snap.photo_urls[0].geo_lat.toFixed(3)}°N`}
                    </p>
                  </div>
                </div>
              )}
              {snap.photo_urls.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {snap.photo_urls.slice(1, 4).map((p, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border border-sporr-sage-lt">
                      <img src={p.url} alt="Proof" className="w-full h-28 object-cover" />
                      <div className="px-2 py-2 bg-sporr-light">
                        <p className="text-sporr-dark text-xs font-medium truncate">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Renewal proposal */}
        {(snap.renewal_package || snap.renewal_value_nok) && (
          <div className="card mb-8">
            <h2 className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-6">Renewal proposal</h2>

            {snap.contract_value_nok > 0 && snap.renewal_value_nok && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 border border-sporr-sage-lt rounded-xl p-4 text-center">
                  <p className="text-sporr-muted text-xs uppercase tracking-widest mb-1">Current season</p>
                  <p className="text-sporr-dark text-xl font-medium">{nok(snap.contract_value_nok)}</p>
                  <p className="text-sporr-muted text-xs mt-1">{snap.season}</p>
                </div>
                <span className="text-sporr-muted text-xl">→</span>
                <div className="flex-1 bg-sporr-dark rounded-xl p-4 text-center">
                  <p className="text-sporr-sage text-xs uppercase tracking-widest mb-1">Proposed</p>
                  <p className="text-sporr-cream text-xl font-medium">{nok(snap.renewal_value_nok)}</p>
                  {renewalUplift !== null && (
                    <p className="text-sporr-sage text-xs mt-1">{renewalUplift > 0 ? `+${renewalUplift}%` : renewalUplift < 0 ? `${renewalUplift}%` : 'Same'} on current</p>
                  )}
                </div>
              </div>
            )}

            {snap.roi_multiple && snap.estimated_media_value_nok > 0 && (
              <div className="bg-sporr-sage-lt rounded-xl p-4 mb-4 flex items-center gap-4">
                <div className="text-center min-w-16">
                  <p className="text-sporr-dark text-3xl font-medium">{snap.roi_multiple}×</p>
                  <p className="text-sporr-muted text-xs uppercase tracking-widest">ROI</p>
                </div>
                <p className="text-sporr-dark text-sm leading-relaxed">
                  Based on an estimated media value of {nok(snap.estimated_media_value_nok)} against an investment of {nok(snap.contract_value_nok)}, your sponsorship delivered an estimated {snap.roi_multiple}× return this season.
                </p>
              </div>
            )}

            {snap.renewal_package && (
              <div className="border-l-4 border-sporr-sage pl-5">
                <p className="text-sporr-dark text-sm font-medium uppercase tracking-widest mb-2">Proposed package</p>
                <p className="text-sporr-dark text-sm leading-relaxed whitespace-pre-wrap">{snap.renewal_package}</p>
              </div>
            )}
          </div>
        )}

        {/* CTA block */}
        <div className="bg-sporr-dark rounded-2xl p-8 text-center mb-8">
          <p className="text-sporr-sage text-xs uppercase tracking-widest mb-2">Next steps</p>
          <p className="text-sporr-cream text-xl font-medium mb-2">We'd love to continue this partnership</p>
          <p className="text-sporr-sage text-sm mb-0">
            Contact {snap.club_contact_name || snap.club_name} to confirm your renewal for the upcoming season.
          </p>
        </div>

        {/* Sporr conversion prompt */}
        <div className="border border-sporr-sage-lt rounded-2xl p-6 text-center">
          <p className="text-sporr-muted text-xs uppercase tracking-widest mb-3">This report was generated by</p>
          <img
            src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
            alt="Sporr"
            className="h-10 mx-auto mb-3"
          />
          <p className="text-sporr-dark text-sm font-medium mb-1">Proof of sponsorship performance made easy</p>
          <p className="text-sporr-muted text-sm mb-4 leading-relaxed">
            Do you fund multiple clubs or organisations? Sporr gives sponsors a single dashboard for every investment — standardised reporting, automated proof of delivery, and renewal evidence built in.
          </p>
          <Link
            href="/sponsors"
            className="inline-block bg-sporr-dark text-sporr-cream text-sm font-medium px-6 py-3 rounded-lg hover:bg-sporr-mid transition-colors"
          >
            Discover Sporr for sponsors →
          </Link>
          <p className="text-sporr-muted text-xs mt-4">sporr.io</p>
        </div>

      </div>
    </main>
  )
}
