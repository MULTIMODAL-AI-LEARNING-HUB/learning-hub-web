import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows spinner when loading', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByText('Submit')).toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('does not call onClick when loading', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} loading>Submit</Button>)
    fireEvent.click(screen.getByText('Submit'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies variant classes', () => {
    const { rerender } = render(<Button variant="primary">Test</Button>)
    expect(screen.getByRole('button').className).toContain('bg-primary')

    rerender(<Button variant="danger">Test</Button>)
    expect(screen.getByRole('button').className).toContain('bg-destructive')
  })

  it('applies size classes', () => {
    const { rerender } = render(<Button size="sm">Test</Button>)
    expect(screen.getByRole('button').className).toContain('text-xs')

    rerender(<Button size="lg">Test</Button>)
    expect(screen.getByRole('button').className).toContain('h-11')
  })
})
