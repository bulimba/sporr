import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-sporr-dark flex flex-col items-center justify-center px-6">

      <div className="mb-12 text-center">
        <h1 className="text-sporr-cream font-medium tracking-[0.25em] text-5xl mb-6">
          SPORR
        </h1>
        <p className="text-sporr-cream text-xl font-medium mb-4">
          Proof of sponsorship performance made easy.
        </p>
        <p className="text-sporr-sage text-base max-w-md leading-relaxed">
          Capture, organise, and deliver proof of performance for your sponsorship — automatically.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/signup" className="btn-primary text-center min-w-[180px]">
          Get started
        </Link>
        <Link href="/how-it-works" className="btn-secondary text-center min-w-[180px]">
          See how it works
        </Link>
        <Link href="/sponsors" className="btn-secondary text-center min-w-[180px]">
          Looking for a sponsor?
        </Link>
      </div>

      <div className="absolute bottom-8 text-sporr-muted text-xs tracking-wide">
        sporr.io &nbsp;&middot;&nbsp; Version 0.1
      </div>

    </main>
  )
}
