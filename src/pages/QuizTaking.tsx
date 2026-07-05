import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, XCircle, Trophy, ArrowLeft, ArrowRight } from 'lucide-react'
import { coursesApi, enrollmentsApi, type Course, type Enrollment } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAppStore } from '../stores/appStore'
import { cn } from '../utils/cn'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Progress } from '../components/ui/Progress'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: string
}

interface QuizResult {
  question_id: string
  correct: boolean
  correct_answer: string
  your_answer: string
}

export function QuizTaking() {
  const { id } = useParams<{ id: string }>()
  const { auth } = useAppStore()

  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<QuizResult[] | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0, percentage: 0 })
  const [jobId, setJobId] = useState<string | null>(null)

  const mountedRef = useRef(false)

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [courseRes, enrollRes] = await Promise.all([
        coursesApi.get(id).catch(() => ({ data: null })),
        enrollmentsApi.list({ status: 'active' }).catch(() => ({ data: { items: [] } }))
      ])
      if (courseRes.data) {
        setCourse(courseRes.data)
        const userEnrollment = enrollRes.data.items.find((e: Enrollment) => e.course_id === id)
        setEnrollment(userEnrollment || null)
      }
    } catch (err) {
      console.error('Failed to load course:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      loadData()
    }
  }, [loadData])

  const handleGenerateQuiz = async (fromMaterialId?: string) => {
    if (!id) return
    setGenerating(true)
    try {
      const payload: { course_id: string; question_count: number; lesson_ids?: string[] } = {
        course_id: id,
        question_count: 5,
      }
      if (fromMaterialId) {
        payload.lesson_ids = [fromMaterialId]
      }

      const res = await fetch('http://localhost:8000/api/v1/study/quiz/by-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to start quiz generation')

      const data = await res.json()
      setJobId(data.job_id)
      pollForQuizResult(data.job_id)
    } catch (err) {
      console.error('Failed to generate quiz:', err)
      setGenerating(false)
    }
  }

  const pollForQuizResult = async (jobId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/study/quiz/job/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
          },
        })
        const data = await res.json()
        if (data.status === 'ready' && data.questions) {
          setQuestions(data.questions)
          setGenerating(false)
          return
        }
        if (data.status === 'failed') {
          setGenerating(false)
          return
        }
        setTimeout(poll, 2000)
      } catch {
        setTimeout(poll, 2000)
      }
    }
    poll()
  }

  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    if (!questions.length || !jobId) return

    const answerList = Object.entries(answers).map(([question_id, answer]) => ({
      question_id,
      answer
    }))

    try {
      const res = await fetch(`http://localhost:8000/api/v1/study/quiz/${jobId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ answers: answerList }),
      })

      if (res.ok) {
        const data = await res.json()
        setResults(data.results)
        setScore({
          correct: data.score,
          total: data.total,
          percentage: data.percentage
        })
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err)
    }
  }

  const handleRetake = () => {
    setQuestions([])
    setCurrentQ(0)
    setAnswers({})
    setSubmitted(false)
    setResults(null)
    setJobId(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!course || !enrollment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Bạn chưa đăng ký khóa học này</h2>
        <Link to={`/app/courses/${id}`}>
          <Button> Quay lại khóa học</Button>
        </Link>
      </div>
    )
  }

  if (questions.length === 0 && !generating) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Quiz từ khóa học</h1>
          <p className="text-gray-600">Tạo quiz từ nội dung bài học để kiểm tra kiến thức</p>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">{course.title}</h3>
          <p className="text-gray-600 mb-6">{course.description}</p>

          <div className="space-y-3 mb-6">
            <h4 className="font-medium">Chọn nguồn quiz:</h4>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleGenerateQuiz()}
            >
              📚 Từ tất cả bài học ({course.materials?.length || 0} bài)
            </Button>
            {course.materials?.slice(0, 5).map(m => (
              <Button
                key={m.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleGenerateQuiz(m.id)}
              >
                📄 {m.title}
              </Button>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={() => handleGenerateQuiz()}
            icon={<BookOpen className="h-4 w-4" />}
          >
            Tạo quiz ngẫu nhiên
          </Button>
        </Card>
      </div>
    )
  }

  if (generating) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Đang tạo quiz...</h2>
        <p className="text-gray-600">AI đang tạo câu hỏi từ nội dung khóa học</p>
      </div>
    )
  }

  const q = questions[currentQ]
  const answerLetters = ['A', 'B', 'C', 'D']

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={`/app/courses/${id}/learn`} className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mb-1">
            ← Quay lại học tập
          </Link>
          <h1 className="text-xl font-bold">Quiz: {course.title}</h1>
        </div>
        <Badge variant="primary" label={`${currentQ + 1} / ${questions.length}`} />
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Tiến độ</span>
            <span className="font-medium">{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
          </div>
          <Progress value={((currentQ + 1) / questions.length) * 100} />
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">{q.question}</h3>
          <div className="space-y-3">
            {q.options.map((option, i) => {
              const letter = answerLetters[i]
              const isSelected = answers[q.id] === letter
              const isCorrect = submitted && letter === q.correct_answer
              const isWrong = submitted && isSelected && letter !== q.correct_answer

              return (
                <button
                  key={i}
                  onClick={() => handleSelectAnswer(q.id, letter)}
                  disabled={submitted}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl border p-4 text-left transition',
                    isCorrect && 'border-green-500 bg-green-50 text-green-700',
                    isWrong && 'border-red-500 bg-red-50 text-red-700',
                    !submitted && isSelected && 'border-indigo-500 bg-indigo-50 text-indigo-700',
                    !submitted && !isSelected && 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                    isCorrect && 'bg-green-500 text-white',
                    isWrong && 'bg-red-500 text-white',
                    !submitted && isSelected && 'bg-indigo-500 text-white',
                    !submitted && !isSelected && 'bg-gray-100 text-gray-600'
                  )}>
                    {isCorrect ? <CheckCircle2 className="h-4 w-4" /> :
                     isWrong ? <XCircle className="h-4 w-4" /> : letter}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              )
            })}
          </div>
        </div>

        {submitted && results && (
          <div className={cn(
            'mb-6 p-4 rounded-xl flex items-center gap-4',
            score.percentage >= 80 ? 'bg-green-50 border border-green-200' :
            score.percentage >= 50 ? 'bg-yellow-50 border border-yellow-200' :
            'bg-red-50 border border-red-200'
          )}>
            <Trophy className={cn(
              'h-8 w-8',
              score.percentage >= 80 ? 'text-green-600' :
              score.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
            )} />
            <div>
              <p className="font-semibold">
                {score.percentage >= 80 ? 'Xuất sắc!' :
                 score.percentage >= 50 ? 'Khá tốt!' : 'Cần cố gắng hơn'}
              </p>
              <p className="text-sm text-gray-600">
                {score.correct}/{score.total} câu đúng ({score.percentage}%)
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentQ(p => Math.max(0, p - 1))}
            disabled={currentQ === 0}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Trước
          </Button>

          {currentQ < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQ(p => p + 1)}
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              Tiếp
            </Button>
          ) : !submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Nộp bài
            </Button>
          ) : (
            <Button onClick={handleRetake} variant="outline">
              Làm lại
            </Button>
          )}
        </div>
      </Card>

      {submitted && (
        <Card className="p-6 mt-4">
          <h3 className="font-semibold mb-4">Chi tiết đáp án</h3>
          <div className="space-y-4">
            {results?.map((result) => {
              const question = questions.find(q => q.id === result.question_id)
              return (
                <div key={result.question_id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start gap-2">
                    {result.correct ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{question?.question}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Đáp án đúng: <span className="text-green-600 font-medium">{result.correct_answer}</span>
                      </p>
                      {!result.correct && (
                        <p className="text-sm text-gray-600">
                          Bạn chọn: <span className="text-red-600 font-medium">{result.your_answer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}