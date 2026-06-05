import { Sparkles, Loader2 } from 'lucide-react'
import { Card } from './Card'
import { Progress } from './Progress'
import { cn } from '../../utils/cn'

interface GenerationProgressProps {
  title: string
  description?: string
  progress: number
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'loading'
  className?: string
}

const statusLabels = {
  pending: 'Queued',
  loading: 'Starting',
  processing: 'Generating',
  ready: 'Ready',
  failed: 'Failed'
}

export function GenerationProgress({
  title,
  description,
  progress,
  status,
  className
}: GenerationProgressProps) {
  const isActive = status === 'processing' || status === 'loading' || status === 'pending'
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            isActive
              ? 'bg-primary/10 text-primary'
              : status === 'ready'
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
          )}
        >
          {isActive ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : status === 'ready' ? (
            <Sparkles className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <span className="text-2xs font-medium text-muted-foreground">
              {statusLabels[status]}
            </span>
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
          <div className="mt-3">
            <Progress
              value={progress}
              variant={status === 'failed' ? 'destructive' : status === 'ready' ? 'success' : 'default'}
              size="md"
              indeterminate={isActive && progress === 0}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
