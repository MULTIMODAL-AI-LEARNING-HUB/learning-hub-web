import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { studyApi } from '../../services/api'

interface CardItem {
  id: string
  front: string
  back: string
}

export function Flashcards() {
  const docs = useAppStore((s) => s.documents.items)
  const toasts = useAppStore((s) => s.toasts.add)

  const [selectedDoc, setSelectedDoc] = useState('')
  const [setName, setSetName] = useState('New Card Set')
  const [count, setCount] = useState(20)

  const [cards, setCards] = useState<CardItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<string[]>([])
  const [unknown, setUnknown] = useState<string[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!selectedDoc) {
      toasts({ type: 'warning', title: 'Please select a document first' })
      return
    }
    setLoading(true)
    try {
      // 1. Trigger background generation
      const startRes = await studyApi.generateFlashcards({
        document_id: selectedDoc,
        set_name: setName,
        count: count,
      })
      const flashcardSetId = startRes.data.id

      // 2. Poll flashcard set until items are populated by worker
      let attempts = 0
      const maxAttempts = 60 // 2 minutes

      const pollInterval = setInterval(async () => {
        attempts++
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setLoading(false)
          toasts({ type: 'error', title: 'Generation timed out', message: 'Flashcards generation timed out.' })
          return
        }

        try {
          const checkRes = await studyApi.getFlashcard(flashcardSetId)
          const data = checkRes.data

          if (data.items && data.items.length > 0) {
            clearInterval(pollInterval)
            const mapped = data.items.map((item) => ({
              id: item.id,
              front: item.front,
              back: item.back,
            }))
            setCards(mapped)
            setQuizStarted(true)
            setCurrentIndex(0)
            setFlipped(false)
            setKnown([])
            setUnknown([])
            setLoading(false)
            toasts({ type: 'success', title: 'Flashcards ready!', message: `Loaded ${mapped.length} cards` })
          }
        } catch {
          // Ignore network glitch and retry
        }
      }, 2500)
    } catch {
      toasts({ type: 'error', title: 'Failed to start flashcards generation' })
      setLoading(false)
    }
  }

  const card = cards[currentIndex]
  const total = cards.length
  const progress = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0

  const handleKnow = () => {
    setKnown((prev) => [...prev, card.id])
    goNext()
  }

  const handleDontKnow = () => {
    setUnknown((prev) => [...prev, card.id])
    goNext()
  }

  const goNext = () => {
    if (currentIndex < total - 1) {
      setFlipped(false)
      setTimeout(() => setCurrentIndex((p) => p + 1), 150)
    } else {
      toasts({
        type: 'info',
        title: 'Session complete!',
        message: `${known.length + 1}/${total} cards reviewed`
      })
    }
  }

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
    setFlipped(false)
    toasts({ type: 'success', title: 'Cards shuffled' })
  }

  const handleReset = () => {
    setQuizStarted(false)
    setCurrentIndex(0)
    setFlipped(false)
    setKnown([])
    setUnknown([])
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-2xl font-semibold text-ink">🃏 Flashcards</h2>
      <p className="mt-1 text-sm text-inkMute">Study with interactive AI-generated flashcards</p>

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
                <option value="">Choose document...</option>
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
              <label className="text-sm font-medium text-inkSoft">Card Set Name</label>
              <input
                type="text"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
                placeholder="Set Name"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-inkSoft">Number of cards</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
              >
                {[10, 15, 20, 30].map((n) => (
                  <option key={n} value={n}>
                    {n} flashcards
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleGenerate} loading={loading} className="mt-6 w-full" size="lg">
            Generate Flashcards
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-success">✓ Known: {known.length}</span>
            <span className="text-danger">✕ Unknown: {unknown.length}</span>
            <span className="text-inkMute">Card {currentIndex + 1}/{total}</span>
          </div>

          {/* Progress */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surfaceDeep">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Card */}
          <div
            className="mt-6 cursor-pointer"
            onClick={() => setFlipped((p) => !p)}
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative h-64 w-full transition-transform duration-300"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border bg-panel p-8 text-center shadow-lift"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-inkMute">Question</p>
                  <p className="mt-3 text-lg font-medium text-ink">{card?.front}</p>
                  <p className="mt-6 text-xs text-inkMute/70">Click to reveal answer</p>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-accent/30 bg-accentSoft p-8 text-center shadow-lift"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Answer</p>
                  <p className="mt-3 text-base text-ink">{card?.back}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button onClick={handleDontKnow} variant="danger" size="lg">
              ✕ Don't know
            </Button>
            <Button onClick={handleShuffle} variant="outline" size="lg">
              🔀 Shuffle
            </Button>
            <Button onClick={handleKnow} variant="primary" size="lg">
              ✓ Know it
            </Button>
          </div>

          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={handleReset} variant="ghost">
              Change Document
            </Button>
            {currentIndex === total - 1 && (
              <Button onClick={handleReset} variant="outline">
                Start over
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
