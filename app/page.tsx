import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-sporr-dark flex flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
       <img
  src="https://oibigydthtoulttigtgy.supabase.co/storage/v1/object/public/Sporr%20logo/image.svg"
  alt="Sporr"
  className="h-20 mx-auto mb-2"
/>
        <p className="text-sporr-cream text-xl font-medium mb-8">
          Proof of sponsorship performance made easy
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link href="/login"
            className="bg-transparent border border-sporr-cream text-sporr-cream font-medium px-6 py-3 rounded-lg hover:bg-sporr-sage hover:border-sporr-sage hover:text-sporr-dark transition-colors duration-150 text-center min-w-[160px]">
            Sign in
          </Link>
          <Link href="/signup"
            className="bg-sporr-cream text-sporr-dark font-medium px-6 py-3 rounded-lg hover:bg-sporr-sage hover:text-sporr-dark transition-colors duration-150 text-center min-w-[160px]">
            Get started
          </Link>
        </div>
        <p className="text-sporr-sage text-base max-w-md leading-relaxed mb-10 mx-auto">
          Capture, organise, and deliver proof of performance for your sponsorship — automatically
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/how-it-works"
            className="bg-sporr-mid text-sporr-cream font-medium px-6 py-3 rounded-lg hover:bg-sporr-sage hover:text-sporr-dark transition-colors duration-150 text-center min-w-[180px]">
            See how it works
          </Link>
          <Link href="/sponsors"
  className="bg-sporr-mid rounded-xl hover:bg-sporr-sage hover:text-sporr-dark transition-colors duration-150 text-left px-6 py-4 min-w-[220px] block group">
  <p className="text-sporr-cream font-medium text-base mb-1 group-hover:text-sporr-dark">Discover your next sports partnership</p>
  <p className="text-sporr-sage text-xs leading-relaxed mb-2 group-hover:text-sporr-dark">Clubs, tournaments, and mass-participation events in your area</p>

</Link>
        </div>
      </div>
      <div className="absolute bottom-8 text-sporr-muted text-xs tracking-wide">
        sporr.io &nbsp;&middot;&nbsp; Version 0.1
      </div>
    </main>
  )
}
