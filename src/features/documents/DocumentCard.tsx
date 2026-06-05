import { MoreVertical, RefreshCw, Trash2 } from 'lucide-react'
import { fileIconEmoji } from '../../utils/fileIcon'
import { cn } from '../../utils/cn'
import { Progress } from '../../components/ui/Progress'
import { Badge } from '../../components/ui/Badge'
import { Dropdown } from '../../components/ui/Dropdown'
import type { DocumentItem } from '../../types'

interface DocumentCardProps {
  doc: DocumentItem
  isSelected?: boolean
  onSelect?: () => void
  onRetry?: (id: string) => void
  onRemove?: (id: string) => void
  variant?: 'default' | 'compact'
  className?: string
}

export function DocumentCard({
  doc,
  isSelected = false,
  onSelect,
  onRetry,
  onRemove,
  variant = 'default',
  className
}: DocumentCardProps) {
  const isCompact = variant === 'compact'
  const showActions = !isCompact

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative rounded-xl border transition-all cursor-pointer',
        isCompact ? 'p-2.5' : 'p-3',
        isSelected
          ? 'border-primary bg-primary/5 shadow-soft'
          : 'border-border bg-surface-elevated hover:border-primary/30 hover:shadow-soft',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'shrink-0 flex items-center justify-center rounded-lg bg-muted/60',
            isCompact ? 'h-7 w-7 text-base' : 'h-9 w-9 text-lg'
          )}
        >
          {fileIconEmoji(doc.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('truncate font-medium text-foreground', isCompact ? 'text-xs' : 'text-sm')}>
            {doc.name}
          </p>
          <p className={cn('truncate text-muted-foreground', isCompact ? 'text-2xs' : 'text-xs')}>
            {doc.size}
          </p>
        </div>
        {showActions && (onRetry || onRemove) && (
          <div
            className="opacity-0 group-hover:opacity-100 transition"
            onClick={(e) => e.stopPropagation()}
          >
            <Dropdown
              trigger={
                <button
                  className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Document actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
              align="right"
              items={[
                ...(doc.status === 'failed' && onRetry
                  ? [
                      {
                        id: 'retry',
                        label: 'Retry',
                        icon: <RefreshCw />,
                        shortcut: 'R'
                      }
                    ]
                  : []),
                ...(onRemove
                  ? [
                      {
                        id: 'remove',
                        label: 'Delete',
                        icon: <Trash2 />,
                        danger: true
                      }
                    ]
                  : [])
              ]}
              onSelect={(id) => {
                if (id === 'retry') onRetry?.(doc.id)
                if (id === 'remove') onRemove?.(doc.id)
              }}
            />
          </div>
        )}
      </div>

      {!isCompact && (
        <div className="mt-2.5">
          {doc.status === 'processing' && (
            <div className="space-y-1.5">
              <Progress value={doc.progress ?? 0} size="sm" />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />
                Processing · {doc.progress}%
              </p>
            </div>
          )}
          {doc.status === 'ready' && (
            <div className="flex items-center gap-2">
              <Badge variant="success" label="Ready" dot />
              {doc.pageCount !== undefined && (
                <span className="text-xs text-muted-foreground">{doc.pageCount} pages</span>
              )}
            </div>
          )}
          {doc.status === 'failed' && (
            <div className="flex items-center justify-between">
              <Badge variant="error" label="Failed" dot />
              {onRetry && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRetry(doc.id)
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isCompact && doc.status === 'processing' && (
        <div className="mt-1.5">
          <Progress value={doc.progress ?? 0} size="sm" />
        </div>
      )}
    </div>
  )
}
