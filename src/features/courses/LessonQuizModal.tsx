/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  HelpCircle,
  Play,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Progress } from '../../components/ui/Progress'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/useToast'
import {
  quizzesApi,
  type QuizAttempt,
  type QuizAttemptResult,
  type QuizStudent,
} from '../../services/api'
import { cn } from '../../utils/cn'

interface LessonQuizModalProps {
  open: boolean
  onClose: () => void
  lessonId: string
  lessonTitle: string
  onQuizCompleted?: () => void
}

type ModalView = 'overview' | 'taking' | 'result'

export function LessonQuizModal({
  open,
  onClose,
  lessonId,
  lessonTitle,
  onQuizCompleted,
}: LessonQuizModalProps) {
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [starting, setStarting] = useState(false)
  const [quiz, setQuiz] = useState<QuizStudent | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [view, setView] = useState<ModalView>('overview')

  // Taking state
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)

  // Result state
  const [lastResult, setLastResult] = useState<QuizAttemptResult | null>(null)

  const loadQuizData = useCallback(async () => {
    if (!lessonId) return
    setLoading(true)
    try {
      const [quizRes, attemptsRes] = await Promise.all([
        quizzesApi.getStudentQuiz(lessonId).catch(() => null),
        quizzesApi.getMyAttempts(lessonId).catch(() => ({ data: [] as QuizAttempt[] })),
      ])

      if (quizRes?.data) {
        setQuiz(quizRes.data)
      } else {
        setQuiz(null)
      }

      setAttempts(attemptsRes?.data || [])
    } catch (err) {
      console.error('Failed to load lesson quiz:', err)
      toast({ type: 'error', title: 'Không thể tải thông tin bài trắc nghiệm' })
    } finally {
      setLoading(false)
    }
  }, [lessonId, toast])

  useEffect(() => {
    if (open) {
      setView('overview')
      setSelectedAnswers({})
      setLastResult(null)
      setCurrentAttempt(null)
      loadQuizData()
    }
  }, [open, loadQuizData])

  const handleSubmitAttempt = useCallback(async () => {
    if (!currentAttempt) return
    setSubmitting(true)
    try {
      const answersPayload = Object.entries(selectedAnswers).map(([question_id, selected_answers]) => ({
        question_id,
        selected_answers,
      }))

      const res = await quizzesApi.submitAttempt(lessonId, currentAttempt.id, answersPayload)
      setLastResult(res.data)
      setView('result')

      // Refresh attempts history
      const attemptsRes = await quizzesApi.getMyAttempts(lessonId).catch(() => null)
      if (attemptsRes?.data) {
        setAttempts(attemptsRes.data)
      }

      if (res.data.passed) {
        toast({ type: 'success', title: 'Chúc mừng! Bạn đã vượt qua bài trắc nghiệm' })
      } else {
        toast({ type: 'info', title: 'Bạn chưa đạt điểm qua môn. Hãy ôn tập lại nhé!' })
      }

      onQuizCompleted?.()
    } catch (err: unknown) {
      const errMsg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null
      toast({ type: 'error', title: errMsg || 'Nộp bài trắc nghiệm thất bại' })
    } finally {
      setSubmitting(false)
    }
  }, [currentAttempt, selectedAnswers, lessonId, toast, onQuizCompleted])

  // Timer countdown
  useEffect(() => {
    if (view !== 'taking' || timeLeftSeconds === null) return

    if (timeLeftSeconds <= 0) {
      // Auto submit on time expired
      handleSubmitAttempt()
      return
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev !== null ? Math.max(0, prev - 1) : null))
    }, 1000)

    return () => clearInterval(timer)
  }, [view, timeLeftSeconds, handleSubmitAttempt])

  const questions = quiz?.questions || []
  const maxAttempts = quiz?.max_attempts || 3
  const attemptsCount = attempts.length
  const canAttempt = attemptsCount < maxAttempts

  // Calculate highest and latest score
  const bestAttempt = useMemo(() => {
    if (attempts.length === 0) return null
    return [...attempts].sort((a, b) => (b.score || 0) - (a.score || 0))[0]
  }, [attempts])

  const handleStartAttempt = async () => {
    if (!quiz || !canAttempt) return
    setStarting(true)
    try {
      const res = await quizzesApi.startAttempt(lessonId)
      setCurrentAttempt(res.data)
      setSelectedAnswers({})
      setActiveQuestionIndex(0)
      if (quiz.duration_mins && quiz.duration_mins > 0) {
        setTimeLeftSeconds(quiz.duration_mins * 60)
      } else {
        setTimeLeftSeconds(null)
      }
      setView('taking')
    } catch (err: unknown) {
      const errMsg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null
      toast({ type: 'error', title: errMsg || 'Không thể bắt đầu lượt làm bài' })
    } finally {
      setStarting(false)
    }
  }

  const handleSelectOption = (questionId: string, answerId: string, isMultiple: boolean) => {
    setSelectedAnswers((prev) => {
      const current = prev[questionId] || []
      if (isMultiple) {
        if (current.includes(answerId)) {
          return { ...prev, [questionId]: current.filter((id) => id !== answerId) }
        } else {
          return { ...prev, [questionId]: [...current, answerId] }
        }
      } else {
        return { ...prev, [questionId]: [answerId] }
      }
    })
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Number of answered questions
  const answeredCount = questions.filter((q) => (selectedAnswers[q.id] || []).length > 0).length

  return (
    <Modal
      open={open}
      onClose={() => {
        if (view === 'taking') {
          if (window.confirm('Bạn đang trong quá trình làm bài. Bạn có chắc chắn muốn thoát không?')) {
            onClose()
          }
        } else {
          onClose()
        }
      }}
      size="3xl"
      title={view === 'taking' ? quiz?.title || 'Bài kiểm tra trắc nghiệm' : undefined}
      hideClose={view === 'taking'}
    >
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="space-y-4 py-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        ) : !quiz ? (
          <div className="py-12 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-3 text-base font-semibold text-foreground">Chưa có bài trắc nghiệm</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bài học này chưa được thiết lập bài trắc nghiệm hoặc đang được cập nhật.
            </p>
            <Button variant="outline" className="mt-5" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : view === 'overview' ? (
          // ================= VIEW: OVERVIEW =================
          <div className="space-y-6">
            <div className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" label="Trắc nghiệm ôn tập" />
                  <span className="text-xs text-muted-foreground">{lessonTitle}</span>
                </div>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {quiz.title}
                </h2>
                {quiz.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>
                )}
              </div>

              {bestAttempt && (
                <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      bestAttempt.passed ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                    )}
                  >
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-muted-foreground">Điểm cao nhất</div>
                    <div className="text-base font-bold text-foreground">
                      {Math.round(bestAttempt.score || 0)}/100
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-center">
                <div className="text-xs text-muted-foreground">Số câu hỏi</div>
                <div className="mt-1 text-lg font-bold text-foreground">{questions.length}</div>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-center">
                <div className="text-xs text-muted-foreground">Điểm cần đạt</div>
                <div className="mt-1 text-lg font-bold text-primary">{quiz.passing_score}%</div>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-center">
                <div className="text-xs text-muted-foreground">Thời gian</div>
                <div className="mt-1 text-lg font-bold text-foreground">
                  {quiz.duration_mins && quiz.duration_mins > 0 ? `${quiz.duration_mins} phút` : 'Tự do'}
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-center">
                <div className="text-xs text-muted-foreground">Lượt làm bài</div>
                <div className="mt-1 text-lg font-bold text-foreground">
                  {attemptsCount}/{maxAttempts}
                </div>
              </div>
            </div>

            {/* Attempts History */}
            {attempts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Lịch sử các lần làm bài
                </h4>
                <div className="space-y-2">
                  {attempts.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-sm transition hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            att.passed ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                          )}
                        >
                          {att.passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">Lần {att.attempt_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(att.started_at).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'font-bold tabular-nums',
                            att.passed ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {Math.round(att.score || 0)}/100
                        </span>
                        <Badge
                          variant={att.passed ? 'success' : 'error'}
                          label={att.passed ? 'Đạt' : 'Chưa đạt'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
              {questions.length === 0 ? (
                <Button disabled>Chưa có câu hỏi nào</Button>
              ) : canAttempt ? (
                <Button
                  onClick={handleStartAttempt}
                  loading={starting}
                  icon={<Play className="h-4 w-4" />}
                  className="shadow-sm"
                >
                  {attemptsCount === 0 ? 'Bắt đầu làm bài' : 'Làm lại bài kiểm tra'}
                </Button>
              ) : (
                <Button disabled variant="outline">
                  Đã hết lượt làm bài ({maxAttempts}/{maxAttempts})
                </Button>
              )}
            </div>
          </div>
        ) : view === 'taking' ? (
          // ================= VIEW: TAKING =================
          <div className="space-y-5">
            {/* Taking Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  Câu {activeQuestionIndex + 1} / {questions.length}
                </span>
                <span className="text-xs text-muted-foreground">
                  (Đã trả lời {answeredCount}/{questions.length})
                </span>
              </div>

              <div className="flex items-center gap-3">
                {timeLeftSeconds !== null && (
                  <div
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-sm font-semibold transition-colors',
                      timeLeftSeconds < 120
                        ? 'bg-destructive/15 text-destructive animate-pulse'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    <span>{formatTimer(timeLeftSeconds)}</span>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSubmitAttempt}
                  loading={submitting}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Nộp bài
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <Progress value={Math.round((answeredCount / Math.max(1, questions.length)) * 100)} />

            {/* Question Quick Jump Pills */}
            <div className="flex flex-wrap gap-1.5 py-1">
              {questions.map((q, idx) => {
                const isAnswered = (selectedAnswers[q.id] || []).length > 0
                const isActive = idx === activeQuestionIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1'
                        : isAnswered
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            {/* Current Question Body */}
            {questions[activeQuestionIndex] && (
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 items-center rounded-md bg-primary/10 px-2 text-[11px] font-bold text-primary">
                      Câu {activeQuestionIndex + 1}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {questions[activeQuestionIndex].points} điểm
                    </span>
                  </div>
                  {questions[activeQuestionIndex].type === 'MULTIPLE_CHOICE' && (
                    <Badge variant="info" label="Chọn nhiều đáp án" />
                  )}
                </div>

                <h3 className="mt-3 text-base font-semibold leading-relaxed text-foreground sm:text-lg">
                  {questions[activeQuestionIndex].question_text}
                </h3>

                {/* Answers list */}
                <div className="mt-5 space-y-2.5">
                  {(questions[activeQuestionIndex].answers || []).map((answer, ansIdx) => {
                    const isSelected = (
                      selectedAnswers[questions[activeQuestionIndex].id] || []
                    ).includes(answer.id)
                    const isMultiple = questions[activeQuestionIndex].type === 'MULTIPLE_CHOICE'
                    const letter = String.fromCharCode(65 + ansIdx)

                    return (
                      <button
                        key={answer.id}
                        onClick={() =>
                          handleSelectOption(questions[activeQuestionIndex].id, answer.id, isMultiple)
                        }
                        className={cn(
                          'flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left text-sm transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 text-foreground font-medium shadow-xs ring-1 ring-primary'
                            : 'border-border bg-card hover:border-border/80 hover:bg-muted/40 text-foreground/90'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {letter}
                        </div>
                        <span className="flex-1 text-sm leading-snug">{answer.answer_text}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
              >
                Câu trước
              </Button>

              <div className="flex gap-2">
                {activeQuestionIndex < questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      setActiveQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                    }
                  >
                    Câu tiếp theo
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSubmitAttempt}
                    loading={submitting}
                  >
                    Hoàn thành & Nộp bài
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // ================= VIEW: RESULT =================
          <div className="py-6 text-center space-y-6">
            <div
              className={cn(
                'mx-auto flex h-20 w-20 items-center justify-center rounded-full',
                lastResult?.passed
                  ? 'bg-success/15 text-success ring-8 ring-success/10'
                  : 'bg-destructive/15 text-destructive ring-8 ring-destructive/10'
              )}
            >
              {lastResult?.passed ? (
                <Award className="h-10 w-10 animate-bounce" />
              ) : (
                <AlertCircle className="h-10 w-10" />
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {lastResult?.passed ? 'Xuất sắc! Bạn đã vượt qua' : 'Chưa đạt điểm yêu cầu'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {lastResult?.passed
                  ? 'Bạn đã hoàn thành bài kiểm tra và đạt chuẩn kiến thức của bài học này.'
                  : `Bạn cần đạt tối thiểu ${quiz.passing_score}% để hoàn thành bài trắc nghiệm này.`}
              </p>
            </div>

            <div className="mx-auto max-w-xs rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Điểm số đạt được
              </div>
              <div
                className={cn(
                  'mt-2 text-4xl font-extrabold tracking-tight',
                  lastResult?.passed ? 'text-success' : 'text-destructive'
                )}
              >
                {Math.round(lastResult?.score || 0)}%
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Lần làm bài thứ {lastResult?.attempt_number} · Điểm đạt: {quiz.passing_score}%
              </div>
            </div>

            {/* Weak-point remediation highlight block */}
            {lastResult?.answers_detail && lastResult.answers_detail.filter((d) => !d.is_correct).length > 0 && (
              <div className="mx-auto max-w-xl rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-left space-y-3">
                <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  ⚠️ Các khái niệm bạn cần củng cố lại:
                </h4>
                <div className="space-y-2">
                  {lastResult.answers_detail
                    .filter((d) => !d.is_correct)
                    .map((d) => (
                      <div
                        key={d.question_id}
                        className="rounded-xl border border-destructive/20 bg-card/80 p-3 text-xs"
                      >
                        <p className="font-semibold text-foreground line-clamp-2">
                          {d.question_text || 'Câu hỏi'}
                        </p>
                        {d.explanation && (
                          <p className="mt-1 text-muted-foreground line-clamp-3">
                            💡 {d.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onClose()
                  }}
                  className="mt-1 bg-gradient-to-r from-amber-500 to-primary text-white hover:brightness-110 shadow-sm"
                >
                  🚀 Luyện tập củng cố ngay (trên Dashboard)
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={onClose}>
                Quay lại bài học
              </Button>
              {canAttempt && (
                <Button
                  onClick={handleStartAttempt}
                  loading={starting}
                  icon={<RotateCcw className="h-4 w-4" />}
                >
                  Làm lại bài kiểm tra
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
