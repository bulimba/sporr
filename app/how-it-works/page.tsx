import Link from 'next/link'

const steps = [
  {
    number: '01',
    title: 'Add your sponsors and contracts',
    description: 'Enter the companies supporting your club and define exactly what you have agreed to deliver — LED boards, kit logos, social posts, PA announcements. Every obligation is logged against the sponsor it belongs to.',
    detail: 'Takes less than ten minutes to set up a full season.',
  },
  {
    number: '02',
    title: 'Launch a match day session',
    description: 'On match day, open Sporr on your phone and start a session. A QR code appears — any volunteer can scan it and start capturing proof immediately. No login required for volunteers.',
    detail: 'Works on any smartphone. No app download needed.',
  },
  {
    number: '03',
    title: 'Capture proof in real time',
    description: 'Photograph banners, kit, signage, and digital screens as they happen. Every photo is automatically timestamped and geo-tagged. The platform records exactly when and where each piece of evidence was captured.',
    detail: 'Sponsors receive verified, timestamped proof — not just a photo.',
  },
  {
    number: '04',
    title: 'Generate your Proof Pack',
    description: 'At the end of the season — or any time you choose — Sporr compiles everything into a professional proof of performance report. Delivery score, audience reach, ROI metrics, photo evidence, and a renewal proposal.',
    detail: 'One click. Sent directly to your sponsor\'s inbox.',
  },
]

const features = [
  { title: 'No app download', description: 'Volunteers access the field auditor directly from a QR code in their browser.' },
  { title: 'Works offline', description: 'Photos are queued and uploaded automatically when connectivity returns.' },
  { title: 'Multi-sponsor', description: 'One session captures proof for all sponsors simultaneously.' },
  { title: 'Sponsor portal', description: 'Sponsors can log in to view live delivery status across all clubs they fund.' },
  { title: 'PDF and email', description: 'Proof Packs are sent by email and available as a downloadable PDF.' },
  { title: 'GDPR compliant', description: 'All data stored in the EU. Clubs control their own data.' },
]

export default function HowItWorksPage() {
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
          <Link href="/signup" className="bg-sporr-cream text-sporr-dark text-sm font-medium px-4 py-2 rounded-lg hover:bg-sporr-sage-lt transition-colors">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-sporr-dark px-6 py-20 text-center">
        <p className="text-sporr-sage text-sm uppercase tracking-widest mb-4">How it works</p>
        <h1 className="text-sporr-cream text-4xl font-medium mb-6 max-w-2xl mx-auto leading-tight">
          From match day capture to sponsor renewal — automatically
        </h1>
        <p className="text-sporr-sage text-lg max-w-xl mx-auto leading-relaxed">
          Sporr replaces the end-of-season scramble with a simple proof system that runs throughout the year.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="space-y-16">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-sporr-dark rounded-2xl flex items-center justify-center">
                <span className="text-sporr-sage text-sm font-medium">{step.number}</span>
              </div>
              <div className="flex-1 pt-2">
                <h2 className="text-sporr-dark text-2xl font-medium mb-3">{step.title}</h2>
                <p className="text-sporr-muted text-base leading-relaxed mb-3">{step.description}</p>
                <p className="text-sporr-dark text-sm font-medium">{step.detail}</p>
                {i < steps.length - 1 && (
                  <div className="mt-8 h-px bg-sporr-sage-lt" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="bg-sporr-dark px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sporr-cream text-2xl font-medium mb-12 text-center">Built for clubs. Trusted by sponsors.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-sporr-mid rounded-xl p-6">
                <h3 className="text-sporr-cream font-medium mb-2">{f.title}</h3>
                <p className="text-sporr-sage text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-20 text-center">
        <h2 className="text-sporr-dark text-3xl font-medium mb-4">Ready to get started?</h2>
        <p className="text-sporr-muted text-base mb-8 max-w-md mx-auto">
          Set up your club in under ten minutes. No credit card required.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/signup" className="btn-primary text-base px-8 py-4">Create free account</Link>
          <Link href="/sponsors" className="btn-secondary text-base px-8 py-4">Looking to sponsor?</Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-sporr-dark px-6 py-8 text-center">
        <p className="text-sporr-muted text-xs">Sporr — proof of performance made easy · sporr.io</p>
      </div>

    </main>
  )
}
