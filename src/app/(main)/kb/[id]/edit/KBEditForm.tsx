'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArticleEditor } from '@/components/kb/ArticleEditor'
import type { KBArticle } from '@/types'

interface KBEditFormProps {
  article: KBArticle
}

/**
 * Client component wrapper around ArticleEditor for editing an existing
 * KB article. Submits a PATCH request to /api/kb/[id] and redirects
 * to the article detail page on success.
 */
export function KBEditForm({ article }: KBEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(data: { title: string; content: string }) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/kb/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to update article')
      }

      router.push(`/kb/${article.id}`)
      router.refresh()
    } catch (err) {
      console.error('Failed to update article:', err)
      setIsLoading(false)
    }
  }

  return (
    <ArticleEditor
      article={article}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  )
}
