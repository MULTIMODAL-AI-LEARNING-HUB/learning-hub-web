import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, X, Check, GripVertical, HelpCircle } from 'lucide-react'
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
  { value: 'SINGLE_CHOICE', label: 'Single Choice' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True/False' },
  { value: 'FILL_BLANK', label: 'Fill in the Blank' },
]

export function QuizBuilder({ lessonId, isOpen, onClose }: QuizBuilderProps) {
  const {
    quiz,
    questions,
    fetchQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    addQuestion,
    deleteQuestion,
  } = useQuiz(lessonId)

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
    if (confirm('Are you sure you want to delete this quiz? This will also delete all questions.')) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Quiz Builder</h2>
          <Button variant="ghost" size="sm" icon={<X className="h-5 w-5" />} onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!quiz && !showQuizForm && (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Quiz Yet</h3>
              <p className="text-muted-foreground mb-4">Create a quiz to add questions</p>
              <Button onClick={() => setShowQuizForm(true)} icon={<Plus className="h-4 w-4" />}>
                Create Quiz
              </Button>
            </div>
          )}

          {showQuizForm && (
            <Card className="p-4 space-y-4">
              <h3 className="font-medium">Create Quiz</h3>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={quizTitle} onChange={setQuizTitle} className="mt-1" placeholder="Quiz title" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} className="mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Passing Score (%)</label>
                  <Input type="number" value={passingScore} onChange={(v) => setPassingScore(parseInt(v))} className="mt-1" min={0} max={100} />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (mins)</label>
                  <Input type="number" value={durationMins || ''} onChange={(v) => setDurationMins(parseInt(v) || undefined)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Attempts</label>
                  <Input type="number" value={maxAttempts} onChange={(v) => setMaxAttempts(parseInt(v))} className="mt-1" min={1} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowQuizForm(false)}>Cancel</Button>
                <Button onClick={handleCreateQuiz} disabled={!quizTitle}>Create Quiz</Button>
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
                    <Badge variant={quiz.is_active ? 'success' : 'default'} label={quiz.is_active ? 'Active' : 'Inactive'} />
                  </div>
                  <Button variant="danger" size="sm" onClick={handleDeleteQuiz}>Delete Quiz</Button>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Passing Score: </span>
                    <span className="font-medium">{quiz.passing_score}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration: </span>
                    <span className="font-medium">{quiz.duration_mins ? `${quiz.duration_mins} mins` : 'Unlimited'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Attempts: </span>
                    <span className="font-medium">{quiz.max_attempts}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Questions: </span>
                    <span className="font-medium">{questions.length}</span>
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between">
                <h3 className="font-medium">Questions ({questions.length})</h3>
                <Button onClick={() => setShowQuestionForm(true)} size="sm" icon={<Plus className="h-4 w-4" />}>
                  Add Question
                </Button>
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <Card key={q.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Q{idx + 1}</span>
                          <Badge variant="outline" label={q.type.replace('_', ' ')} />
                          <span className="text-xs text-muted-foreground">{q.points} points</span>
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
                    No questions yet. Click "Add Question" to create one.
                  </div>
                )}
              </div>
            </>
          )}

          {showQuestionForm && (
            <Modal open={showQuestionForm} onClose={() => setShowQuestionForm(false)} title="Add Question">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Question</label>
                  <Textarea value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} className="mt-1" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={newQuestionType}
                      onChange={(v) => setNewQuestionType(v as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK')}
                      options={QUESTION_TYPES}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Points</label>
                    <Input type="number" value={newQuestionPoints} onChange={(v) => setNewQuestionPoints(parseInt(v))} className="mt-1" min={1} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Explanation (optional)</label>
                  <Input value={newQuestionExplanation} onChange={setNewQuestionExplanation} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Answer Options</label>
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
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1"
                        />
                        {newAnswers.length > 2 && (
                          <Button variant="ghost" size="sm" icon={<X className="h-4 w-4" />} onClick={() => removeAnswerOption(idx)} />
                        )}
                      </div>
                    ))}
                    {newQuestionType !== 'TRUE_FALSE' && newQuestionType !== 'FILL_BLANK' && (
                      <Button variant="ghost" size="sm" onClick={addAnswerOption} icon={<Plus className="h-4 w-4" />}>
                        Add Option
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Click the checkmark to mark correct answer(s)</p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="ghost" onClick={() => setShowQuestionForm(false)}>Cancel</Button>
                  <Button onClick={handleAddQuestion} disabled={!newQuestionText || newAnswers.length < 2}>Add Question</Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  )
}