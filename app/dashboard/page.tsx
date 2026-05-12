'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [status, setStatus] = useState('checking...')
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setStatus('Logged in as: ' + session.user.email)
      } else {
        setStatus('No session found')
      }
    }
    check()
  }, [])

  return (
    <main className="min-h-screen bg-sporr-dark flex items-center justify-center">
      <div className="text-sporr-cream text-xl">{status}</div>
    </main>
  )
}
