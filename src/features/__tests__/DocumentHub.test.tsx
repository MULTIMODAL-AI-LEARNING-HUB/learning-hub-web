import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { DocumentHub } from '../documents/DocumentHub'
import { useAppStore } from '../../stores/appStore'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('DocumentHub', () => {
  beforeEach(() => {
    useAppStore.setState({
      documents: {
        items: [
          { id: 'd1', name: 'AI_Basics.pdf', type: 'pdf', status: 'ready', size: '2.5MB', pageCount: 42 },
          { id: 'd2', name: 'ML_Overview.mp4', type: 'video', status: 'processing', progress: 50, size: '120MB' }
        ],
        selectedId: 'd1',
        select: useAppStore.getState().documents.select,
        add: useAppStore.getState().documents.add,
        remove: useAppStore.getState().documents.remove,
        retry: useAppStore.getState().documents.retry,
        updateProgress: useAppStore.getState().documents.updateProgress,
        loadDocuments: useAppStore.getState().documents.loadDocuments,
        uploadDocument: useAppStore.getState().documents.uploadDocument,
      }
    })
  })

  it('renders document list heading', () => {
    render(<DocumentHub />, { wrapper })
    expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
  })

  it('renders upload button', () => {
    render(<DocumentHub />, { wrapper })
    expect(screen.getByText('Upload')).toBeInTheDocument()
  })

  it('opens upload modal', () => {
    render(<DocumentHub />, { wrapper })
    fireEvent.click(screen.getByText('Upload'))
    expect(useAppStore.getState().ui.uploadModalOpen).toBe(true)
  })

  it('shows processing status', () => {
    render(<DocumentHub />, { wrapper })
    expect(screen.getByText(/Processing/)).toBeInTheDocument()
  })

  it('shows ready status', () => {
    render(<DocumentHub />, { wrapper })
    expect(screen.getByText(/Ready/)).toBeInTheDocument()
  })

  it('selects a document on click', () => {
    render(<DocumentHub />, { wrapper })
    const card = screen.getByText('ML_Overview.mp4')
    fireEvent.click(card)
    expect(useAppStore.getState().documents.selectedId).toBe('d2')
  })
})
