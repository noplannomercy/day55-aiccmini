'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { KBArticle } from '@/types'

interface ArticleEditorProps {
  article?: KBArticle
  onSubmit: (data: { title: string; content: string }) => Promise<void>
  isLoading?: boolean
}

/**
 * Form for creating or editing a KB article.
 *
 * Renders a title input and a large monospace textarea for markdown-style
 * content editing. Pre-fills from the article prop when editing an existing
 * article. The submit button shows a loading state while the onSubmit
 * callback is in progress.
 */
export function ArticleEditor({ article, onSubmit, isLoading }: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title ?? '')
  const [content, setContent] = useState(article?.content ?? '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle || !trimmedContent) return
    await onSubmit({ title: trimmedTitle, content: trimmedContent })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="article-title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="article-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="article-content" className="text-sm font-medium">
          Content
        </label>
        <Textarea
          id="article-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your article content here..."
          rows={20}
          required
          disabled={isLoading}
          className="font-mono"
        />
      </div>

      <Button type="submit" disabled={isLoading || !title.trim() || !content.trim()}>
        {isLoading ? 'Saving...' : article ? 'Update Article' : 'Create Article'}
      </Button>
    </form>
  )
}
