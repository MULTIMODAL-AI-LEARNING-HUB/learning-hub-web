import { Sparkles } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Progress } from '../../components/ui/Progress'

interface StudyLoadingStateProps {
  title: string
  description: string
  progress: number
  statusText?: string
  durationText?: string
}

export function StudyLoadingState({
  title,
  description,
  progress,
  statusText = 'Đang xử lý',
  durationText = 'Quá trình này thường mất khoảng 20-60 giây'
}: StudyLoadingStateProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        subtitle="Công cụ học tập"
        title={title}
        description={description}
        icon={<Sparkles className="text-primary animate-pulse" />}
      />
      <Card className="p-6 border-border/40 bg-surface-elevated/40 backdrop-blur-sm shadow-soft">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">{statusText}</span>
            <span className="text-muted-foreground font-mono">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} indeterminate={progress < 5} />
          <p className="text-xs text-muted-foreground text-center pt-2">
            {durationText}
          </p>
        </div>
      </Card>
    </div>
  )
}
