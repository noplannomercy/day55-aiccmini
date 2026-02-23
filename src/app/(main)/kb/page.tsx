import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { listArticles } from '@/services/kb.service'
import { ArticleCard } from '@/components/kb/ArticleCard'
import { SearchBar } from '@/components/kb/SearchBar'
import { Button } from '@/components/ui/button'

/**
 * /kb -- Knowledge Base article list page.
 *
 * Server Component that reads searchParams for keyword filtering and
 * pagination, then calls the KB service directly. The SearchBar client
 * component manages URL-based filter state so searches survive page
 * refreshes and browser navigation.
 */
export default async function KBListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  const params = await searchParams
  const keyword = typeof params.keyword === 'string' ? params.keyword : undefined
  const page = Math.max(1, parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1)
  const limit = 20

  const result = await listArticles(session.tenantId, keyword, page, limit)

  const canCreate = session.role === 'admin' || session.role === 'agent'

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            팀 지식을 검색하고 관리합니다.
          </p>
        </div>
        {canCreate && (
          <Link href="/kb/new">
            <Button>New Article</Button>
          </Link>
        )}
      </div>

      {/* Search bar */}
      <SearchBar />

      {/* Article grid */}
      {result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-gray-900">No articles found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {keyword
              ? '검색 조건에 맞는 문서가 없습니다. 키워드를 변경해 보세요.'
              : '아직 작성된 문서가 없습니다.'}
          </p>
          {!keyword && canCreate && (
            <Link href="/kb/new" className="mt-4">
              <Button variant="outline">첫 문서 작성하기</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={{ query: { ...params, page: String(page - 1) } }}
                >
                  <Button variant="outline" size="sm">이전</Button>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {page} / {result.totalPages} 페이지 (총 {result.total}건)
              </span>
              {page < result.totalPages && (
                <Link
                  href={{ query: { ...params, page: String(page + 1) } }}
                >
                  <Button variant="outline" size="sm">다음</Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
