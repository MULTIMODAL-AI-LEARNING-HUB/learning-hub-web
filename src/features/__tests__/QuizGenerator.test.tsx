import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QuizGenerator } from '../study/QuizGenerator'

vi.mock('../../services/api', () => ({
  studyApi: {
    generateQuiz: vi.fn().mockResolvedValue({
      data: {
        questions: [
          { id: 'q1', question: 'What is ML?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct_answer: 'A' },
          { id: 'q2', question: 'What is DL?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct_answer: 'B' },
          { id: 'q3', question: 'What is AI?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct_answer: 'C' },
        ]
      }
    }),
  },
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
