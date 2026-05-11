export default function Home() {
  return (
    <main className="min-h-screen bg-sporr-dark flex flex-col items-center justify-center px-6">

      {/* Logo wordmark */}
      <div className="mb-12 text-center">
        <h1 className="text-sporr-cream font-medium tracking-[0.25em] text-5xl mb-4">
          SPORR
        </h1>
        <p className="text-sporr-sage text-sm tracking-widest uppercase">
          Proof of delivery for every club
        </p>
      </div>

      {/* Core narrative */}
      <div className="max-w-xl text-center mb-12">
        <p className="text-sporr-cream text-lg leading-relaxed mb-6">
          Sponsors rely on consistency. Clubs are often without the resources
          to make it happen. A standardised proof of delivery system bridges
          that gap.
        </p>
        <p className="text-sporr-sage text-base italic">
          That&apos;s Sporr.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href="/signup"
          className="btn-primary text-center min-w-[160px]"
        >
          Get started
        </a>
        <a
          href="/login"
          className="btn-secondary text-center min-w-[160px]"
        >
          Sign in
        </a>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-sporr-muted text-xs tracking-wide">
        sporr.io &nbsp;&middot;&nbsp; Version 0.1
      </div>

    </main>
  )
}
