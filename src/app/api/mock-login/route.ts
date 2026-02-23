import { createSupabaseServerClient } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Development-only mock login endpoint.
 *
 * Accepts email and optional password via JSON body, then performs
 * a Supabase signInWithPassword call. Defaults password to 'password123'
 * when not provided, matching the seeded test user credentials.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { email, password } = await request.json()

  if (!email) {
    return NextResponse.json({ error: '이메일이 필요합니다.' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: password || 'password123',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return NextResponse.json({
    user: data.user,
    message: '로그인 성공',
  })
}
