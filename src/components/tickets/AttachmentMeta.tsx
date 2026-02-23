interface Attachment {
  url: string
  name?: string
}

interface AttachmentMetaProps {
  attachments: unknown[] | null
}

/**
 * Renders a list of attachment download links for a ticket.
 *
 * Each attachment is expected to follow the { url: string, name?: string }
 * shape stored in the ticket's `attachments` JSONB column.  If the array is
 * empty or null, nothing is rendered.
 */
export function AttachmentMeta({ attachments }: AttachmentMetaProps) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  const items = attachments as Attachment[]

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Attachments</h3>
      <ul className="space-y-1">
        {items.map((attachment, index) => (
          <li key={index}>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {attachment.name || attachment.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
