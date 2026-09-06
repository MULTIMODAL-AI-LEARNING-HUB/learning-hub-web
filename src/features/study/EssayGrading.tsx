import { useState } from 'react'
import { PenLine, Sparkles, FileText, CheckCircle2, Award, RotateCcw, FileQuestion } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select, FormField } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/useToast'
import { studyApi } from '../../services/api'

interface GradingResult {
  score: number
  feedback: string
  comparisons: Array<{ student_point: string; source_match: string; similarity: number; assessment: string }>
}

export function EssayGrading() {
  const docs = useAppStore((s) => s.documents.items)
  const toast = useToast()
  const readyDocs = docs.filter((d) => d.status === 'ready')

  const [selectedDoc, setSelectedDoc] = useState('')
  const [essay, setEssay] = useState('')
  const [result, setResult] = useState<GradingResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGrade = async () => {
    if (!essay.trim()) {
      toast({ type: 'warning', title: 'Vui lòng viết bài luận trước' })
      return
    }
    if (!selectedDoc) {
      toast({ type: 'warning', title: 'Vui lòng chọn tài liệu tham chiếu' })
      return
    }
    setLoading(true)
    try {
      const res = await studyApi.submitEssay({
        document_id: selectedDoc,
        essay_text: essay,
      })
      setResult(res.data as GradingResult)
      toast({ type: 'success', title: 'Đã hoàn tất chấm điểm', message: `Điểm số: ${(res.data as GradingResult).score}/10` })
    } catch {
      toast({ type: 'error', title: 'Chấm điểm bài luận thất bại' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setEssay('')
  }

  const wordCount = essay.split(/\s+/).filter(Boolean).length

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        subtitle="Công cụ học tập"
        title="Chấm bài luận AI"
        description="Nhận đánh giá và nhận xét từ AI cho bài luận của bạn, so sánh đối chiếu với tài liệu gốc."
        icon={<PenLine />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          {readyDocs.length === 0 ? (
            <EmptyState
              icon={<FileQuestion />}
              title="Chưa có tài liệu sẵn sàng"
              description="Vui lòng tải lên tài liệu trước để làm cơ sở đối chiếu và chấm bài luận."
            />
          ) : (
            <div className="space-y-4">
              <FormField label="Tài liệu tham chiếu" required>
                <Select
                  value={selectedDoc}
                  onChange={setSelectedDoc}
                  placeholder="Chọn tài liệu đối chiếu..."
                  options={readyDocs.map((d) => ({ value: d.id, label: d.name }))}
                />
              </FormField>

              <FormField label="Nội dung bài luận của bạn" required>
                <Textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  placeholder="Viết hoặc dán nội dung bài luận của bạn vào đây..."
                  rows={14}
                />
              </FormField>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {wordCount} từ
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="ghost" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />}>
                    Xóa làm lại
                  </Button>
                  <Button
                    onClick={handleGrade}
                    loading={loading}
                    size="sm"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                  >
                    Chấm điểm bài luận
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div>
          {loading ? (
            <Card className="p-12">
              <div className="flex flex-col items-center text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-sm font-semibold text-foreground">Đang phân tích bài luận của bạn</p>
                <p className="mt-1 text-xs text-muted-foreground">Đang đối chiếu nội dung với tài liệu tham chiếu...</p>
              </div>
            </Card>
          ) : result ? (
            <Card className="p-5 animate-slide-in-from-bottom">
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
                  <div className="text-center">
                    <div className="font-display text-2xl font-bold tabular-nums">{result.score}</div>
                    <div className="text-2xs opacity-80 -mt-1">/10</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Điểm tổng quan</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.score >= 8 ? 'Bài viết rất xuất sắc!' : result.score >= 6 ? 'Tốt, còn một số điểm cần cải thiện' : 'Cần đào sâu nội dung hơn'}
                  </p>
                </div>
                <Award className="ml-auto h-5 w-5 text-accent" />
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Nhận xét & Góp ý
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm text-foreground/90 leading-relaxed">{result.feedback}</p>
                </div>
              </div>

              {result.comparisons && result.comparisons.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Đối chiếu với nguồn tài liệu
                  </p>
                  <div className="space-y-2">
                    {result.comparisons.map((c, i) => {
                      const simPct = Math.round(c.similarity * 100)
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-surface-elevated p-3 space-y-1.5"
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <p className="text-sm text-foreground">{c.student_point}</p>
                          </div>
                          <div className="flex items-start gap-2 pl-5">
                            <FileText className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                            <p className="text-xs text-muted-foreground">{c.source_match}</p>
                          </div>
                          <div className="flex items-center gap-2 pl-5 pt-1">
                            <Badge
                              variant={simPct >= 80 ? 'success' : simPct >= 50 ? 'warning' : 'error'}
                              label={c.assessment}
                            />
                            <span className="text-2xs text-muted-foreground tabular-nums">{simPct}% độ trùng khớp</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <EmptyState
              icon={<Sparkles />}
              title="Sẵn sàng chấm điểm"
              description="Nhập hoặc dán bài luận ở khung bên trái, sau đó bấm Chấm điểm bài luận để AI phân tích và đối chiếu tài liệu."
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  )
}
