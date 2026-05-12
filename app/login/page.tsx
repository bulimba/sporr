import { login } from './actions'
import Link from 'next/link'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <main className="min-h-screen bg-sporr-dark flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">

        <div className="text-center mb-10">
          <Link href="/">
            <span className="text-sporr-cream font-medium tracking-[0.25em] text-2xl">
              SPORR
            </span>
          </Link>
          <p className="text-sporr-sage text-sm mt-2">
            Sign in to your account
          </p>
        </div>

        <div className="bg-sporr-mid rounded-2xl p-8">

          {searchParams.error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3 mb-6">
              {decodeURIComponent(searchParams.error)}
            </div>
          )}

          <form action={login} className="space-y-5">
            <div>
              <label className="label text-sporr-sage">Email address</label>
              <input
                name="email"
                type="email"
                className="input bg-sporr-cream border-sporr-sage text-sporr-dark placeholder-sporr-muted"
                placeholder="you@yourclub.no"
                required
              />
            </div>
            <div>
              <label className="label text-sporr-sage">Password</label>
              <input
                name="password"
                type="password"
                className="input bg-sporr-cream border-sporr-sage text-sporr-dark placeholder-sporr-muted"
                placeholder="Your password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary mt-2"
            >
              Sign in
            </button>
          </form>

        </div>

        <p className="text-center text-sporr-muted text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-sporr-sage hover:text-sporr-cream transition-colors">
            Get started
          </Link>
        </p>

      </div>
    </main>
  )
}
