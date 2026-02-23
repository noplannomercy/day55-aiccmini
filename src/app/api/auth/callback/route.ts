import { createSupabaseServerClient } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth callback handler.
 *
 * Supabase redirects here after a successful OAuth flow (e.g. Google login).
 * Exchanges the authorization code for a session and redirects the user
 * to the requested destination (defaults to /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
