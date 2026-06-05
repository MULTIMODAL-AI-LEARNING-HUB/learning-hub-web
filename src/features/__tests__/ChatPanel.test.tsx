import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ChatPanel } from '../chat/ChatPanel'
import { useAppStore } from '../../stores/appStore'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('ChatPanel', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
    useAppStore.setState({
      chat: {
        sessions: [
          {
            id: 'c1',
            title: 'Test Chat',
            preview: 'Hello',
            messages: [{ id: 'm1', role: 'user', content: 'Hello', timestamp: '10:00' }]
          }
        ],
        activeSessionId: 'c1',
        selectSession: useAppStore.getState().chat.selectSession,
        sendMessage: useAppStore.getState().chat.sendMessage,
        addSession: useAppStore.getState().chat.addSession,
        deleteSession: useAppStore.getState().chat.deleteSession
      }
    })
  })

  it('renders chat panel', () => {
    render(<ChatPanel />, { wrapper })
    expect(screen.getByText('AI Chat')).toBeInTheDocument()
    expect(screen.getByText('Test Chat')).toBeInTheDocument()
  })

  it('renders messages', () => {
    render(<ChatPanel />, { wrapper })
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders input field', () => {
    render(<ChatPanel />, { wrapper })
    expect(screen.getByPlaceholderText(/ask anything/i)).toBeInTheDocument()
  })

  it('sends a message', () => {
    render(<ChatPanel />, { wrapper })
    const input = screen.getByPlaceholderText(/ask anything/i)
    fireEvent.change(input, { target: { value: 'What is ML?' } })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(useAppStore.getState().chat.sessions[0].messages.length).toBeGreaterThan(1)
  })

  it('sends message on Enter', () => {
    render(<ChatPanel />, { wrapper })
    const input = screen.getByPlaceholderText(/ask anything/i)
    fireEvent.change(input, { target: { value: 'Hello AI' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(useAppStore.getState().chat.sessions[0].messages.length).toBeGreaterThan(1)
  })

  it('does not send empty message', () => {
    render(<ChatPanel />, { wrapper })
    const sendBtn = screen.getByRole('button', { name: /send message/i })
    expect(sendBtn).toBeDisabled()
  })
})
