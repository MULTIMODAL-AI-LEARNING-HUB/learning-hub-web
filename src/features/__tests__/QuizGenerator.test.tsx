import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QuizGenerator } from '../study/QuizGenerator'

vi.mock('../../services/api', () => ({
  studyApi: {
    generateQuiz: vi.fn().mockResolvedValue({ data: { job_id: 'job-1' } }),
    getQuizJob: vi.fn().mockResolvedValue({ data: { status: 'pending' } }),
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

vi.mock('../../stores/appStore', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      documents: {
        items: [
          { id: 'd1', name: 'AI_Basics.pdf', type: 'pdf', status: 'ready', size: '1MB' },
        ],
        selectedId: null,
        select: vi.fn(),
        add: vi.fn(),
        remove: vi.fn(),
        retry: vi.fn(),
        updateProgress: vi.fn(),
        loadDocuments: vi.fn(),
        uploadDocument: vi.fn(),
      },
      toasts: {
        add: vi.fn(),
        remove: vi.fn(),
        items: []
      }
    }
    return selector(state)
  }
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('QuizGenerator', () => {
  it('renders quiz generator page', () => {
    render(<QuizGenerator />, { wrapper })
    expect(screen.getByText(/Quiz Generator/)).toBeInTheDocument()
    expect(screen.getByText('Generate Quiz')).toBeInTheDocument()
  })

  it('renders configuration options', () => {
    render(<QuizGenerator />, { wrapper })
    expect(screen.getByText('Select document')).toBeInTheDocument()
    expect(screen.getByText('Number of questions')).toBeInTheDocument()
  })

  it('shows document options', () => {
    render(<QuizGenerator />, { wrapper })
    expect(screen.getByText('AI_Basics.pdf')).toBeInTheDocument()
  })
})
