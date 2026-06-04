import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { studyApi } from '../../services/api'

interface QuizQ {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

export function QuizGenerator() {
  const docs = useAppStore((s) => s.documents.items)
  const toasts = useAppStore((s) => s.toasts.add)

  const [selectedDoc, setSelectedDoc] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [quizStarted, setQuizStarted] = useState(false)
  const [questions, setQuestions] = useState<QuizQ[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const [jobId, setJobId] = useState('')

  const handleGenerate = async () => {
    if (!selectedDoc) {
      toasts({ type: 'warning', title: 'Please select a document first' })
      return
    }
    setLoading(true)
    try {
      const startRes = await studyApi.generateQuiz({
        document_id: selectedDoc,
        question_count: numQuestions,
      })
      const { job_id } = startRes.data as { job_id: string }
      setJobId(job_id)

      let attempts = 0
      const maxAttempts = 60 // 2 minutes (60 * 2s)

      const pollInterval = setInterval(async () => {
        attempts++
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setLoading(false)
          toasts({ type: 'error', title: 'Generation timed out', message: 'Quiz generation timed out.' })
          return
        }

        try {
          const checkRes = await studyApi.getQuizJob(job_id)
          const data = checkRes.data as { status: string; questions?: any[] }

          if (data.status === 'ready') {
            clearInterval(pollInterval)
            const qs = data.questions || []
            const mapped: QuizQ[] = qs.map((q: any) => ({
              id: q.id,
              question: q.question,
              options: q.options,
              correctIndex: 'ABCD'.indexOf(q.correct_answer),
            }))
            setQuestions(mapped)
            setQuizStarted(true)
            setCurrentQ(0)
            setAnswers({})
            setSubmitted(false)
            setLoading(false)
            toasts({ type: 'success', title: 'Quiz generated', message: `${mapped.length} questions ready` })
          } else if (data.status === 'failed') {
            clearInterval(pollInterval)
            setLoading(false)
            toasts({ type: 'error', title: 'Failed to generate quiz', message: 'The AI model failed to parse the document.' })
          }
        } catch {
          // Ignore network glitch and try again
        }
      }, 2000)
    } catch {
      toasts({ type: 'error', title: 'Failed to start quiz generation' })
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length
    toasts({ type: 'info', title: `Score: ${correct}/${questions.length}`, message: `${Math.round((correct / questions.length) * 100)}%` })
  }

  const handleReset = () => {
    setQuizStarted(false)
    setCurrentQ(0)
    setAnswers({})
    setSubmitted(false)
  }

  const q = questions[currentQ]
  const correctCount = submitted ? questions.filter((q) => answers[q.id] === q.correctIndex).length : 0

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-2xl font-semibold text-ink">📝 Quiz Generator</h2>
      <p className="mt-1 text-sm text-inkMute">Test your knowledge with AI-generated questions</p>

      {!quizStarted ? (
        <div className="mt-6 rounded-2xl border border-border bg-panel p-6 shadow-soft">
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-inkSoft">Select document</label>
              <select
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="">All documents</option>
                {docs
                  .filter((d) => d.status === 'ready')
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-inkSoft">Number of questions</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
              >
                {[3, 5, 10, 15].map((n) => (
                  <option key={n} value={n}>
                    {n} questions
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleGenerate} loading={loading} className="mt-6 w-full" size="lg">
            Generate Quiz
          </Button>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-panel p-6 shadow-soft">
          <div className="flex items-center justify-between text-sm text-inkMute">
            <span>Question {currentQ + 1} of {questions.length}</span>
            <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surfaceDeep">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="mt-6">
            <p className="text-base font-medium text-ink">{q.question}</p>
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
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      isCorrect
                        ? 'border-success bg-success/10 text-success'
                        : isWrong
                        ? 'border-danger bg-danger/10 text-danger'
                        : selected
                        ? 'border-accent bg-accentSoft text-accent'
                        : 'border-border bg-white hover:border-accent/40 text-ink'
                    }`}
                  >
                    <span className="mr-2 font-medium">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0}>
              Previous
            </Button>
            {submitted && (
              <div className="text-center">
                <p className="text-lg font-semibold text-ink">{correctCount}/{questions.length}</p>
                <p className="text-xs text-inkMute">{Math.round((correctCount / questions.length) * 100)}% correct</p>
              </div>
            )}
            {currentQ < questions.length - 1 ? (
              <Button onClick={() => setCurrentQ((p) => p + 1)}>Next</Button>
            ) : !submitted ? (
              <Button onClick={handleSubmit} variant="primary">Submit Quiz</Button>
            ) : (
              <Button onClick={handleReset} variant="outline">Try Again</Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
