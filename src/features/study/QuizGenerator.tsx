import { useState } from 'react'
import { BookOpen, Sparkles, ChevronLeft, ChevronRight, CheckCircle2, XCircle, RotateCcw, Trophy, FileQuestion } from 'lucide-react'
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

  const { loading, progress, start, setProgress } = useJobPolling<QuizQ[]>({
    poll: async () => {
      if (!jobId) return { status: 'pending' }
      try {
        const res = await studyApi.getQuizJob(jobId)
        const data = res.data as { status: string; questions?: Array<{ id: string; question: string; options: string[]; correct_answer: string }> }
        if (data.status === 'ready' && data.questions) {
          const mapped: QuizQ[] = data.questions.map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctIndex: 'ABCD'.indexOf(q.correct_answer)
          }))
          return { status: 'ready', data: mapped }
        }
        if (data.status === 'failed') {
          return { status: 'failed', error: 'The AI model failed to parse the document.' }
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
      toast({ type: 'success', title: 'Quiz generated', message: `${qs.length} questions ready` })
    },
    onError: () => {
      toast({ type: 'error', title: 'Failed to generate quiz' })
    },
    errorTitle: 'Failed to generate quiz',
    timeoutTitle: 'Quiz generation timed out'
  })

  const handleGenerate = async () => {
    if (!selectedDoc) {
      toast({ type: 'warning', title: 'Please select a document first' })
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
      toast({ type: 'error', title: 'Failed to start quiz generation' })
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length
    toast({
      type: 'info',
      title: `Score: ${correct}/${questions.length}`,
      message: `${Math.round((correct / questions.length) * 100)}%`
    })
  }

  const handleReset = () => {
    setQuizStarted(false)
    setCurrentQ(0)
    setAnswers({})
    setSubmitted(false)
    setJobId(null)
  }

  if (!quizStarted && !loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          subtitle="Study Tools"
          title="Quiz Generator"
          description="Test your knowledge with AI-generated questions based on your documents."
          icon={<BookOpen />}
        />

        {readyDocs.length === 0 ? (
          <EmptyState
            icon={<FileQuestion />}
            title="No documents ready"
            description="Upload and process a document first to generate a quiz from it."
          />
        ) : (
          <Card className="p-6">
            <div className="grid gap-4">
              <FormField label="Select document" required>
                <Select
                  value={selectedDoc}
                  onChange={setSelectedDoc}
                  placeholder="Choose a document..."
                  options={readyDocs.map((d) => ({ value: d.id, label: d.name }))}
                />
              </FormField>

              <FormField label="Number of questions" required>
                <Select
                  value={String(numQuestions)}
                  onChange={(v) => setNumQuestions(Number(v))}
                  options={[
                    { value: '3', label: '3 questions' },
                    { value: '5', label: '5 questions' },
                    { value: '10', label: '10 questions' },
                    { value: '15', label: '15 questions' }
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
              Generate Quiz
            </Button>
          </Card>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <StudyLoadingState
        title="Generating Quiz"
        description="Our AI is crafting personalized questions from your document."
        progress={progress}
        statusText="Generating questions"
        durationText="This usually takes 20-60 seconds"
      />
    )
  }

  const q = questions[currentQ]
  const correctCount = questions.filter((qu) => answers[qu.id] === qu.correctIndex).length
  const percent = Math.round((correctCount / questions.length) * 100)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        subtitle="Study Tools"
        title="Quiz in progress"
        icon={<BookOpen />}
        actions={
          <Badge variant="primary" label={`${currentQ + 1} / ${questions.length}`} />
        }
      />

      <Card className="p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">Progress</span>
          <span className="font-semibold text-foreground tabular-nums">
            {Math.round(((currentQ + 1) / questions.length) * 100)}%
          </span>
        </div>
        <Progress value={((currentQ + 1) / questions.length) * 100} className="mt-2" />

        <div className="mt-6">
          <h3 className="font-display text-lg font-semibold text-foreground leading-relaxed">
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
                  <span className="flex-1">{opt}</span>
                </button>
              )
            })}
          </div>
        </div>

        {submitted && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-zoom-in-95">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {correctCount} / {questions.length} correct
              </p>
              <p className="text-xs text-muted-foreground">{percent}% accuracy</p>
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
            Previous
          </Button>
          {currentQ < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQ((p) => p + 1)}
              iconRight={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          ) : !submitted ? (
            <Button onClick={handleSubmit} variant="primary" icon={<CheckCircle2 className="h-4 w-4" />}>
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={handleReset} variant="outline" icon={<RotateCcw className="h-4 w-4" />}>
              Try Again
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
