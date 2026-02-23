'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TagManagerProps {
  articleId: string
  tags: string[]
  canEdit: boolean
}

/**
 * Displays and manages an article's tags.
 *
 * In read-only mode, tags are rendered as secondary badges.
 * When canEdit is true, each tag displays a remove button, and an
 * input field with an "Add" button allows appending new tags.
 *
 * Tag mutations call the /api/kb/[articleId]/tags endpoint and
 * refresh the server component tree via router.refresh().
 */
export function TagManager({ articleId, tags, canEdit }: TagManagerProps) {
  const router = useRouter()
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleAddTag(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = newTag.trim()
    if (!trimmed) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/kb/${articleId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add tag')
      }
      setNewTag('')
      router.refresh()
    } catch (err) {
      console.error('Failed to add tag:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemoveTag(tag: string) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/kb/${articleId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to remove tag')
      }
      router.refresh()
    } catch (err) {
      console.error('Failed to remove tag:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 && (
          <span className="text-sm text-muted-foreground">No tags</span>
        )}
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            {canEdit && (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                disabled={isLoading}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 px-0.5 text-xs leading-none"
                aria-label={`Remove tag ${tag}`}
              >
                &times;
              </button>
            )}
          </Badge>
        ))}
      </div>

      {canEdit && (
        <form onSubmit={handleAddTag} className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="New tag..."
            disabled={isLoading}
            className="max-w-[200px]"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isLoading || !newTag.trim()}
          >
            Add
          </Button>
        </form>
      )}
    </div>
  )
}
