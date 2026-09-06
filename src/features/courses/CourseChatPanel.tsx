/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { MessageCircle, RefreshCcw, Send } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { courseChatApi, type CourseChatMessage } from '../../services/api'
import { useAppStore } from '../../stores/appStore'
import { cn } from '../../utils/cn'

interface CourseChatPanelProps {
  courseId: string
  compact?: boolean
}

const POLL_INTERVAL_MS = 3000

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function senderName(message: CourseChatMessage) {
  return message.sender_name || message.sender_role || 'Thành viên khóa học'
}

function senderInitial(message: CourseChatMessage) {
  return senderName(message).trim().charAt(0).toUpperCase() || '?'
}

export function CourseChatPanel({ courseId, compact = false }: CourseChatPanelProps) {
  const [messages, setMessages] = useState<CourseChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentUserId = useAppStore((state) => state.auth.user?.id)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await courseChatApi.listMessages(courseId)
      setMessages(res.data.items)
      setError(null)
    } catch {
      setError('Không thể tải tin nhắn trò chuyện.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadMessages()
    const intervalId = window.setInterval(() => {
      loadMessages(true)
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  const canSend = useMemo(() => draft.trim().length > 0 && !sending, [draft, sending])

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content) return
    setSending(true)
    try {
      const res = await courseChatApi.sendMessage(courseId, content)
      setMessages((current) => [...current.filter((item) => item.id !== res.data.id), res.data])
      setDraft('')
      setError(null)
    } catch {
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card padding="none" className={cn('overflow-hidden', compact ? 'h-[520px]' : 'h-[640px]')}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Trò Chuyện Khóa Học</h2>
              <p className="text-xs text-muted-foreground">Tin nhắn hiển thị cho tất cả thành viên trong khóa học.</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadMessages()}
            aria-label="Làm mới tin nhắn"
            title="Làm mới tin nhắn"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Đang tải tin nhắn...</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Chưa có tin nhắn nào</p>
              <p className="mt-1 text-xs text-muted-foreground">Bắt đầu cuộc trò chuyện trong khóa học tại đây.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={cn('flex gap-2', message.sender_id === currentUserId && 'justify-end')}>
                  {message.sender_id !== currentUserId && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                      {senderInitial(message)}
                    </div>
                  )}
                  <div className={cn('max-w-[78%]', message.sender_id === currentUserId && 'text-right')}>
                    <div className={cn('mb-1 flex items-center gap-2 text-xs text-muted-foreground', message.sender_id === currentUserId && 'justify-end')}>
                      <span>{message.sender_id === currentUserId ? 'Bạn' : senderName(message)}</span>
                      <span>{formatMessageTime(message.created_at)}</span>
                    </div>
                    <div
                      className={cn(
                        'rounded-2xl px-3 py-2 text-sm leading-relaxed',
                        message.sender_id === currentUserId
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border bg-muted/40 text-foreground'
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-border px-4 py-2 text-xs text-destructive">{error}</div>
        )}

        <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-border p-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Nhập tin nhắn..."
            className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={2}
            maxLength={2000}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            loading={sending}
            aria-label="Gửi tin nhắn"
            title="Gửi tin nhắn"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}
