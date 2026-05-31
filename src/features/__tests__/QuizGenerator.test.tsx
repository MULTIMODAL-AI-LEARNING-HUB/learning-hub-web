import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QuizGenerator } from '../study/QuizGenerator'

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

  it('starts quiz on generate', () => {
    render(<QuizGenerator />, { wrapper })
    fireEvent.click(screen.getByText('Generate Quiz'))
    expect(screen.getByText(/Question 1 of/)).toBeInTheDocument()
  })

  it('navigates between questions', () => {
    render(<QuizGenerator />, { wrapper })
    fireEvent.click(screen.getByText('Generate Quiz'))
    expect(screen.getByText(/Question 1 of/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText(/Question 2 of/)).toBeInTheDocument()
  })

  it('selects an answer', () => {
    render(<QuizGenerator />, { wrapper })
    fireEvent.click(screen.getByText('Generate Quiz'))
    const options = screen.getAllByRole('button')
    const answerButton = options.find((b) => b.textContent?.includes('To learn patterns from data'))
    if (answerButton) {
      fireEvent.click(answerButton)
      expect(answerButton.className).toContain('border-accent')
    }
  })

  it('navigates to last question and submits', () => {
    render(<QuizGenerator />, { wrapper })
    fireEvent.click(screen.getByText('Generate Quiz'))
    // Click Next 4 times to get to question 5
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('Next'))
    }
    expect(screen.getByText(/Question 5 of/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Submit Quiz'))
    expect(screen.getByText(/\/5/)).toBeInTheDocument()
  })
})
