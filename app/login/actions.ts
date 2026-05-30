'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const cookieStore = await cookies()   // ← await added

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          console.log('SUPABASE WANTS TO SET COOKIES:', cookiesToSet.map(c => c.name).join(', ') || 'NONE')
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  console.log('LOGIN RESULT — session:', data?.session ? 'EXISTS' : 'NULL', '| error:', error?.message ?? 'none')

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }
  redirect('/dashboard')
}
