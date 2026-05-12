import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const org_name = requestUrl.searchParams.get('org_name') || 'My Club'
  const full_name = requestUrl.searchParams.get('full_name') || ''
  const email = requestUrl.searchParams.get('email') || ''

  if (code) {
    const cookieStore = request.cookies
    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (user) {
      // Check if org already exists for this user
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingUser) {
        // Create organisation
        const { data: org } = await supabase
          .from('organisations')
          .insert({ name: org_name, tier: 'free', country: 'NO' })
          .select()
          .single()

        if (org) {
          // Create user record
          await supabase
            .from('users')
            .insert({
              id: user.id,
              org_id: org.id,
              full_name,
              email: user.email || email,
              role: 'admin',
            })
        }
      }
    }

    return response
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
