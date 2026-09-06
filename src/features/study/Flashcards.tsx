import { useState } from 'react'
import { Layers, Sparkles, Shuffle, Check, X, RotateCcw, Plus, FileQuestion } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select, FormField } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Progress } from '../../components/ui/Progress'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/useToast'
import { useJobPolling } from '../../hooks/useJobPolling'
import { studyApi } from '../../services/api'
import { StudyLoadingState } from './StudyLoadingState'

interface CardItem {
  id: string
  front: string
  back: string
}

export function Flashcards() {
  const docs = useAppStore((s) => s.documents.items)
  const toast = useToast()
  const readyDocs = docs.filter((d) => d.status === 'ready')

  const [selectedDoc, setSelectedDoc] = useState('')
  const [setName, setSetName] = useState('Bộ thẻ học mới')
  const [count, setCount] = useState(20)
  const [setId, setSetId] = useState<string | null>(null)

  const [cards, setCards] = useState<CardItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<string[]>([])
  const [unknown, setUnknown] = useState<string[]>([])
  const [quizStarted, setQuizStarted] = useState(false)

  const { loading, progress, start, setProgress } = useJobPolling<CardItem[]>({
    poll: async () => {
      if (!setId) return { status: 'pending' }
      try {
        const res = await studyApi.getFlashcard(setId)
        const data = res.data as { items?: Array<{ id: string; front: string; back: string }> }
        if (data.items && data.items.length > 0) {
          return { status: 'ready', data: data.items }
        }
        return { status: 'processing' }
      } catch {
        return { status: 'processing' }
      }
    },
    onReady: (items) => {
      setCards(items)
      setQuizStarted(true)
      setCurrentIndex(0)
      setFlipped(false)
      setKnown([])
      setUnknown([])
      toast({ type: 'success', title: 'Bộ thẻ học đã sẵn sàng!', message: `Đã nạp ${items.length} thẻ ghi nhớ` })
    },
    errorTitle: 'Không thể khởi tạo bộ thẻ ghi nhớ',
    timeoutTitle: 'Quá thời gian tạo bộ thẻ ghi nhớ'
  })

  const handleGenerate = async () => {
    if (!selectedDoc) {
      toast({ type: 'warning', title: 'Vui lòng chọn tài liệu trước' })
      return
    }
    try {
      const startRes = await studyApi.generateFlashcards({
        document_id: selectedDoc,
        set_name: setName,
        count: count,
      })
      const id = (startRes.data as { id: string }).id
      setSetId(id)
      setProgress(0)
      start()
    } catch {
      toast({ type: 'error', title: 'Không thể bắt đầu tạo thẻ flashcards' })
    }
  }

  const card = cards[currentIndex]
  const total = cards.length
  const progressPct = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0

  const handleKnow = () => {
    if (!card) return
    setKnown((prev) => [...prev, card.id])
    goNext()
  }

  const handleDontKnow = () => {
    if (!card) return
    setUnknown((prev) => [...prev, card.id])
    goNext()
  }

  const goNext = () => {
    if (currentIndex < total - 1) {
      setFlipped(false)
      setTimeout(() => setCurrentIndex((p) => p + 1), 150)
    } else {
      toast({
        type: 'info',
        title: 'Đã hoàn thành phiên học!',
        message: `Đã ôn tập ${known.length + 1}/${total} thẻ`
      })
    }
  }

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
    setFlipped(false)
    toast({ type: 'success', title: 'Đã xáo trộn ngẫu nhiên thẻ' })
  }

  const handleReset = () => {
    setQuizStarted(false)
    setCurrentIndex(0)
    setFlipped(false)
    setKnown([])
    setUnknown([])
    setSetId(null)
  }

  if (!quizStarted && !loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          subtitle="Công cụ học tập"
          title="Thẻ ghi nhớ Flashcards"
          description="Học lặp lại ngắt quãng thông minh với các thẻ ghi nhớ do AI tự động tạo từ tài liệu."
          icon={<Layers />}
        />

        {readyDocs.length === 0 ? (
          <EmptyState
            icon={<FileQuestion />}
            title="Chưa có tài liệu sẵn sàng"
            description="Vui lòng tải lên và xử lý tài liệu trước để tạo thẻ ghi nhớ."
          />
        ) : (
          <Card className="p-6">
            <div className="grid gap-4">
              <FormField label="Chọn tài liệu" required>
                <Select
                  value={selectedDoc}
                  onChange={setSelectedDoc}
                  placeholder="Chọn một tài liệu..."
                  options={readyDocs.map((d) => ({ value: d.id, label: d.name }))}
                />
              </FormField>

              <FormField label="Tên bộ thẻ học" required>
                <Input
                  value={setName}
                  onChange={setSetName}
                  placeholder="Nhập tên bộ thẻ học"
                />
              </FormField>

              <FormField label="Số lượng thẻ" required>
                <Select
                  value={String(count)}
                  onChange={(v) => setCount(Number(v))}
                  options={[
                    { value: '10', label: '10 thẻ ghi nhớ' },
                    { value: '15', label: '15 thẻ ghi nhớ' },
                    { value: '20', label: '20 thẻ ghi nhớ' },
                    { value: '30', label: '30 thẻ ghi nhớ' }
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
              Tạo thẻ ghi nhớ Flashcards
            </Button>
          </Card>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <StudyLoadingState
        title="Đang tạo thẻ ghi nhớ"
        description="Trợ lý AI đang trích xuất các ý chính và tạo thẻ học ngắt quãng cho bạn."
        progress={progress}
        statusText="Đang tạo thẻ"
        durationText="Thường mất khoảng 30-90 giây"
      />
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        subtitle="Công cụ học tập"
        title="Thẻ ghi nhớ Flashcards"
        description={setName}
        icon={<Layers />}
        actions={
          <Badge variant="primary" label={`${currentIndex + 1} / ${total}`} />
        }
      />

      <div className="mb-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="font-medium text-foreground tabular-nums">{known.length}</span>
          <span className="text-muted-foreground">Đã nhớ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          <span className="font-medium text-foreground tabular-nums">{unknown.length}</span>
          <span className="text-muted-foreground">Cần ôn lại</span>
        </div>
      </div>

      <Progress value={progressPct} className="mb-6" />

      <div
        className="cursor-pointer"
        onClick={() => setFlipped((p) => !p)}
        style={{ perspective: '1200px' }}
      >
        <div
          className="relative h-56 w-full transition-transform duration-500 sm:h-72"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-lift"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Badge variant="default" label="Câu hỏi / Thuật ngữ" className="mb-4" />
            <p className="text-lg font-semibold text-foreground leading-relaxed max-w-md text-balance">
              {card?.front}
            </p>
            <p className="mt-6 text-xs text-muted-foreground">Nhấn vào thẻ để lật xem đáp án</p>
          </div>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 text-center shadow-lift"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <Badge variant="primary" label="Đáp án / Định nghĩa" className="mb-4" />
            <p className="text-base text-foreground leading-relaxed max-w-md text-balance">
              {card?.back}
            </p>
            <p className="mt-6 text-xs text-muted-foreground">Nhấn vào thẻ để lật lại mặt trước</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <Button
          onClick={handleDontKnow}
          variant="danger"
          size="lg"
          icon={<X className="h-4 w-4" />}
        >
          Chưa nhớ
        </Button>
        <Button
          onClick={handleShuffle}
          variant="outline"
          size="lg"
          icon={<Shuffle className="h-4 w-4" />}
        >
          Xáo trộn
        </Button>
        <Button
          onClick={handleKnow}
          variant="primary"
          size="lg"
          icon={<Check className="h-4 w-4" />}
        >
          Đã nhớ
        </Button>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={handleReset} variant="ghost" icon={<Plus className="h-3.5 w-3.5" />}>
          Đổi tài liệu khác
        </Button>
        {currentIndex === total - 1 && (
          <Button onClick={handleReset} variant="outline" icon={<RotateCcw className="h-3.5 w-3.5" />}>
            Học lại từ đầu
          </Button>
        )}
      </div>
    </div>
  )
}
