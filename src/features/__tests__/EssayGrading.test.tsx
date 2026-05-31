import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { EssayGrading } from '../study/EssayGrading'

vi.mock('../../stores/appStore', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
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

  it('renders textarea with default text', () => {
    render(<EssayGrading />, { wrapper })
    expect(screen.getByText(/Machine learning has become/)).toBeInTheDocument()
  })

  it('shows word count', () => {
    render(<EssayGrading />, { wrapper })
    expect(screen.getByText(/words/)).toBeInTheDocument()
  })

  it('shows empty state before grading', () => {
    render(<EssayGrading />, { wrapper })
    expect(screen.getByText(/Write an essay and click/)).toBeInTheDocument()
  })

  it('clears essay content', () => {
    render(<EssayGrading />, { wrapper })
    fireEvent.click(screen.getByText('Clear'))
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('')
  })
})
