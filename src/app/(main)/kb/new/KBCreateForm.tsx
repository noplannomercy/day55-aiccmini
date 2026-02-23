'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArticleEditor } from '@/components/kb/ArticleEditor'

/**
 * Client wrapper that POSTs a new KB article to /api/kb and redirects
 * to the created article's detail page on success.
 */
export function KBCreateForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(data: { title: string; content: string }) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to create article')
      }

      const article = await res.json()
      router.push(`/kb/${article.id}`)
      router.refresh()
    } catch (err) {
      console.error('Failed to create article:', err)
      setIsLoading(false)
    }
  }

  return <ArticleEditor onSubmit={handleSubmit} isLoading={isLoading} />
}
