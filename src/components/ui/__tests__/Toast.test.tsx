import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ToastContainer } from '../Toast'
import { useAppStore } from '../../../stores/appStore'

describe('ToastContainer', () => {
  beforeEach(() => {
    act(() => {
      useAppStore.setState((state) => ({
        ...state,
        toasts: {
          ...state.toasts,
          items: []
        }
      }))
    })
  })

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders active toast items', () => {
    act(() => {
      useAppStore.getState().toasts.add({
        type: 'success',
        title: 'Success Title',
        message: 'Success Message'
      })
    })

    render(<ToastContainer />)

    expect(screen.getByText('Success Title')).toBeInTheDocument()
    expect(screen.getByText('Success Message')).toBeInTheDocument()
  })
})
