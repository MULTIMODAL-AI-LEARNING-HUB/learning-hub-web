import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { mockFlashcards } from '../../data/mockData'

export function Flashcards() {
  const toasts = useAppStore((s) => s.toasts.add)

  const [cards, setCards] = useState(mockFlashcards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<string[]>([])
  const [unknown, setUnknown] = useState<string[]>([])

  const card = cards[currentIndex]
  const total = cards.length
  const progress = Math.round(((currentIndex + 1) / total) * 100)

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
    setCurrentIndex(0)
    setFlipped(false)
    setKnown([])
    setUnknown([])
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-2xl font-semibold text-ink">🃏 Flashcards</h2>
      <p className="mt-1 text-sm text-inkMute">Study with interactive flashcards</p>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-sm">
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
            className="absolute inset-0 flex items-center justify-center rounded-2xl border border-border bg-panel p-8 text-center shadow-lift"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-inkMute">Question</p>
              <p className="mt-3 text-lg font-medium text-ink">{card.front}</p>
              <p className="mt-4 text-xs text-inkMute/70">Click to reveal answer</p>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl border border-accent/30 bg-accentSoft p-8 text-center shadow-lift"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Answer</p>
              <p className="mt-3 text-base text-ink">{card.back}</p>
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

      {currentIndex === total - 1 && (
        <div className="mt-6 text-center">
          <Button onClick={handleReset} variant="outline">
            Start over
          </Button>
        </div>
      )}
    </div>
  )
}
