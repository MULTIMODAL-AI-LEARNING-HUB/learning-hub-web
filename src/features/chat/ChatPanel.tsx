import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Send, Sparkles, MessageSquare, FileText, X, Paperclip } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Dropdown } from '../../components/ui/Dropdown'
import { EmptyState } from '../../components/ui/EmptyState'
import { fileIconEmoji } from '../../utils/fileIcon'
import { cn } from '../../utils/cn'

export function ChatPanel() {
  const sessions = useAppStore((s) => s.chat.sessions)
  const activeSessionId = useAppStore((s) => s.chat.activeSessionId)
  const sendMessage = useAppStore((s) => s.chat.sendMessage)
  const docs = useAppStore((s) => s.documents.items)

  const [input, setInput] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<string>('')
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

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedDocName = selectedDoc
    ? docs.find((d) => d.id === selectedDoc)?.name
    : null

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Chat
            </p>
            <p className="text-sm font-semibold text-foreground truncate">
              {activeSession?.title || 'New chat'}
            </p>
          </div>
        </div>

        <Dropdown
          align="right"
          menuClassName="w-72 p-1.5"
          trigger={
            <Button variant="outline" size="sm" icon={<Paperclip className="h-3.5 w-3.5" />}>
              {selectedDocName ? (
                <span className="max-w-32 truncate">{selectedDocName}</span>
              ) : (
                'Context'
              )}
            </Button>
          }
          items={[
            { id: '__none', label: 'No context', icon: <X className="h-4 w-4" /> },
            ...docs
              .filter((d) => d.status === 'ready')
              .map((d) => ({
                id: d.id,
                label: d.name,
                icon: <span className="text-base">{fileIconEmoji(d.type)}</span>
              }))
          ]}
          onSelect={(id) => {
            if (id === '__none') setSelectedDoc('')
            else setSelectedDoc(id)
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare />}
            title="Start a conversation"
            description="Ask questions about your uploaded documents and get contextual answers with citations."
            className="h-full border-0 bg-transparent"
          />
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2.5',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground border border-border'
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-current/20 pt-2 text-xs opacity-80">
                      {msg.citations.map((c) => (
                        <p key={c.id} className="flex items-center gap-1.5">
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="truncate">{c.label}</span>
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-2xs opacity-60">{msg.timestamp}</p>
                </div>
                {msg.role === 'user' && (
                  <Avatar
                    fallback={useAppStore.getState().auth.user.initials}
                    size="sm"
                    className="h-7 w-7"
                  />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 bg-muted/20">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-surface-elevated p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about your documents..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none max-h-32"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="icon"
            aria-label="Send message"
            className="h-8 w-8 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 text-2xs text-muted-foreground">
          <span className="tabular-nums">{input.length} / 500</span>
          <span>Enter to send · Shift+Enter for newline</span>
        </div>
      </div>
    </Card>
  )
}
