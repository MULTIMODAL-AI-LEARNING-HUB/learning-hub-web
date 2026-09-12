import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, BrainCircuit, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useToast } from '../../components/ui/useToast'
import { mindmapApi, type LessonMindmapResponse } from '../../services/api'
import { InteractiveMindmap } from '../study/InteractiveMindmap'

interface LessonMindmapViewProps {
  lessonId: string
  lessonTitle: string
}

export function LessonMindmapView({ lessonId, lessonTitle }: LessonMindmapViewProps) {
  const toast = useToast()
  const [data, setData] = useState<LessonMindmapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMindmap = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await mindmapApi.getLessonMindmap(lessonId)
      setData(res.data)
    } catch (err: any) {
      console.error('Failed to load mindmap:', err)
      setError(err?.response?.data?.detail || 'Không thể tải sơ đồ tư duy cho bài học này.')
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    fetchMindmap()
  }, [fetchMindmap])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await mindmapApi.regenerateLessonMindmap(lessonId)
      setData(res.data)
      toast({
        type: 'success',
        title: 'Đã vẽ lại sơ đồ tư duy mới từ AI!',
      })
    } catch (err: any) {
      console.error('Failed to regenerate mindmap:', err)
      toast({
        type: 'error',
        title: 'Tạo lại sơ đồ tư duy thất bại',
        message: err?.response?.data?.detail || 'Vui lòng thử lại sau giây lát.',
      })
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <Card padding="responsive" className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="font-semibold text-foreground">Sơ đồ tư duy bài học</h3>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 animate-spin text-primary" />
            Đang phân tích cấu trúc bài giảng...
          </div>
        </div>
        <div className="h-[450px] w-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20">
          <Sparkles className="h-8 w-8 text-primary animate-bounce" />
          <p className="text-sm font-medium text-foreground">AI đang tổng hợp cây kiến thức trực quan...</p>
          <p className="text-xs text-muted-foreground max-w-sm text-center">
            Quá trình này phân tích toàn bộ nội dung bài học để xây dựng sơ đồ khái niệm đa nhánh.
          </p>
        </div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card padding="responsive" className="border-destructive/30 bg-destructive/5 space-y-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Không thể hiển thị sơ đồ tư duy</h3>
        </div>
        <p className="text-sm text-muted-foreground">{error || 'Chưa có dữ liệu sơ đồ tư duy.'}</p>
        <Button size="sm" variant="outline" onClick={fetchMindmap}>
          Thử tải lại
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Caching status note */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-2xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              data.is_cached ? 'bg-emerald-500' : 'bg-primary'
            }`}
          />
          <span>
            {data.is_cached
              ? 'Tải từ bộ nhớ đệm (0ms latency, tối ưu token)'
              : 'Vừa được tạo mới bằng AI'}
          </span>
        </div>
        <span>Thu phóng bằng con lăn chuột, kéo để di chuyển vị trí, nhấp vào nốt để thu gọn/mở rộng</span>
      </div>

      <InteractiveMindmap
        markdown={data.markdown_tree}
        title={data.lesson_title || lessonTitle}
        className="h-[560px]"
        onRegenerate={handleRegenerate}
        isRegenerating={regenerating}
      />
    </div>
  )
}
