'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
  cookies: {
  getAll() {
    return cookieStore.getAll()
  },
  setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options)
    })
  },
},
    }
  )

  const email = formData.get('email') as string
  const password = formData.get('password') as string

const { error } = await supabase.auth.signInWithPassword({ email, password })

if (error) {
  redirect('/login?error=' + encodeURIComponent(error.message))
}

// TEMP diagnostic
const all = cookieStore.getAll()
console.log('LOGIN ACTION — cookies after signin:', all.map(c => c.name).join(', ') || 'NONE')

redirect('/dashboard')
}
