/**
 * Knowledge Base (KB) article service — the only place in the codebase that
 * may directly query the `kb_articles` table.  Every function accepts
 * `tenantId` as its first argument so that multi-tenant row isolation is
 * enforced at the service boundary.
 *
 * Read operations join the `author` relation via leftJoin so that the caller
 * receives the author's name without needing additional queries.
 *
 * Keyword search uses SQL ILIKE for case-insensitive matching against both
 * the article title and content.
 */

import { eq, and, or, ilike, sql, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { kbArticles, users } from '@/lib/db/schema'
import { NotFoundError, AppError } from '@/lib/errors'
import { getPaginationOffset, getTotalPages } from '@/lib/utils'
import { auditKbCreate, auditKbUpdate, auditKbDelete } from '@/lib/audit.middleware'
import type { KBArticle, PaginatedResult } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type KBArticleWithAuthor = KBArticle & { author: { name: string } }

type CreateArticleData = {
  title: string
  content: string
  tags?: string[]
}

type UpdateArticleData = {
  title?: string
  content?: string
  tags?: string[]
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of KB articles for the given tenant with optional
 * keyword search.  Results are ordered by creation date descending (newest
 * first).
 *
 * Keyword search is performed via SQL ILIKE against both title and content,
 * ensuring case-insensitive matching without requiring a full-text search index.
 */
export async function listArticles(
  tenantId: string,
  keyword?: string,
  page = 1,
  limit = 20
): Promise<PaginatedResult<KBArticleWithAuthor>> {
  const conditions = [eq(kbArticles.tenantId, tenantId)]

  if (keyword) {
    const pattern = `%${keyword}%`
    conditions.push(
      or(
        ilike(kbArticles.title, pattern),
        ilike(kbArticles.content, pattern)
      )!
    )
  }

  const whereClause = and(...conditions)

  // Count total matching rows for pagination metadata.
  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(kbArticles)
    .where(whereClause)

  const total = countResult?.count ?? 0
  const offset = getPaginationOffset(page, limit)

  // Fetch the page of articles with joined author relation.
  const rows = await db
    .select({
      article: kbArticles,
      authorName: users.name,
    })
    .from(kbArticles)
    .leftJoin(users, eq(kbArticles.authorId, users.id))
    .where(whereClause)
    .orderBy(desc(kbArticles.createdAt))
    .limit(limit)
    .offset(offset)

  const data: KBArticleWithAuthor[] = rows.map((row) => ({
    ...row.article,
    author: { name: row.authorName ?? '' },
  }))

  return {
    data,
    total,
    page,
    limit,
    totalPages: getTotalPages(total, limit),
  }
}

/**
 * Fetches a single KB article by ID, guaranteeing it belongs to `tenantId` to
 * prevent cross-tenant data leakage.  Joins the author relation to include the
 * author's name.
 *
 * @throws {NotFoundError} when no matching record exists within the tenant.
 */
export async function getArticleById(
  tenantId: string,
  articleId: string
): Promise<KBArticleWithAuthor> {
  const rows = await db
    .select({
      article: kbArticles,
      authorName: users.name,
    })
    .from(kbArticles)
    .leftJoin(users, eq(kbArticles.authorId, users.id))
    .where(and(eq(kbArticles.id, articleId), eq(kbArticles.tenantId, tenantId)))
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw new NotFoundError('KB 문서')
  }

  return {
    ...row.article,
    author: { name: row.authorName ?? '' },
  }
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Creates a new KB article within the given tenant.  The `authorId` is set to
 * the session user who initiated the request.  Version defaults to 1 and
 * isPublished defaults to true (as defined in the schema).
 */
export async function createArticle(
  tenantId: string,
  data: CreateArticleData,
  authorId: string
): Promise<KBArticle> {
  const [article] = await db
    .insert(kbArticles)
    .values({
      tenantId,
      title: data.title,
      content: data.content,
      tags: data.tags ?? [],
      authorId,
    })
    .returning()

  if (!article) {
    throw new AppError('KB 문서 생성에 실패했습니다.')
  }

  // Non-blocking side effect: audit log
  auditKbCreate(tenantId, authorId, article.id, {
    title: article.title,
    tags: article.tags,
  }).catch(() => {})

  return article
}

/**
 * Updates mutable fields of an existing KB article (title, content, tags).
 * Only the provided fields are modified; omitted fields remain unchanged.
 * The version is automatically incremented by 1 on every update.
 *
 * @throws {NotFoundError} when the article does not exist in this tenant.
 */
export async function updateArticle(
  tenantId: string,
  articleId: string,
  data: UpdateArticleData
): Promise<KBArticle> {
  // Confirm the record exists and belongs to this tenant before updating.
  const existing = await getArticleById(tenantId, articleId)

  const setData: Record<string, unknown> = {
    updatedAt: new Date(),
    version: sql`${kbArticles.version} + 1`,
  }

  if (data.title !== undefined) setData.title = data.title
  if (data.content !== undefined) setData.content = data.content
  if (data.tags !== undefined) setData.tags = data.tags

  const [updated] = await db
    .update(kbArticles)
    .set(setData)
    .where(and(eq(kbArticles.id, articleId), eq(kbArticles.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw new AppError('KB 문서 수정에 실패했습니다.')
  }

  // Non-blocking side effect: audit log
  auditKbUpdate(
    tenantId,
    existing.authorId ?? '',
    articleId,
    { title: existing.title },
    data
  ).catch(() => {})

  return updated
}

/**
 * Permanently removes a KB article from the database.
 *
 * @throws {NotFoundError} when the article does not exist in this tenant.
 */
export async function deleteArticle(
  tenantId: string,
  articleId: string
): Promise<void> {
  const existing = await getArticleById(tenantId, articleId)

  const deleted = await db
    .delete(kbArticles)
    .where(and(eq(kbArticles.id, articleId), eq(kbArticles.tenantId, tenantId)))
    .returning({ id: kbArticles.id })

  if (!deleted.length) {
    throw new AppError('KB 문서 삭제에 실패했습니다.')
  }

  // Non-blocking side effect: audit log
  auditKbDelete(tenantId, existing.authorId ?? '', articleId, {
    title: existing.title,
  }).catch(() => {})
}

/**
 * Appends a tag to the article's tags array.  Duplicates are silently ignored
 * by checking whether the tag already exists before appending.
 *
 * @throws {NotFoundError} when the article does not exist in this tenant.
 */
export async function addTag(
  tenantId: string,
  articleId: string,
  tag: string
): Promise<KBArticle> {
  const existing = await getArticleById(tenantId, articleId)

  const currentTags = existing.tags ?? []
  if (currentTags.includes(tag)) {
    // Tag already exists — return as-is without modification.
    return existing
  }

  const [updated] = await db
    .update(kbArticles)
    .set({
      tags: [...currentTags, tag],
      updatedAt: new Date(),
    })
    .where(and(eq(kbArticles.id, articleId), eq(kbArticles.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw new AppError('태그 추가에 실패했습니다.')
  }

  return updated
}

/**
 * Removes a tag from the article's tags array.  If the tag does not exist in
 * the array, the article is returned unchanged.
 *
 * @throws {NotFoundError} when the article does not exist in this tenant.
 */
export async function removeTag(
  tenantId: string,
  articleId: string,
  tag: string
): Promise<KBArticle> {
  const existing = await getArticleById(tenantId, articleId)

  const currentTags = existing.tags ?? []
  if (!currentTags.includes(tag)) {
    // Tag does not exist — return as-is without modification.
    return existing
  }

  const [updated] = await db
    .update(kbArticles)
    .set({
      tags: currentTags.filter((t) => t !== tag),
      updatedAt: new Date(),
    })
    .where(and(eq(kbArticles.id, articleId), eq(kbArticles.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw new AppError('태그 제거에 실패했습니다.')
  }

  return updated
}
