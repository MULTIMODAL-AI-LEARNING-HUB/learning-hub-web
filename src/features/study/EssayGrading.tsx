import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'

interface GradingResult {
  score: number
  criteria: { label: string; score: number; feedback: string }[]
  suggestions: string[]
}

const mockResult: GradingResult = {
  score: 78,
  criteria: [
    { label: 'Thesis Statement', score: 85, feedback: 'Clear and well-defined thesis.' },
    { label: 'Evidence & Examples', score: 72, feedback: 'Good evidence but needs more specific examples.' },
    { label: 'Organization', score: 80, feedback: 'Logical flow with minor transitions issues.' },
    { label: 'Grammar & Style', score: 75, feedback: 'Mostly correct with a few awkward phrases.' },
    { label: 'Critical Analysis', score: 70, feedback: 'Surface-level analysis in some sections.' }
  ],
  suggestions: [
    'Add more specific examples to support your arguments.',
    'Strengthen transitions between paragraphs.',
    'Deepen your analysis by exploring counter-arguments.',
    'Consider using more academic vocabulary.'
  ]
}

export function EssayGrading() {
  const toasts = useAppStore((s) => s.toasts.add)

  const [essay, setEssay] = useState(
    'Machine learning has become one of the most transformative technologies of the 21st century. It enables computers to learn from data and improve their performance without being explicitly programmed. This essay explores the fundamental concepts of machine learning and its applications across various industries.\n\nOne of the key advantages of machine learning is its ability to process vast amounts of data and identify patterns that would be impossible for humans to detect. For example, in healthcare, ML algorithms can analyze medical images to detect diseases earlier and more accurately than traditional methods.'
  )
  const [result, setResult] = useState<GradingResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGrade = () => {
    if (!essay.trim()) {
      toasts({ type: 'warning', title: 'Please write an essay first' })
      return
    }
    setLoading(true)
    setTimeout(() => {
      setResult(mockResult)
      setLoading(false)
      toasts({ type: 'success', title: 'Grading complete', message: `Score: ${mockResult.score}/100` })
    }, 1500)
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
        {/* Editor */}
        <div>
          <label className="text-sm font-medium text-inkSoft">Your Essay</label>
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Write or paste your essay here..."
            rows={16}
            className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm leading-relaxed text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-inkMute/60"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-inkMute">{essay.split(/\s+/).filter(Boolean).length} words</p>
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="ghost" size="sm">
                Clear
              </Button>
              <Button onClick={handleGrade} loading={loading} size="sm">
                Grade Essay
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {result ? (
            <div className="rounded-2xl border border-border bg-panel p-6 shadow-soft">
              {/* Score */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accentSoft">
                  <span className="font-display text-2xl font-bold text-accent">{result.score}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Overall Score</p>
                  <p className="text-xs text-inkMute">out of 100</p>
                </div>
              </div>

              {/* Criteria */}
              <div className="mt-5 grid gap-3">
                {result.criteria.map((c) => (
                  <div key={c.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{c.label}</span>
                      <span className="text-inkMute">{c.score}/100</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surfaceDeep">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${c.score}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-inkMute">{c.feedback}</p>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              <div className="mt-5 rounded-xl bg-surface px-4 py-3">
                <p className="text-sm font-semibold text-ink">💡 Suggestions</p>
                <ul className="mt-2 space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-inkMute">
                      <span className="mt-1 text-accent">→</span>
                      <p>{s}</p>
                    </li>
                  ))}
                </ul>
              </div>
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
