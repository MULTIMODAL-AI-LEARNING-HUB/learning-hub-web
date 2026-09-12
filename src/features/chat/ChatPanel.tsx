import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Sparkles, MessageSquare, FileText, X, Paperclip, Lightbulb, Baby, Sparkle, Code, Compass } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Dropdown } from '../../components/ui/Dropdown'
import { EmptyState } from '../../components/ui/EmptyState'
import { Markdown } from '../../components/ui/Markdown'
import { fileIconEmoji } from '../../utils/fileIcon'
import { cn } from '../../utils/cn'

export function ChatPanel() {
  const [searchParams] = useSearchParams()
  const sessions = useAppStore((s) => s.chat.sessions)
  const activeSessionId = useAppStore((s) => s.chat.activeSessionId)
  const addSession = useAppStore((s) => s.chat.addSession)
  const sendMessage = useAppStore((s) => s.chat.sendMessage)
  const docs = useAppStore((s) => s.documents.items)
  const userInitials = useAppStore((s) => s.auth.user?.initials ?? '?')

  const initialQuery = searchParams.get('initialQuery')
  const [input, setInput] = useState(initialQuery || '')
  const [selectedDoc, setSelectedDoc] = useState<string>('')
  const [tutorMode, setTutorMode] = useState<string>('standard')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const courseId = searchParams.get('course_id') || undefined
  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const messages = activeSession?.messages ?? []

  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    if (!activeSessionId) {
      if (sessions.length > 0) {
        useAppStore.getState().chat.selectSession(sessions[0].id)
      } else {
        addSession(courseId)
      }
    }
  }, [courseId, activeSessionId, sessions, addSession])

  const lastMsg = messages[messages.length - 1]
  const showTyping =
    isSending &&
    (!lastMsg || lastMsg.role === 'user' || (lastMsg.role === 'assistant' && !lastMsg.content.trim()))

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isSending, lastMsg?.content?.length])

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    const text = input
    setInput('')
    setIsSending(true)
    try {
      await sendMessage(text, selectedDoc ? [selectedDoc] : [], courseId, undefined, tutorMode)
    } finally {
      setIsSending(false)
    }
  }

  const handleReExplain = async (mode: string, contextContent?: string) => {
    if (isSending) return
    const modeLabel =
      mode === 'eli5'
        ? 'dễ hiểu như giải thích cho người mới (ELI5)'
        : mode === 'analogy'
        ? 'hình ảnh ẩn dụ đời thực sinh động'
        : mode === 'code_deepdive'
        ? 'chuyên sâu kỹ thuật kèm code minh họa cụ thể'
        : 'phương pháp gợi mở Socratic'

    const snippet = contextContent ? ` "${contextContent.slice(0, 140)}..."` : ''
    const text = `Hãy giải thích lại phần trên theo phong cách ${modeLabel}${snippet}`
    setIsSending(true)
    try {
      await sendMessage(text, selectedDoc ? [selectedDoc] : [], courseId, undefined, mode)
    } finally {
      setIsSending(false)
    }
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
              Trò chuyện AI
            </p>
            <p className="text-sm font-semibold text-foreground truncate">
              {activeSession?.title || 'Đoạn chat mới'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Dropdown
            align="right"
            menuClassName="w-64 p-1.5"
            trigger={
              <Button variant="outline" size="sm" icon={<Lightbulb className="h-3.5 w-3.5" />}>
                {tutorMode === 'socratic' ? 'Socratic' : tutorMode === 'eli5' ? 'ELI5' : tutorMode === 'analogy' ? 'Ẩn dụ' : tutorMode === 'code_deepdive' ? 'Deep-dive' : 'Chuẩn'}
              </Button>
            }
            items={[
              { id: 'standard', label: 'Chuẩn — trả lời trực tiếp', icon: <Sparkle className="h-4 w-4" /> },
              { id: 'socratic', label: 'Socratic — hỏi gợi mở', icon: <Compass className="h-4 w-4" /> },
              { id: 'eli5', label: 'ELI5 — siêu dễ hiểu', icon: <Baby className="h-4 w-4" /> },
              { id: 'analogy', label: 'Ẩn dụ đời thực', icon: <Lightbulb className="h-4 w-4" /> },
              { id: 'code_deepdive', label: 'Deep-dive code', icon: <Code className="h-4 w-4" /> },
            ]}
            onSelect={(id) => setTutorMode(id)}
          />
          <Dropdown
            align="right"
            menuClassName="w-72 p-1.5"
            trigger={
              <Button variant="outline" size="sm" icon={<Paperclip className="h-3.5 w-3.5" />}>
                {selectedDocName ? (
                  <span className="max-w-32 truncate">{selectedDocName}</span>
                ) : (
                  'Tài liệu tham chiếu'
                )}
              </Button>
            }
            items={[
              { id: '__none', label: 'Không kèm tài liệu', icon: <X className="h-4 w-4" /> },
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
      </div>

      {tutorMode === 'socratic' && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Chế độ <strong>Socratic</strong> đang bật — AI sẽ hỏi gợi mở từng bước thay vì đưa đáp án ngay.
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare />}
            title="Bắt đầu cuộc trò chuyện"
            description="Đặt câu hỏi về các tài liệu đã tải lên của bạn để nhận câu trả lời chính xác kèm trích dẫn nguồn."
            className="h-full border-0 bg-transparent"
          />
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((msg) => {
              // Skip the empty streaming placeholder while sending — the typing
              // indicator below already covers it. Rendering both produced the
              // duplicate "empty bubble 20:44" + "AI đang suy nghĩ..." glitch.
              const isEmptyStreamingPlaceholder =
                msg.role === 'assistant' && !msg.content.trim() && isSending
              if (isEmptyStreamingPlaceholder) return null
              return (
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
                    'max-w-[90%] rounded-2xl px-3 py-2 text-sm sm:max-w-[80%] sm:px-4 sm:py-2.5',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground border border-border'
                  )}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : msg.content.trim() ? (
                    <Markdown text={msg.content} className="md-body leading-relaxed" />
                  ) : null}
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
                  {msg.role === 'assistant' && msg.content.trim() && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40 text-2xs">
                      <span className="text-muted-foreground/75 font-medium mr-0.5 flex items-center gap-1">
                        <Sparkle className="h-3 w-3 text-primary" /> Giải thích lại:
                      </span>
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => handleReExplain('eli5', msg.content)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/80 hover:bg-background border border-border/60 text-foreground/80 hover:text-foreground transition disabled:opacity-40 cursor-pointer"
                        title="Giải thích siêu dễ hiểu cho người mới (ELI5)"
                      >
                        <Baby className="h-3 w-3 text-emerald-500" />
                        ELI5
                      </button>
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => handleReExplain('analogy', msg.content)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/80 hover:bg-background border border-border/60 text-foreground/80 hover:text-foreground transition disabled:opacity-40 cursor-pointer"
                        title="Giải thích bằng ẩn dụ đời thực sinh động"
                      >
                        <Compass className="h-3 w-3 text-sky-500" />
                        Ẩn dụ
                      </button>
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => handleReExplain('code_deepdive', msg.content)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/80 hover:bg-background border border-border/60 text-foreground/80 hover:text-foreground transition disabled:opacity-40 cursor-pointer"
                        title="Kỹ thuật chuyên sâu & code mẫu"
                      >
                        <Code className="h-3 w-3 text-purple-500" />
                        Code sâu
                      </button>
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => handleReExplain('socratic', msg.content)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/80 hover:bg-background border border-border/60 text-foreground/80 hover:text-foreground transition disabled:opacity-40 cursor-pointer"
                        title="Gợi mở từng bước (Socratic)"
                      >
                        <Lightbulb className="h-3 w-3 text-amber-500" />
                        Gợi mở
                      </button>
                    </div>
                  )}
                  <p className="mt-1 text-2xs opacity-60">{msg.timestamp}</p>
                </div>
                {msg.role === 'user' && (
                  <Avatar
                    fallback={userInitials}
                    size="sm"
                    className="h-7 w-7"
                  />
                )}
              </div>
              )
            })}
            {showTyping && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                </div>
                <div className="rounded-2xl px-4 py-2.5 text-sm bg-muted text-foreground border border-border flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="inline-block h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="inline-block h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-muted-foreground ml-1.5">AI đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border p-2 bg-muted/20 sm:p-3">
        <div className="flex items-end gap-1.5 rounded-xl border border-input bg-surface-elevated p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition sm:gap-2 sm:p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Hỏi bất cứ điều gì về tài liệu học tập của bạn..."
            rows={1}
            disabled={isSending}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none max-h-32 disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            size="icon"
            aria-label="Gửi tin nhắn"
            className="h-8 w-8 shrink-0"
          >
            <Send className={cn('h-4 w-4', isSending && 'opacity-40')} />
          </Button>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 text-2xs text-muted-foreground">
          <span className="tabular-nums">{input.length} / 500</span>
          <span className="hidden sm:inline">Nhấn Enter để gửi · Shift+Enter để xuống dòng</span>
        </div>
      </div>
    </Card>
  )
}
