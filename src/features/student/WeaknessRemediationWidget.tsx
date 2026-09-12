import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react'
import {
  adaptiveApi,
  type RemedialQuestion,
  type WeaknessAreaItem,
} from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/useToast'
import { cn } from '../../utils/cn'

export function WeaknessRemediationWidget() {
  const toast = useToast()
  const [weaknesses, setWeaknesses] = useState<WeaknessAreaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRemedialLesson, setActiveRemedialLesson] = useState<WeaknessAreaItem | null>(null)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [remedialQuestions, setRemedialQuestions] = useState<RemedialQuestion[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const loadWeaknesses = async () => {
    try {
      setLoading(true)
      const res = await adaptiveApi.getMyWeaknesses(4)
      setWeaknesses(res.data.weaknesses || [])
    } catch (err) {
      console.error('Failed to load weaknesses:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWeaknesses()
  }, [])

  const handleStartRemedial = async (weakness: WeaknessAreaItem) => {
    setActiveRemedialLesson(weakness)
    setModalOpen(true)
    setGeneratingQuiz(true)
    setAnswers({})
    setSubmitted(false)
    try {
      const res = await adaptiveApi.generateRemedialQuiz(weakness.lesson_id, 3)
      setRemedialQuestions(res.data.questions || [])
    } catch (err) {
      console.error('Failed to generate remedial quiz:', err)
      toast({ type: 'error', title: 'Không thể tạo bài tập củng cố lúc này' })
      setModalOpen(false)
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const handleSelectOption = (qId: string, optLetter: string) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [qId]: optLetter }))
  }

  const handleSubmitRemedial = () => {
    setSubmitted(true)
    const correctCount = remedialQuestions.filter(
      (q) => answers[q.id] === q.correct_answer
    ).length
    if (correctCount === remedialQuestions.length) {
      toast({ type: 'success', title: 'Tuyệt vời! Bạn đã trả lời đúng toàn bộ câu hỏi củng cố.' })
    } else {
      toast({
        type: 'info',
        title: `Hoàn thành: bạn đúng ${correctCount}/${remedialQuestions.length} câu. Hãy đọc kỹ phần giải thích nhé!`,
      })
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-border/80 bg-surface-elevated p-5 sm:p-6 shadow-soft space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (weaknesses.length === 0) {
    return (
      <div className="rounded-3xl border border-border/70 bg-gradient-to-r from-emerald-500/5 via-surface-elevated to-surface-elevated p-5 sm:p-6 shadow-soft flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Không có lỗ hổng kiến thức tồn đọng</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bạn đang làm rất tốt các bài trắc nghiệm. Hãy duy trì phong độ và tiếp tục các bài học mới!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-surface-elevated to-surface-elevated p-5 sm:p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Chẩn đoán điểm yếu & Ôn tập trúng đích
                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-3xs font-semibold text-amber-600 dark:text-amber-400">
                  {weaknesses.length} chủ đề cần ôn
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI phân tích các câu làm sai gần đây và tạo câu hỏi luyện tập bù đắp tức thì.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {weaknesses.map((item) => (
            <div
              key={item.lesson_id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-background/80 p-4 hover:border-amber-500/50 hover:shadow-sm transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-3xs font-semibold uppercase tracking-wider text-muted-foreground line-clamp-1">
                    {item.course_title}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-md text-3xs font-bold shrink-0',
                      item.accuracy_percent < 50
                        ? 'bg-destructive/15 text-destructive'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    )}
                  >
                    Độ chính xác {item.accuracy_percent}%
                  </span>
                </div>
                <h4 className="mt-1 text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {item.lesson_title}
                </h4>

                <div className="mt-2 space-y-1">
                  {item.missed_questions.slice(0, 2).map((mq) => (
                    <p
                      key={mq.question_id}
                      className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                      <span>{mq.question_text}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-3xs text-muted-foreground">
                  Làm sai {item.missed_count}/{item.total_questions} câu
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartRemedial(item)}
                  icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                  className="h-8 text-xs font-semibold border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                >
                  Luyện củng cố ngay
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Remedial Micro-Quiz Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Ôn tập củng cố: ${activeRemedialLesson?.lesson_title || 'Bài học'}`}
        size="lg"
      >
        <div className="space-y-6 py-1">
          {generatingQuiz ? (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 animate-pulse">
                <Brain className="h-8 w-8 animate-spin" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  AI đang tạo 3 câu hỏi củng cố điểm yếu...
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Dựa vào các câu bạn đã làm sai, AI đang thiết kế các tình huống kiểm tra mới để giúp bạn nắm vững bản chất.
                </p>
              </div>
            </div>
          ) : remedialQuestions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Không thể tải câu hỏi củng cố. Vui lòng thử lại sau.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  Các câu hỏi dưới đây được cá nhân hóa để kiểm tra lại chính xác khái niệm bạn từng làm sai.
                </span>
              </div>

              <div className="space-y-5">
                {remedialQuestions.map((q, idx) => {
                  const userChoice = answers[q.id]
                  const letters = ['A', 'B', 'C', 'D']
                  const isCorrect = userChoice === q.correct_answer

                  return (
                    <div
                      key={q.id}
                      className={cn(
                        'rounded-2xl border p-4 sm:p-5 transition-all',
                        submitted
                          ? isCorrect
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-destructive/40 bg-destructive/5'
                          : 'border-border bg-card'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-primary">Câu {idx + 1}</span>
                        {submitted && (
                          <span
                            className={cn(
                              'text-xs font-bold flex items-center gap-1',
                              isCorrect ? 'text-emerald-600' : 'text-destructive'
                            )}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Đúng
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5" /> Chưa chính xác
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-foreground leading-relaxed mb-3">
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const letter = letters[optIdx]
                          const isSelected = userChoice === letter
                          const isAnswerKey = q.correct_answer === letter

                          let btnStyle = 'border-border bg-background hover:bg-muted/60 text-foreground'
                          if (isSelected) {
                            btnStyle = 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                          }
                          if (submitted) {
                            if (isAnswerKey) {
                              btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'border-destructive bg-destructive/15 text-destructive line-through'
                            } else {
                              btnStyle = 'border-border/40 opacity-50'
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={submitted}
                              onClick={() => handleSelectOption(q.id, letter)}
                              className={cn(
                                'flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer disabled:cursor-default',
                                btnStyle
                              )}
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted font-bold text-2xs">
                                {letter}
                              </span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          )
                        })}
                      </div>

                      {submitted && q.explanation && (
                        <div className="mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
                          <span className="font-bold text-foreground">💡 Giải thích: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Đóng
                </Button>
                {!submitted ? (
                  <Button
                    variant="primary"
                    disabled={Object.keys(answers).length < remedialQuestions.length}
                    onClick={handleSubmitRemedial}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Nộp bài & Xem giải thích
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false)
                      setAnswers({})
                      if (activeRemedialLesson) handleStartRemedial(activeRemedialLesson)
                    }}
                    icon={<RotateCcw className="h-4 w-4" />}
                  >
                    Làm lại bộ câu hỏi khác
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
