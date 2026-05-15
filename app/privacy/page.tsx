import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-sporr-cream">
      <nav className="bg-sporr-dark px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <img src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg" alt="Sporr" className="h-20" />
        </Link>
        <Link href="/" className="text-sporr-cream hover:text-sporr-sage text-sm transition-colors">← Back</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-sporr-dark text-3xl font-medium mb-2">Privacy Policy</h1>
        <p className="text-sporr-muted text-sm mb-12">Last updated: May 2026</p>

        <div className="prose prose-sm max-w-none space-y-10">

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Overview</h2>
            <p className="text-sporr-muted leading-relaxed">
              Sporr is committed to protecting your privacy. This policy explains what personal data we collect, why we collect it, how we use it, and your rights under the General Data Protection Regulation (GDPR). Sporr operates as a data controller for the personal data of club administrators and as a data processor for sponsor contact data entered by clubs.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Data we collect</h2>
            <p className="text-sporr-muted leading-relaxed mb-4">We collect only what is necessary to provide the service:</p>

            <div className="space-y-4">
              {[
                {
                  title: 'Account data',
                  items: ['Name and email address of club administrators', 'Encrypted password (we never store passwords in plain text)', 'Club name, country, and sports'],
                },
                {
                  title: 'Sponsorship data (entered by your club)',
                  items: ['Sponsor company names and contact details', 'Contract values, dates, and terms', 'Obligation descriptions and delivery contexts'],
                },
                {
                  title: 'Proof data',
                  items: ['Photos uploaded during match day sessions', 'Geo-location data (latitude and longitude) attached to proof captures', 'Timestamps of proof captures'],
                },
                {
                  title: 'Usage data',
                  items: ['Session activity (audit sessions created and completed)', 'Proof Packs generated and sent', 'Storage usage'],
                },
              ].map((group, i) => (
                <div key={i}>
                  <p className="text-sporr-dark text-sm font-medium mb-2">{group.title}</p>
                  <ul className="text-sporr-muted space-y-1 list-none pl-0">
                    {group.items.map((item, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="text-sporr-sage flex-shrink-0">—</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Why we collect it</h2>
            <div className="space-y-3">
              {[
                ['Contract performance', 'To provide the core service — contract tracking, obligation management, proof capture, and Proof Pack generation.'],
                ['Account management', 'To authenticate users, manage subscriptions, and provide support.'],
                ['Service improvement', 'Aggregated, anonymised usage data helps us understand how clubs use Sporr and improve the platform.'],
                ['Legal compliance', 'To meet our obligations under Norwegian law and GDPR.'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-sporr-sage flex-shrink-0 mt-0.5">—</span>
                  <div>
                    <span className="text-sporr-dark text-sm font-medium">{title}: </span>
                    <span className="text-sporr-muted text-sm">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Where your data is stored</h2>
            <p className="text-sporr-muted leading-relaxed">
              All Sporr data is stored in the European Union — specifically in Frankfurt, Germany — using Supabase infrastructure. We do not transfer personal data outside the EU/EEA. Storage is encrypted at rest and in transit.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Who we share data with</h2>
            <p className="text-sporr-muted leading-relaxed mb-3">
              We do not sell your data. We share data only with the following third-party services required to operate Sporr:
            </p>
            <div className="space-y-2">
              {[
                ['Supabase', 'Database, authentication, and file storage (EU-hosted)'],
                ['Vercel', 'Application hosting and delivery (EU region)'],
                ['Resend', 'Transactional email delivery for Proof Packs'],
              ].map(([name, desc], i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-sporr-sage flex-shrink-0">—</span>
                  <span className="text-sporr-muted text-sm"><strong className="text-sporr-dark">{name}:</strong> {desc}</span>
                </div>
              ))}
            </div>
            <p className="text-sporr-muted leading-relaxed mt-4">
              Each of these providers operates under appropriate data processing agreements and GDPR-compliant terms.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Sponsor contact data</h2>
            <p className="text-sporr-muted leading-relaxed">
              When a club adds a sponsor's contact details to Sporr, the club is responsible for ensuring they have a lawful basis for storing and processing that data — for example, an existing contractual relationship. Sporr processes this data on behalf of the club as a data processor. Clubs act as data controllers for sponsor data they enter.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Geo-location data</h2>
            <p className="text-sporr-muted leading-relaxed">
              The Sporr field auditor requests location permission to geo-tag proof photos. This is optional — declining location access does not prevent proof capture. Location data is stored only for the purpose of verifying where proof was captured, and is visible only to the club that captured it.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">How long we keep your data</h2>
            <div className="space-y-2">
              {[
                ['Active accounts', 'Data is retained for as long as your account is active.'],
                ['Cancelled accounts', 'Data is deleted within 30 days of a confirmed account deletion request.'],
                ['Proof photos', 'Deleted with the account or upon specific request.'],
                ['Billing records', 'Retained for 5 years as required by Norwegian accounting regulations.'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-sporr-sage flex-shrink-0">—</span>
                  <span className="text-sporr-muted text-sm"><strong className="text-sporr-dark">{title}:</strong> {desc}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Your rights under GDPR</h2>
            <p className="text-sporr-muted leading-relaxed mb-4">You have the right to:</p>
            <div className="space-y-2">
              {[
                ['Access', 'Request a copy of the personal data we hold about you.'],
                ['Rectification', 'Correct inaccurate or incomplete data.'],
                ['Erasure', 'Request deletion of your personal data ("right to be forgotten").'],
                ['Portability', 'Receive your data in a machine-readable format.'],
                ['Restriction', 'Request that we limit how we process your data in certain circumstances.'],
                ['Objection', 'Object to processing based on legitimate interests.'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-sporr-sage flex-shrink-0">—</span>
                  <span className="text-sporr-muted text-sm"><strong className="text-sporr-dark">{title}:</strong> {desc}</span>
                </div>
              ))}
            </div>
            <p className="text-sporr-muted leading-relaxed mt-4">
              To exercise any of these rights, contact us at <a href="mailto:privacy@sporr.io" className="text-sporr-dark underline">privacy@sporr.io</a>. We will respond within 30 days. You also have the right to lodge a complaint with the Norwegian Data Protection Authority (Datatilsynet) at <a href="https://www.datatilsynet.no" target="_blank" rel="noopener noreferrer" className="text-sporr-dark underline">datatilsynet.no</a>.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Cookies</h2>
            <p className="text-sporr-muted leading-relaxed">
              Sporr uses only essential cookies required for authentication and session management. We do not use tracking cookies, advertising cookies, or third-party analytics cookies. No cookie consent banner is required because we do not set non-essential cookies.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Children</h2>
            <p className="text-sporr-muted leading-relaxed">
              Sporr is intended for use by adults acting on behalf of sports clubs. We do not knowingly collect personal data from children under 16. If you believe a child has provided us with personal data, contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Changes to this policy</h2>
            <p className="text-sporr-muted leading-relaxed">
              We may update this policy as the platform evolves. We will notify users by email at least 14 days before material changes take effect. The current version is always available at sporr.io/privacy.
            </p>
          </section>

          <section>
            <h2 className="text-sporr-dark text-lg font-medium mb-3">Contact</h2>
            <p className="text-sporr-muted leading-relaxed">
              For any privacy-related questions or requests, contact us at <a href="mailto:privacy@sporr.io" className="text-sporr-dark underline">privacy@sporr.io</a>.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-sporr-sage-lt flex items-center justify-between">
          <p className="text-sporr-muted text-xs">Sporr · sporr.io</p>
          <Link href="/terms" className="text-sporr-muted text-xs hover:text-sporr-dark transition-colors">Terms of Service →</Link>
        </div>
      </div>
    </main>
  )
}
