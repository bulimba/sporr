import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('DASHBOARD LAYOUT — user:', user?.id ?? 'NULL', '| error:', error?.message ?? 'none')

  if (!user) redirect('/login')
  return <>{children}</>
}
