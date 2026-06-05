import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToastContainer } from '../Toast'
import { useAppStore } from '../../../stores/appStore'

describe('ToastContainer', () => {
  beforeEach(() => {
    useAppStore.setState({ toasts: { items: [], add: useAppStore.getState().toasts.add, remove: useAppStore.getState().toasts.remove } })
  })

  it('renders nothing when no toasts', () => {
    render(<ToastContainer />)
    expect(screen.queryByText('Success')).not.toBeInTheDocument()
  })

  it('renders toast when added', () => {
    useAppStore.getState().toasts.add({ type: 'success', title: 'Upload complete' })
    render(<ToastContainer />)
    expect(screen.getByText('Upload complete')).toBeInTheDocument()
  })

  it('renders different toast types', () => {
    useAppStore.getState().toasts.add({ type: 'error', title: 'Error occurred' })
    useAppStore.getState().toasts.add({ type: 'warning', title: 'Warning' })
    useAppStore.getState().toasts.add({ type: 'info', title: 'Info message' })
    render(<ToastContainer />)
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getByText('Info message')).toBeInTheDocument()
  })

  it('removes toast on close click', () => {
    useAppStore.getState().toasts.add({ type: 'success', title: 'Test' })
    render(<ToastContainer />)
    const closeButtons = screen.getAllByRole('button', { name: /dismiss/i })
    fireEvent.click(closeButtons[closeButtons.length - 1])
    expect(screen.queryByText('Test')).not.toBeInTheDocument()
  })
})
