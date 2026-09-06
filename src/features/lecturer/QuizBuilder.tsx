import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, X, Check, GripVertical, HelpCircle, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Card } from '../../components/ui/Card'
import { useQuiz } from '../../hooks/useQuiz'

interface QuizBuilderProps {
  lessonId: string
  isOpen: boolean
  onClose: () => void
}

const QUESTION_TYPES = [
  { value: 'SINGLE_CHOICE', label: 'Một đáp án đúng (Single Choice)' },
  { value: 'MULTIPLE_CHOICE', label: 'Nhiều đáp án đúng (Multiple Choice)' },
  { value: 'TRUE_FALSE', label: 'Đúng / Sai (True/False)' },
  { value: 'FILL_BLANK', label: 'Điền vào chỗ trống' },
]

export function QuizBuilder({ lessonId, isOpen, onClose }: QuizBuilderProps) {
  const {
    quiz,
    questions,
    loading,
    fetchQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    addQuestion,
    deleteQuestion,
    generateQuizAI,
  } = useQuiz(lessonId)

  const [showAiModal, setShowAiModal] = useState(false)
  const [aiQuestionCount, setAiQuestionCount] = useState(5)

  const [showQuizForm, setShowQuizForm] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [durationMins, setDurationMins] = useState<number | undefined>()
  const [maxAttempts, setMaxAttempts] = useState(3)
  const [isActive, setIsActive] = useState(true)

  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK'>('SINGLE_CHOICE')
  const [newQuestionPoints, setNewQuestionPoints] = useState(1)
  const [newQuestionExplanation, setNewQuestionExplanation] = useState('')
  const [newAnswers, setNewAnswers] = useState<{ answer_text: string; is_correct: boolean }[]>([
    { answer_text: '', is_correct: true },
    { answer_text: '', is_correct: false },
  ])

  const initializedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      fetchQuiz()
      initializedRef.current = false
    }
  }, [isOpen, fetchQuiz])

  useEffect(() => {
    if (quiz && !initializedRef.current) {
      setQuizTitle(quiz.title)
      setQuizDescription(quiz.description || '')
      setPassingScore(quiz.passing_score)
      setDurationMins(quiz.duration_mins || undefined)
      setMaxAttempts(quiz.max_attempts)
      setIsActive(quiz.is_active)
      initializedRef.current = true
    }
  }, [quiz])

  const handleCreateQuiz = async () => {
    await createQuiz({
      title: quizTitle,
      description: quizDescription || undefined,
      passing_score: passingScore,
      duration_mins: durationMins,
      max_attempts: maxAttempts,
    })
    setShowQuizForm(false)
  }

  const handleUpdateQuiz = async () => {
    await updateQuiz({
      title: quizTitle,
      description: quizDescription || undefined,
      passing_score: passingScore,
      duration_mins: durationMins,
      max_attempts: maxAttempts,
      is_active: isActive,
    })
  }

  const handleAddQuestion = async () => {
    await addQuestion({
      question_text: newQuestionText,
      type: newQuestionType,
      points: newQuestionPoints,
      explanation: newQuestionExplanation || undefined,
      answers: newAnswers,
    })
    setNewQuestionText('')
    setNewQuestionType('SINGLE_CHOICE')
    setNewQuestionPoints(1)
    setNewQuestionExplanation('')
    setNewAnswers([
      { answer_text: '', is_correct: true },
      { answer_text: '', is_correct: false },
    ])
    setShowQuestionForm(false)
  }

  const handleDeleteQuiz = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa bài trắc nghiệm này? Toàn bộ câu hỏi cũng sẽ bị xóa.')) {
      await deleteQuiz()
      onClose()
    }
  }

  const addAnswerOption = () => {
    setNewAnswers([...newAnswers, { answer_text: '', is_correct: false }])
  }

  const removeAnswerOption = (index: number) => {
    setNewAnswers(newAnswers.filter((_, i) => i !== index))
  }

  const toggleCorrect = (index: number) => {
    setNewAnswers(newAnswers.map((a, i) => ({
      ...a,
      is_correct: newQuestionType === 'MULTIPLE_CHOICE' ? a.is_correct : i === index,
    })))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-lift w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in-from-bottom">
        <div className="flex items-center justify-between px-4 py-3 sm:p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Xây Dựng Bài Trắc Nghiệm (Quiz)</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!quiz && !showQuizForm && (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Chưa có bài trắc nghiệm nào</h3>
              <p className="text-muted-foreground mb-4">Tạo câu hỏi thủ công hoặc dùng AI tự động tạo trắc nghiệm từ tài liệu bài học</p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => setShowQuizForm(true)} icon={<Plus className="h-4 w-4" />}>
                  Tạo bài trắc nghiệm
                </Button>
                <Button onClick={() => setShowAiModal(true)} variant="outline" icon={<Sparkles className="h-4 w-4 text-primary" />}>
                  Tạo tự động bằng AI
                </Button>
              </div>
            </div>
          )}

          {showQuizForm && (
            <Card className="p-4 space-y-4">
              <h3 className="font-medium">Tạo Bài Trắc Nghiệm</h3>
              <div>
                <label className="text-sm font-medium">Tiêu đề bài trắc nghiệm</label>
                <Input value={quizTitle} onChange={setQuizTitle} className="mt-1" placeholder="Nhập tiêu đề trắc nghiệm..." />
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả ngắn</label>
                <Textarea value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} className="mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Điểm đạt (%)</label>
                  <Input type="number" value={passingScore} onChange={(v) => setPassingScore(parseInt(v))} className="mt-1" min={0} max={100} />
                </div>
                <div>
                  <label className="text-sm font-medium">Thời gian (phút)</label>
                  <Input type="number" value={durationMins || ''} onChange={(v) => setDurationMins(parseInt(v) || undefined)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Số lần thử tối đa</label>
                  <Input type="number" value={maxAttempts} onChange={(v) => setMaxAttempts(parseInt(v))} className="mt-1" min={1} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowQuizForm(false)}>Hủy</Button>
                <Button onClick={handleCreateQuiz} disabled={!quizTitle}>Tạo bài trắc nghiệm</Button>
              </div>
            </Card>
          )}

          {quiz && (
            <>
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      value={quizTitle}
                      onChange={setQuizTitle}
                      className="text-lg font-semibold max-w-md"
                      onBlur={handleUpdateQuiz}
                    />
                    <Badge variant={quiz.is_active ? 'success' : 'default'} label={quiz.is_active ? 'Đang bật' : 'Đã tắt'} />
                  </div>
                  <Button variant="danger" size="sm" onClick={handleDeleteQuiz}>Xóa trắc nghiệm</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Điểm đạt: </span>
                    <span className="font-medium">{quiz.passing_score}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Thời gian: </span>
                    <span className="font-medium">{quiz.duration_mins ? `${quiz.duration_mins} phút` : 'Không giới hạn'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Số lần thử: </span>
                    <span className="font-medium">{quiz.max_attempts}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Số câu hỏi: </span>
                    <span className="font-medium">{questions.length}</span>
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between">
                <h3 className="font-medium">Danh sách câu hỏi ({questions.length})</h3>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAiModal(true)} size="sm" variant="outline" icon={<Sparkles className="h-4 w-4 text-primary" />}>
                    Tạo tự động bằng AI
                  </Button>
                  <Button onClick={() => setShowQuestionForm(true)} size="sm" icon={<Plus className="h-4 w-4" />}>
                    Thêm câu hỏi
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <Card key={q.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Câu {idx + 1}</span>
                          <Badge variant="outline" label={q.type.replace('_', ' ')} />
                          <span className="text-xs text-muted-foreground">{q.points} điểm</span>
                        </div>
                        <p className="text-foreground">{q.question_text}</p>
                        {q.answers && q.answers.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {q.answers.map((a) => (
                              <div key={a.id} className="flex items-center gap-2 text-sm">
                                <div className={`h-4 w-4 rounded border ${a.is_correct ? 'bg-success border-success' : 'border-border'}`}>
                                  {a.is_correct && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span>{a.answer_text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => deleteQuestion(q.id)}
                      />
                    </div>
                  </Card>
                ))}
                {questions.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    Chưa có câu hỏi nào. Bấm "Thêm câu hỏi" để bắt đầu soạn.
                  </div>
                )}
              </div>
            </>
          )}

          {showQuestionForm && (
            <Modal open={showQuestionForm} onClose={() => setShowQuestionForm(false)} title="Thêm Câu Hỏi Mới">
              {/* Question form content */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nội dung câu hỏi</label>
                  <Textarea value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} className="mt-1" rows={3} placeholder="Nhập câu hỏi..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Loại câu hỏi</label>
                    <Select
                      value={newQuestionType}
                      onChange={(v) => setNewQuestionType(v as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK')}
                      options={QUESTION_TYPES}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Điểm số</label>
                    <Input type="number" value={newQuestionPoints} onChange={(v) => setNewQuestionPoints(parseInt(v))} className="mt-1" min={1} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Giải thích đáp án (không bắt buộc)</label>
                  <Input value={newQuestionExplanation} onChange={setNewQuestionExplanation} className="mt-1" placeholder="Giải thích lý do đáp án đúng..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Các lựa chọn đáp án</label>
                  <div className="space-y-2 mt-1">
                    {newAnswers.map((ans, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCorrect(idx)}
                          className={`h-5 w-5 rounded border flex items-center justify-center ${ans.is_correct ? 'bg-success border-success' : 'border-border'}`}
                        >
                          {ans.is_correct && <Check className="h-3 w-3 text-white" />}
                        </button>
                        <Input
                          value={ans.answer_text}
                          onChange={(v) => {
                            const updated = [...newAnswers]
                            updated[idx].answer_text = v
                            setNewAnswers(updated)
                          }}
                          placeholder={`Lựa chọn ${idx + 1}`}
                          className="flex-1"
                        />
                        {newAnswers.length > 2 && (
                          <Button variant="ghost" size="sm" icon={<X className="h-4 w-4" />} onClick={() => removeAnswerOption(idx)} />
                        )}
                      </div>
                    ))}
                    {newQuestionType !== 'TRUE_FALSE' && newQuestionType !== 'FILL_BLANK' && (
                      <Button variant="ghost" size="sm" onClick={addAnswerOption} icon={<Plus className="h-4 w-4" />}>
                        Thêm lựa chọn
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Bấm vào ô vuông để đánh dấu đáp án đúng</p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="ghost" onClick={() => setShowQuestionForm(false)}>Hủy</Button>
                  <Button onClick={handleAddQuestion} disabled={!newQuestionText || newAnswers.length < 2}>Thêm câu hỏi</Button>
                </div>
              </div>
            </Modal>
          )}

          {showAiModal && (
            <Modal open={showAiModal} onClose={() => setShowAiModal(false)} title="Tạo Bài Trắc Nghiệm Bằng AI">
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex gap-3 items-start">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-primary">Trí Tuệ Nhân Tạo AI Soạn Trắc Nghiệm</p>
                    <p className="text-muted-foreground mt-0.5">
                      Hệ thống AI sẽ tự động phân tích nội dung bài học cùng các tài liệu đính kèm (PDF, Word...) để biên soạn bộ câu hỏi trắc nghiệm chất lượng cao.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Số lượng câu hỏi</label>
                  <Select
                    value={String(aiQuestionCount)}
                    onChange={(val) => setAiQuestionCount(Number(val))}
                    options={[
                      { value: '3', label: '3 Câu hỏi' },
                      { value: '5', label: '5 Câu hỏi' },
                      { value: '10', label: '10 Câu hỏi' },
                      { value: '15', label: '15 Câu hỏi' },
                    ]}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button variant="ghost" onClick={() => setShowAiModal(false)}>Hủy</Button>
                  <Button
                    onClick={async () => {
                      setShowAiModal(false)
                      await generateQuizAI(aiQuestionCount)
                    }}
                  >
                    Bắt đầu tạo câu hỏi
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {loading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="font-medium text-foreground">AI đang biên soạn câu hỏi trắc nghiệm...</p>
              <p className="text-sm text-muted-foreground mt-1">Đang đọc và phân tích nội dung học liệu của bài giảng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}