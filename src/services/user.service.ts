/**
 * User service — the only place in the codebase that may directly query the
 * `users` table.  Every function accepts `tenantId` as its first argument so
 * that multi-tenant row isolation is enforced at the service boundary rather
 * than being left to individual callers.
 *
 * Deletion is a two-phase operation:
 *   1. DELETE from public.users  (removes the application record and all FK
 *      cascade constraints defined in schema.ts)
 *   2. auth.admin.deleteUser()   (removes the Supabase Auth identity so the
 *      email address is freed and the session is invalidated everywhere)
 *
 * This order matters: if the auth deletion is attempted first and the public
 * DELETE then fails, the orphaned auth record would cause FK violations on
 * any future re-registration with the same email.
 */

import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { createSupabaseAdminClient } from '@/lib/auth'
import { AppError, NotFoundError, ValidationError } from '@/lib/errors'
import { auditUserRoleChange } from '@/lib/audit.middleware'
import type { User, UserRole } from '@/types'

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * Returns every user that belongs to the given tenant, ordered by creation
 * date ascending so the list is deterministic in tests and the UI.
 */
export async function listUsers(tenantId: string): Promise<User[]> {
  return db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(users.createdAt)
}

/**
 * Fetches a single user, guaranteeing it belongs to `tenantId` to prevent
 * cross-tenant data leakage via enumeration of UUIDs.
 *
 * @throws {NotFoundError} when no matching record exists within the tenant.
 */
export async function getUserById(
  tenantId: string,
  userId: string
): Promise<User> {
  const [user] = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .limit(1)

  if (!user) {
    throw new NotFoundError('사용자')
  }

  return user
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Creates a new user in both Supabase Auth and the application database.
 *
 * Auth is created first so that we can reuse the UUID that Supabase assigns.
 * The public.users row then stores that exact UUID as its primary key, which
 * is required by the schema design (B-pattern: auth.users.id === public.users.id).
 *
 * If writing to public.users fails after auth creation we attempt a best-effort
 * cleanup of the auth record so the email address is not permanently locked.
 *
 * @throws {ValidationError} when Supabase rejects the credentials (e.g. weak
 *   password, duplicate email).
 * @throws {AppError}        on unexpected failures during DB insertion.
 */
export async function createUser(
  tenantId: string,
  data: { email: string; name: string; role: UserRole; password: string }
): Promise<User> {
  if (data.password.length < 8) {
    throw new ValidationError('password는 8자 이상이어야 합니다.')
  }

  const adminClient = createSupabaseAdminClient()

  // Phase 1: create the auth identity and obtain the stable UUID.
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // skip the confirmation email for admin-created accounts
      user_metadata: { name: data.name },
    })

  if (authError || !authData.user) {
    throw new ValidationError(
      authError?.message ?? '인증 사용자 생성에 실패했습니다.'
    )
  }

  const authUserId = authData.user.id

  // Phase 2: persist the application record using the same UUID.
  try {
    const [newUser] = await db
      .insert(users)
      .values({
        id: authUserId,
        tenantId,
        email: data.email,
        name: data.name,
        role: data.role,
        isActive: true,
      })
      .returning()

    if (!newUser) {
      throw new AppError('사용자 데이터 저장에 실패했습니다.')
    }

    return newUser
  } catch (dbError) {
    // Best-effort rollback: remove the orphaned auth record so the email is
    // freed and no FK inconsistency is introduced.
    await adminClient.auth.admin.deleteUser(authUserId).catch((cleanupErr) => {
      console.error(
        '[user.service] Auth rollback failed after DB insert error:',
        cleanupErr
      )
    })

    // Re-throw the original DB error wrapped in an AppError if it is not
    // already one of our error types.
    if (dbError instanceof AppError) throw dbError
    console.error('[user.service] createUser DB insert failed:', dbError)
    throw new AppError('사용자 생성 중 오류가 발생했습니다.')
  }
}

/**
 * Changes the role of an existing user within a tenant.
 *
 * @throws {NotFoundError} when the user does not exist in this tenant.
 */
export async function updateUserRole(
  tenantId: string,
  userId: string,
  role: UserRole
): Promise<User> {
  // Confirm the record exists and belongs to this tenant before updating.
  const existing = await getUserById(tenantId, userId)

  const [updated] = await db
    .update(users)
    .set({ role })
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw new AppError('사용자 역할 변경에 실패했습니다.')
  }

  // Non-blocking side effect: audit log
  auditUserRoleChange(tenantId, userId, userId, existing.role, role).catch(() => {})

  return updated
}

/**
 * Activates or deactivates a user account.  Deactivated users cannot log in
 * because session validation checks the `isActive` flag (enforced in middleware).
 *
 * @throws {NotFoundError} when the user does not exist in this tenant.
 */
export async function toggleUserActive(
  tenantId: string,
  userId: string,
  isActive: boolean
): Promise<User> {
  await getUserById(tenantId, userId)

  const [updated] = await db
    .update(users)
    .set({ isActive })
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw new AppError('사용자 활성화 상태 변경에 실패했습니다.')
  }

  return updated
}

/**
 * Permanently removes a user from both the application database and Supabase Auth.
 *
 * Deletion order:
 *   1. public.users DELETE first — removes all application data and respects FK
 *      constraints defined in the schema (cascade or restrict as configured).
 *   2. auth.admin.deleteUser() second — invalidates sessions and frees the email.
 *
 * If the auth deletion fails after a successful DB delete, we log the error
 * rather than rolling back the DB record, because the auth orphan is less
 * harmful than a DB record with no corresponding auth identity (it will be
 * cleaned up by Supabase's orphan-deletion job or a manual operation).
 *
 * @throws {NotFoundError} when the user does not exist in this tenant.
 * @throws {AppError}      when the DB delete fails unexpectedly.
 */
export async function deleteUser(
  tenantId: string,
  userId: string
): Promise<void> {
  // Confirm the record exists within this tenant before proceeding.
  await getUserById(tenantId, userId)

  // Phase 1: remove from application DB.
  const deleted = await db
    .delete(users)
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .returning({ id: users.id })

  if (!deleted.length) {
    throw new AppError('사용자 삭제에 실패했습니다.')
  }

  // Phase 2: remove the Supabase Auth identity.
  const adminClient = createSupabaseAdminClient()
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

  if (authError) {
    // The DB record is already gone; log for operational follow-up but do not
    // surface to the API caller as the primary intent (DB deletion) succeeded.
    console.error(
      '[user.service] Failed to delete auth user after DB delete:',
      authError
    )
  }
}
