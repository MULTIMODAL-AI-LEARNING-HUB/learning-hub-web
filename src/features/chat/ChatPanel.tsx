import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'

export function ChatPanel() {
  const sessions = useAppStore((s) => s.chat.sessions)
  const activeSessionId = useAppStore((s) => s.chat.activeSessionId)
  const sendMessage = useAppStore((s) => s.chat.sendMessage)
  const docs = useAppStore((s) => s.documents.items)

  const [input, setInput] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<string>('')
  const [docDropdownOpen, setDocDropdownOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const messages = activeSession?.messages ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input, selectedDoc ? [selectedDoc] : [])
    setInput('')
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-panel shadow-soft">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-inkMute">AI Chat</p>
          <p className="text-sm font-semibold text-ink">{activeSession?.title || 'New chat'}</p>
        </div>

        {/* Context selector */}
        <div className="relative">
          <button
            onClick={() => setDocDropdownOpen((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs transition hover:bg-surface"
          >
            {selectedDoc ? docs.find((d) => d.id === selectedDoc)?.name : 'Context ▾'}
          </button>
          {docDropdownOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-panel py-1.5 shadow-lift">
              <button
                onClick={() => {
                  setSelectedDoc('')
                  setDocDropdownOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-inkMute transition hover:bg-surface"
              >
                No context
              </button>
              {docs
                .filter((d) => d.status === 'ready')
                .map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDoc(d.id)
                      setDocDropdownOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-surface ${
                      selectedDoc === d.id ? 'bg-accentSoft text-accent' : 'text-ink'
                    }`}
                  >
                    <span>{d.type === 'pdf' ? '📄' : d.type === 'video' ? '🎬' : '🎧'}</span>
                    {d.name}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <span className="text-4xl">💬</span>
            <p className="text-sm text-inkMute">Start a conversation with AI tutor</p>
            <p className="text-xs text-inkMute/70">Ask questions about your uploaded documents</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-accent text-white'
                      : 'bg-surface text-inkSoft'
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-white/20 pt-2 text-xs opacity-70">
                      {msg.citations.map((c) => (
                        <p key={c.id}>{c.label}</p>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[10px] opacity-50">{msg.timestamp}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-white px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-inkMute/60"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="sm"
            className="shrink-0"
          >
            Send
          </Button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-inkMute">
          <span>{input.length}/500</span>
          <span>Enter to send • Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  )
}
