import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Flashcards } from '../study/Flashcards'

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
  it('renders flashcards page', () => {
    render(<Flashcards />, { wrapper })
    expect(screen.getByRole('heading', { name: 'Flashcards' })).toBeInTheDocument()
    expect(screen.getByText(/spaced repetition learning/i)).toBeInTheDocument()
  })

  it('renders configuration form', () => {
    render(<Flashcards />, { wrapper })
    expect(screen.getByText('Select document')).toBeInTheDocument()
    expect(screen.getByText('Card Set Name')).toBeInTheDocument()
    expect(screen.getByText('Number of cards')).toBeInTheDocument()
  })

  it('shows generate button', () => {
    render(<Flashcards />, { wrapper })
    expect(screen.getByText('Generate Flashcards')).toBeInTheDocument()
  })
})
