import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Flashcards } from '../study/Flashcards'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('Flashcards', () => {
  it('renders flashcards page', () => {
    render(<Flashcards />, { wrapper })
    expect(screen.getByText(/Flashcards/)).toBeInTheDocument()
    expect(screen.getByText('Study with interactive flashcards')).toBeInTheDocument()
  })

  it('shows first card', () => {
    render(<Flashcards />, { wrapper })
    expect(screen.getByText('What is Machine Learning?')).toBeInTheDocument()
    expect(screen.getByText('Question')).toBeInTheDocument()
  })

  it('flips card on click', () => {
    render(<Flashcards />, { wrapper })
    fireEvent.click(screen.getByText('What is Machine Learning?'))
    expect(screen.getByText('Answer')).toBeInTheDocument()
    expect(screen.getByText(/A subset of AI/)).toBeInTheDocument()
  })

  it('marks card as known', () => {
    render(<Flashcards />, { wrapper })
    fireEvent.click(screen.getByText(/Know it/))
    expect(screen.getByText(/Known: 1/)).toBeInTheDocument()
  })

  it('marks card as unknown', () => {
    render(<Flashcards />, { wrapper })
    fireEvent.click(screen.getByText(/Don't know/))
    expect(screen.getByText(/Unknown: 1/)).toBeInTheDocument()
  })

  it('shuffles cards', () => {
    render(<Flashcards />, { wrapper })
    fireEvent.click(screen.getByText(/Shuffle/))
    expect(screen.getByText(/Card 1\/8/)).toBeInTheDocument()
  })
})
