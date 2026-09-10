import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Sparkles, ChevronLeft, ChevronRight, CheckCircle2, XCircle, RotateCcw, Trophy, FileQuestion, History, Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select, FormField } from '../../components/ui/Select'
import { PageHeader } from '../../components/ui/PageHeader'
import { Progress } from '../../components/ui/Progress'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/useToast'
import { useJobPolling } from '../../hooks/useJobPolling'
import { studyApi } from '../../services/api'
import { cn } from '../../utils/cn'
import { StudyLoadingState } from './StudyLoadingState'

interface QuizQ {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
}

export function QuizGenerator() {
  const docs = useAppStore((s) => s.documents.items)
  const toast = useToast()
  const readyDocs = docs.filter((d) => d.status === 'ready')

  const [selectedDoc, setSelectedDoc] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [quizStarted, setQuizStarted] = useState(false)
  const [questions, setQuestions] = useState<QuizQ[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [quizSetId, setQuizSetId] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ id: string; document_id?: string | null; quiz_type: string; question_count: number; created_at: string }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const mapQuestions = (raw: Array<{ id: string; question: string; options: string[]; correct_answer: string; explanation?: string }>): QuizQ[] =>
    raw.map((q) => {
      const rawAns = String(q.correct_answer ?? '').trim()
      let correctIndex = -1
      const letter = rawAns.match(/^([A-Da-d])$/)
      const letterPrefix = rawAns.match(/^([A-Da-d])[.)\-:]/)
      if (letter) correctIndex = letter[1].toUpperCase().charCodeAt(0) - 65
      else if (letterPrefix) correctIndex = letterPrefix[1].toUpperCase().charCodeAt(0) - 65
      else if (/^[0-3]$/.test(rawAns)) correctIndex = Number(rawAns)
      if (correctIndex < 0 || correctIndex > 3) {
        correctIndex = q.options.findIndex((o) => o === q.correct_answer)
      }
      if (correctIndex < 0) {
        const norm = (s: string) => s.trim().toLowerCase().replace(/^[a-d0-9][.)\-:]\s*/, '')
        correctIndex = q.options.findIndex((o) => norm(o) === norm(rawAns))
      }
      if (correctIndex < 0) correctIndex = 0
      return { id: q.id, question: q.question, options: q.options, correctIndex, explanation: q.explanation }
    })

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await studyApi.listQuizHistory({ page: 1, page_size: 20 })
      const data = res.data as { items?: typeof history }
      setHistory(data.items || [])
    } catch {
      /* history is best-effort */
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory()
  }, [loadHistory])

  const openQuizSet = async (id: string) => {
    try {
      const res = await studyApi.getQuizSet(id)
      const data = res.data as { id: string; questions: Array<{ id: string; question: string; options: string[]; correct_answer: string }> }
      setQuestions(mapQuestions(data.questions || []))
      setQuizSetId(data.id)
      setJobId(null)
      setQuizStarted(true)
      setCurrentQ(0)
      setAnswers({})
      setSubmitted(false)
    } catch {
      toast({ type: 'error', title: 'Không thể mở đề đã lưu' })
    }
  }

  const { loading, progress, start, setProgress } = useJobPolling<QuizQ[]>({
    poll: async () => {
      if (!jobId) return { status: 'pending' }
      try {
        const res = await studyApi.getQuizJob(jobId)
        const data = res.data as { status: string; quiz_set_id?: string; questions?: Array<{ id: string; question: string; options: string[]; correct_answer: string; explanation?: string }> }
        if (data.status === 'ready' && data.questions) {
          if (data.quiz_set_id) setQuizSetId(data.quiz_set_id)
          // Backend chuẩn enterprise trả correct_answer là "A"/"B"/"C"/"D".
          const mapped = mapQuestions(data.questions)
          return { status: 'ready', data: mapped }
        }
        if (data.status === 'failed') {
          return { status: 'failed', error: 'Mô hình AI không thể phân tích tài liệu này.' }
        }
        return { status: 'processing' }
      } catch {
        return { status: 'processing' }
      }
    },
    onReady: (qs) => {
      setQuestions(qs)
      setQuizStarted(true)
      setCurrentQ(0)
      setAnswers({})
      setSubmitted(false)
      toast({ type: 'success', title: 'Đã tạo đề trắc nghiệm', message: `Sẵn sàng với ${qs.length} câu hỏi` })
      void loadHistory()
    },
    onError: () => {
      toast({ type: 'error', title: 'Không thể tạo đề trắc nghiệm' })
    },
    errorTitle: 'Không thể tạo đề trắc nghiệm',
    timeoutTitle: 'Quá thời gian tạo đề trắc nghiệm'
  })

  const handleGenerate = async () => {
    if (!selectedDoc) {
      toast({ type: 'warning', title: 'Vui lòng chọn một tài liệu trước' })
      return
    }
    try {
      const startRes = await studyApi.generateQuiz({
        document_id: selectedDoc,
        question_count: numQuestions,
      })
      const id = (startRes.data as { job_id: string }).job_id
      setJobId(id)
      setProgress(0)
      start()
    } catch {
      toast({ type: 'error', title: 'Không thể khởi chạy tiến trình tạo đề' })
    }
  }

  const handleSubmit = async () => {
    setSubmitted(true)
    const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length
    // Persist grading server-side when we have a saved set id (DB grading
    // survives TTL expiry); fall back to local scoring otherwise.
    if (quizSetId) {
      try {
        const payload = questions.map((q) => ({
          question_id: q.id,
          answer: String.fromCharCode(65 + (answers[q.id] ?? 0)),
        }))
        await studyApi.submitQuiz(quizSetId, payload)
      } catch {
        /* local score already shown */
      }
    }
    toast({
      type: 'info',
      title: `Kết quả: ${correct}/${questions.length}`,
      message: `Độ chính xác: ${questions.length ? Math.round((correct / questions.length) * 100) : 0}%`
    })
  }

  const handleReset = () => {
    setQuizStarted(false)
    setCurrentQ(0)
    setAnswers({})
    setSubmitted(false)
    setJobId(null)
    setQuizSetId(null)
    void loadHistory()
  }

  const handleDeleteSet = async (id: string) => {
    try {
      await studyApi.deleteQuizSet(id)
      setHistory((prev) => prev.filter((h) => h.id !== id))
      toast({ type: 'success', title: 'Đã xóa đề đã lưu' })
    } catch {
      toast({ type: 'error', title: 'Không thể xóa đề đã lưu' })
    }
  }

  if (!quizStarted && !loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          subtitle="Công cụ học tập"
          title="Tạo đề trắc nghiệm AI"
          description="Kiểm tra kiến thức với các câu hỏi do AI tạo ra từ chính tài liệu học của bạn."
          icon={<BookOpen />}
        />

        {readyDocs.length === 0 ? (
          <EmptyState
            icon={<FileQuestion />}
            title="Chưa có tài liệu sẵn sàng"
            description="Vui lòng tải lên và xử lý tài liệu trước khi tạo đề trắc nghiệm từ tài liệu đó."
          />
        ) : (
          <Card className="p-4 sm:p-6">
            <div className="grid gap-4">
              <FormField label="Chọn tài liệu học tập" required>
                <Select
                  value={selectedDoc}
                  onChange={setSelectedDoc}
                  placeholder="Chọn một tài liệu..."
                  options={readyDocs.map((d) => ({ value: d.id, label: d.name }))}
                />
              </FormField>

              <FormField label="Số lượng câu hỏi" required>
                <Select
                  value={String(numQuestions)}
                  onChange={(v) => setNumQuestions(Number(v))}
                  options={[
                    { value: '5', label: '5 câu hỏi' },
                    { value: '10', label: '10 câu hỏi' },
                    { value: '15', label: '15 câu hỏi' }
                  ]}
                />
              </FormField>
            </div>

            <Button
              onClick={handleGenerate}
              loading={loading}
              className="mt-6 w-full"
              size="lg"
              icon={<Sparkles className="h-4 w-4" />}
            >
              Bắt đầu tạo đề trắc nghiệm
            </Button>
          </Card>
        )}

        {history.length > 0 && (
          <Card className="mt-6 p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Đề đã lưu ({history.length})</h3>
            </div>
            <div className="grid gap-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
                  <button onClick={() => void openQuizSet(h.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {h.question_count} câu hỏi • {h.quiz_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {h.created_at ? new Date(h.created_at).toLocaleString('vi-VN') : ''}
                    </p>
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => void handleDeleteSet(h.id)} aria-label="Xóa đề" title="Xóa đề">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {historyLoading && <p className="mt-2 text-xs text-muted-foreground">Đang tải lịch sử...</p>}
          </Card>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <StudyLoadingState
        title="Đang tạo đề trắc nghiệm"
        description="Trợ lý AI đang phân tích tài liệu và biên soạn các câu hỏi trắc nghiệm phù hợp."
        progress={progress}
        statusText="Đang biên soạn câu hỏi"
        durationText="Quá trình này thường mất khoảng 20-60 giây"
      />
    )
  }

  const q = questions[currentQ]
  const correctCount = questions.filter((qu) => answers[qu.id] === qu.correctIndex).length
  const percent = Math.round((correctCount / questions.length) * 100)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        subtitle="Công cụ học tập"
        title="Đang làm bài trắc nghiệm"
        icon={<BookOpen />}
        actions={
          <Badge variant="primary" label={`${currentQ + 1} / ${questions.length}`} />
        }
      />

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">Tiến độ</span>
          <span className="font-semibold text-foreground tabular-nums">
            {Math.round(((currentQ + 1) / questions.length) * 100)}%
          </span>
        </div>
        <Progress value={((currentQ + 1) / questions.length) * 100} className="mt-2" />

        <div className="mt-6">
          <h3 className="font-display text-base font-semibold text-foreground leading-relaxed sm:text-lg break-words">
            {q.question}
          </h3>
          <div className="mt-4 grid gap-2">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i
              const isCorrect = submitted && i === q.correctIndex
              const isWrong = submitted && selected && i !== q.correctIndex
              return (
                <button
                  key={i}
                  onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                  disabled={submitted}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition',
                    isCorrect
                      ? 'border-success bg-success/10 text-success'
                      : isWrong
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface-elevated text-foreground hover:border-primary/40 hover:bg-muted/40 disabled:cursor-default'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                      isCorrect
                        ? 'bg-success text-success-foreground'
                        : isWrong
                          ? 'bg-destructive text-destructive-foreground'
                          : selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isWrong ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="flex-1 break-words">{opt}</span>
                </button>
              )
            })}
          </div>
        </div>

        {submitted && q.explanation && (
          <div className="mt-4 rounded-xl border border-info/30 bg-info/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-info">Giải thích</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{q.explanation}</p>
          </div>
        )}

        {submitted && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-zoom-in-95">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {correctCount} / {questions.length} câu đúng
              </p>
              <p className="text-xs text-muted-foreground">Độ chính xác: {percent}%</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            disabled={currentQ === 0}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Câu trước
          </Button>
          {currentQ < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQ((p) => p + 1)}
              iconRight={<ChevronRight className="h-4 w-4" />}
            >
              Câu tiếp
            </Button>
          ) : !submitted ? (
            <Button onClick={handleSubmit} variant="primary" icon={<CheckCircle2 className="h-4 w-4" />}>
              Nộp bài trắc nghiệm
            </Button>
          ) : (
            <Button onClick={handleReset} variant="outline" icon={<RotateCcw className="h-4 w-4" />}>
              Làm lại đề này
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
