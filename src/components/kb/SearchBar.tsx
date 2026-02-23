'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/**
 * Search bar for filtering KB articles by keyword.
 *
 * Submits a form that updates the URL ?keyword= search parameter,
 * keeping filter state in the URL for bookmarkability and server-side
 * data fetching. Resets pagination to page 1 on new searches.
 */
export function SearchBar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentKeyword = searchParams.get('keyword') ?? ''

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const keyword = (formData.get('keyword') as string).trim()

    const params = new URLSearchParams(searchParams.toString())
    if (keyword) {
      params.set('keyword', keyword)
    } else {
      params.delete('keyword')
    }
    // Reset to page 1 on new search
    params.delete('page')

    router.push(`/kb?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        name="keyword"
        placeholder="Search articles..."
        defaultValue={currentKeyword}
        className="max-w-sm"
      />
      <Button type="submit" variant="outline">
        검색
      </Button>
    </form>
  )
}
