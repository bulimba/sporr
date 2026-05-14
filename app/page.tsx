import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <img
            src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
            alt="Sporr"
            className="h-24 mx-auto mb-6"
        />

        {/* Tagline — stands alone */}
        <h1 className="text-sporr-cream text-4xl font-medium leading-tight max-w-lg mx-auto">
          Proof of sponsorship performance made easy
        </h1>
      </div>

      {/* Primary CTAs */}
      <div className="flex items-center gap-6 mb-20">
        <Link
          href="/signup"
          className="bg-sporr-cream text-sporr-dark font-medium text-lg px-8 py-4 rounded-xl hover:bg-sporr-sage-lt transition-colors duration-150"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="text-sporr-sage hover:text-sporr-cream text-base transition-colors duration-150 underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>

      {/* Divider */}
      <div className="w-full max-w-lg border-t border-sporr-mid mb-12" />

      {/* Secondary cards */}
      <div className="w-full max-w-lg space-y-4">

        {/* See how it works — prominent */}
        <Link
          href="/how-it-works"
          className="block bg-sporr-mid rounded-2xl border border-sporr-mid hover:border-sporr-sage transition-colors duration-150 px-8 py-6"
        >
          <p className="text-sporr-cream font-medium text-xl mb-2">See how it works</p>
          <p className="text-sporr-sage text-base leading-relaxed">
            A two-minute walkthrough of how Sporr helps clubs capture and deliver proof to their sponsors.
          </p>
        </Link>

        {/* Sponsor discovery — subordinated */}
        <Link
          href="/sponsors"
          className="block bg-transparent rounded-2xl border border-sporr-mid hover:border-sporr-sage transition-colors duration-150 px-8 py-5"
        >
          <p className="text-sporr-sage text-xs font-medium uppercase tracking-widest mb-1">For sponsors</p>
          <p className="text-sporr-sage text-lg hover:text-sporr-cream transition-colors">
            Discover your next sports partnership →
          </p>
        </Link>

      </div>

      {/* Footer */}
      <div className="mt-16 text-sporr-muted text-xs tracking-wide">
        sporr.io · Version 0.1
      </div>

    </main>
  )
}
