import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { EssayGrading } from '../study/EssayGrading'

vi.mock('../../services/api', () => ({
  studyApi: {
    submitEssay: vi.fn(),
  },
}))

vi.mock('../../components/ui/Toast', () => ({
  useToast: () => vi.fn(),
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

describe('EssayGrading', () => {
  it('renders essay grading page', () => {
    render(<EssayGrading />, { wrapper })
    expect(screen.getByText(/Essay Grading/)).toBeInTheDocument()
    expect(screen.getByText('Grade Essay')).toBeInTheDocument()
  })

  it('renders textarea', () => {
    render(<EssayGrading />, { wrapper })
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
  })

  it('shows word count', () => {
    render(<EssayGrading />, { wrapper })
    expect(screen.getByText(/words/)).toBeInTheDocument()
  })

  it('shows empty state before grading', () => {
    render(<EssayGrading />, { wrapper })
    expect(screen.getByText(/Ready when you are/)).toBeInTheDocument()
  })

  it('clears essay content', () => {
    render(<EssayGrading />, { wrapper })
    fireEvent.click(screen.getByText('Clear'))
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('')
  })
})
