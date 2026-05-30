import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Server Component — cannot set cookies here; middleware handles refresh
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('DASHBOARD LAYOUT — user:', user?.id ?? 'NULL', '| error:', error?.message ?? 'none')

  if (!user) redirect('/login')

  return <>{children}</>
}
