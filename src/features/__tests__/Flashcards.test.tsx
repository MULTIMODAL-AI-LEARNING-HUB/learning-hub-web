import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Flashcards } from '../study/Flashcards'
import { useAppStore } from '../../stores/appStore'

vi.mock('../../services/api', () => ({
  studyApi: {
    generateFlashcards: vi.fn(),
    getFlashcard: vi.fn(),
  },
}))

vi.mock('../../components/ui/Toast', () => ({
  useToast: () => vi.fn(),
}))

vi.mock('../../hooks/useJobPolling', () => ({
  useJobPolling: () => ({
    loading: false,
    progress: 0,
    start: vi.fn(),
    stop: vi.fn(),
    setProgress: vi.fn(),
    status: 'pending',
    data: null
  })
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('Flashcards', () => {
  beforeEach(() => {
    useAppStore.setState({
      documents: {
        items: [
          { id: 'd1', name: 'AI_Basics.pdf', type: 'pdf', status: 'ready', size: '2.5MB', pageCount: 42 },
        ],
        selectedId: null,
        select: useAppStore.getState().documents.select,
        add: useAppStore.getState().documents.add,
        remove: useAppStore.getState().documents.remove,
        retry: useAppStore.getState().documents.retry,
        updateProgress: useAppStore.getState().documents.updateProgress,
        loadDocuments: useAppStore.getState().documents.loadDocuments,
        uploadDocument: useAppStore.getState().documents.uploadDocument,
      }
    })
  })

  it('renders flashcards page', () => {
    render(<Flashcards />, { wrapper })
    expect(screen.getByRole('heading', { name: 'Thẻ ghi nhớ Flashcards' })).toBeInTheDocument()
    expect(screen.getByText(/Học lặp lại ngắt quãng/i)).toBeInTheDocument()
  })

  it('renders configuration form', () => {
    render(<Flashcards />, { wrapper })
    expect(screen.getByText('Chọn tài liệu')).toBeInTheDocument()
    expect(screen.getByText('Tên bộ thẻ học')).toBeInTheDocument()
    expect(screen.getByText('Số lượng thẻ')).toBeInTheDocument()
  })

  it('shows generate button', () => {
    render(<Flashcards />, { wrapper })
    expect(screen.getByText('Tạo thẻ ghi nhớ Flashcards')).toBeInTheDocument()
  })
})
