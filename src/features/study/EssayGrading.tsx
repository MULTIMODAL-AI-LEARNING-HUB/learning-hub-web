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
      toast({ type: 'warning', title: 'Please write an essay first' })
      return
    }
    if (!selectedDoc) {
      toast({ type: 'warning', title: 'Please select a reference document' })
      return
    }
    setLoading(true)
    try {
      const res = await studyApi.submitEssay({
        document_id: selectedDoc,
        essay_text: essay,
      })
      setResult(res.data as GradingResult)
      toast({ type: 'success', title: 'Grading complete', message: `Score: ${(res.data as GradingResult).score}/10` })
    } catch {
      toast({ type: 'error', title: 'Grading failed' })
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
        subtitle="Study Tools"
        title="Essay Grading"
        description="Get AI-powered feedback on your essays, with comparison to source material."
        icon={<PenLine />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          {readyDocs.length === 0 ? (
            <EmptyState
              icon={<FileQuestion />}
              title="No documents ready"
              description="Upload a document first to grade essays against it."
            />
          ) : (
            <div className="space-y-4">
              <FormField label="Reference Document" required>
                <Select
                  value={selectedDoc}
                  onChange={setSelectedDoc}
                  placeholder="Select a document"
                  options={readyDocs.map((d) => ({ value: d.id, label: d.name }))}
                />
              </FormField>

              <FormField label="Your Essay" required>
                <Textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  placeholder="Write or paste your essay here..."
                  rows={14}
                />
              </FormField>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="ghost" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />}>
                    Clear
                  </Button>
                  <Button
                    onClick={handleGrade}
                    loading={loading}
                    size="sm"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                  >
                    Grade Essay
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
                <p className="mt-4 text-sm font-semibold text-foreground">Analyzing your essay</p>
                <p className="mt-1 text-xs text-muted-foreground">Comparing with source material...</p>
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
                  <p className="text-sm font-semibold text-foreground">Overall Score</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.score >= 8 ? 'Excellent work!' : result.score >= 6 ? 'Good, with room to improve' : 'Needs more depth'}
                  </p>
                </div>
                <Award className="ml-auto h-5 w-5 text-accent" />
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Feedback
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm text-foreground/90 leading-relaxed">{result.feedback}</p>
                </div>
              </div>

              {result.comparisons && result.comparisons.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Comparison with Source
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
                            <span className="text-2xs text-muted-foreground tabular-nums">{simPct}% match</span>
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
              title="Ready when you are"
              description="Write your essay on the left, then click Grade Essay to get AI feedback and source comparison."
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  )
}
