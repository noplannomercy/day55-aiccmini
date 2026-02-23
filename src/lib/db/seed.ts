import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { db } from './index'
import { tenants, users } from './schema'
import { createSupabaseAdminClient } from '@/lib/auth'
import { sql } from 'drizzle-orm'

const SEED_EMAIL = 'admin@aicc.demo'
const SEED_PASSWORD = 'password123'

async function seed() {
  console.log('Seeding...')

  const supabase = createSupabaseAdminClient()

  // 1. 기존 public 테이블 데이터 초기화 (FK 순서 역순)
  await db.execute(sql`TRUNCATE tenants CASCADE`)
  console.log('✓ Tables cleared')

  // 2. 기존 auth user 정리
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
  const existing = authUsers.find(u => u.email === SEED_EMAIL)
  if (existing) {
    await supabase.auth.admin.deleteUser(existing.id)
    console.log('✓ Existing auth user deleted')
  }

  // 3. Supabase auth.users에 사용자 생성
  const { data: { user: authUser }, error } = await supabase.auth.admin.createUser({
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Admin User' },
  })

  if (error || !authUser) {
    console.error('Auth user 생성 실패:', error)
    process.exit(1)
  }
  console.log('✓ Auth user created:', authUser.id)

  // 4. Tenant 생성
  const [tenant] = await db
    .insert(tenants)
    .values({ name: 'AICC Demo', slug: 'aicc-demo' })
    .returning()
  console.log('✓ Tenant created:', tenant.id)

  // 5. public.users에 동일 id로 생성 (auth.users.id = public.users.id)
  await db.insert(users).values({
    id: authUser.id,       // auth.users.id와 동일
    tenantId: tenant.id,
    email: SEED_EMAIL,
    name: 'Admin User',
    role: 'admin',
  })
  console.log('✓ Public user created with auth ID')

  console.log('\nSeed complete!')
  console.log(`  Email   : ${SEED_EMAIL}`)
  console.log(`  Password: ${SEED_PASSWORD}`)
  process.exit(0)
}

seed().catch(console.error)
