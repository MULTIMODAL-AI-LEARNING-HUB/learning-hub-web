import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { studyApi } from '../../services/api'

interface GradingResult {
  score: number
  feedback: string
  comparisons: Array<{ student_point: string; source_match: string; similarity: number; assessment: string }>
}

export function EssayGrading() {
  const docs = useAppStore((s) => s.documents.items)
  const toasts = useAppStore((s) => s.toasts.add)

  const [selectedDoc, setSelectedDoc] = useState('')
  const [essay, setEssay] = useState('')
  const [result, setResult] = useState<GradingResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGrade = async () => {
    if (!essay.trim()) {
      toasts({ type: 'warning', title: 'Please write an essay first' })
      return
    }
    if (!selectedDoc) {
      toasts({ type: 'warning', title: 'Please select a reference document' })
      return
    }
    setLoading(true)
    try {
      const res = await studyApi.submitEssay({
        document_id: selectedDoc,
        essay_text: essay,
      })
      setResult(res.data as GradingResult)
      toasts({ type: 'success', title: 'Grading complete', message: `Score: ${(res.data as GradingResult).score}/10` })
    } catch {
      toasts({ type: 'error', title: 'Grading failed' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setEssay('')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="font-display text-2xl font-semibold text-ink">✍️ Essay Grading</h2>
      <p className="mt-1 text-sm text-inkMute">Get AI-powered feedback on your essays</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <label className="text-sm font-medium text-inkSoft">Reference Document</label>
          <select
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">Select a document</option>
            {docs.filter((d) => d.status === 'ready').map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <label className="mt-4 text-sm font-medium text-inkSoft">Your Essay</label>
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Write or paste your essay here..."
            rows={14}
            className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm leading-relaxed text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-inkMute/60"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-inkMute">{essay.split(/\s+/).filter(Boolean).length} words</p>
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="ghost" size="sm">Clear</Button>
              <Button onClick={handleGrade} loading={loading} size="sm">Grade Essay</Button>
            </div>
          </div>
        </div>

        <div>
          {result ? (
            <div className="rounded-2xl border border-border bg-panel p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accentSoft">
                  <span className="font-display text-2xl font-bold text-accent">{result.score}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Overall Score</p>
                  <p className="text-xs text-inkMute">out of 10</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-surface px-4 py-3">
                <p className="text-sm font-semibold text-ink">Feedback</p>
                <p className="mt-1 text-sm text-inkMute">{result.feedback}</p>
              </div>

              {result.comparisons && result.comparisons.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-ink">Comparison with Source</p>
                  <div className="mt-2 grid gap-2">
                    {result.comparisons.map((c, i) => (
                      <div key={i} className="rounded-xl bg-surface px-3 py-2">
                        <p className="text-sm font-medium text-ink">{c.student_point}</p>
                        <p className="text-xs text-inkMute">→ {c.source_match}</p>
                        <p className="text-xs text-accent">{c.assessment} ({Math.round(c.similarity * 100)}% match)</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-16">
              <div className="text-center">
                <span className="text-4xl">📋</span>
                <p className="mt-3 text-sm text-inkMute">Write an essay and click "Grade Essay"</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
