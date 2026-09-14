/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization, react-hooks/purity */
import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import {
  Send,
  Sparkles,
  RotateCcw,
  BookOpen,
  GraduationCap,
  ListChecks,
  Lightbulb,
  Baby,
  Sparkle,
  Code,
  Compass,
  HelpCircle,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Dropdown } from '../../components/ui/Dropdown'
import { Markdown } from '../../components/ui/Markdown'
import { Badge } from '../../components/ui/Badge'
import { useAppStore } from '../../stores/appStore'
import {
  chatApi,
  type Citation as ApiCitation,
  type ChatMessage as ApiChatMessage,
  type Lesson,
} from '../../services/api'
import type { Message } from '../../types'
import { cn } from '../../utils/cn'

interface CourseAiTutorPanelProps {
  courseId: string
  courseTitle: string
  currentLesson?: Lesson | null
  onOpenQuiz?: () => void
  className?: string
}

type ScopeType = 'lesson' | 'course'

const TUTOR_MODES = [
  { id: 'standard', label: 'Tiêu chuẩn', icon: Sparkles, desc: 'Giải thích đầy đủ, chuẩn học thuật' },
  { id: 'socratic', label: 'Socratic (Gợi mở)', icon: Compass, desc: 'Đặt câu hỏi dẫn dắt, không giải ngay' },
  { id: 'eli5', label: 'Dễ hiểu (ELI5)', icon: Baby, desc: 'Diễn đạt đơn giản cho người mới' },
  { id: 'analogy', label: 'Ẩn dụ đời thực', icon: Sparkle, desc: 'Ví von hình tượng thực tế gần gũi' },
  { id: 'code_deepdive', label: 'Code sâu & Kỹ thuật', icon: Code, desc: 'Đi sâu bản chất kỹ thuật & cấu trúc' },
]

export function CourseAiTutorPanel({
  courseId,
  courseTitle,
  currentLesson,
  onOpenQuiz,
  className,
}: CourseAiTutorPanelProps) {
  const userInitials = useAppStore((s) => s.auth.user?.initials ?? '?')

  const [scope, setScope] = useState<ScopeType>('lesson')
  const [tutorMode, setTutorMode] = useState<string>('standard')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [loadingSession, setLoadingSession] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const sessionStorageKey = `course_ai_session_${courseId}`

  // Initialize or restore session for this course
  const initSession = useCallback(async (forceNew = false) => {
    setLoadingSession(true)
    try {
      const savedSessionId = !forceNew ? localStorage.getItem(sessionStorageKey) : null
      if (savedSessionId) {
        try {
          const res = await chatApi.listMessages(savedSessionId)
          const items: ApiChatMessage[] = res.data.items || []
          const loadedMsgs: Message[] = items.map((m: ApiChatMessage, idx: number) => ({
            id: m.id || `hist-${idx}`,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            citations: (m.citations || []).map((c: ApiCitation, i: number) => ({
              id: `cite-${i}`,
              label: c.lesson_id
                ? `[${i + 1}] Bài học (Trang ${c.page_number || '?'})`
                : `[${i + 1}] Tài liệu khóa học (Trang ${c.page_number || '?'})`,
            })),
          }))
          setSessionId(savedSessionId)
          setMessages(loadedMsgs)
          setLoadingSession(false)
          return
        } catch {
          // If session expired or invalid, fall through to create new
          localStorage.removeItem(sessionStorageKey)
        }
      }

      // Create new course session
      const title = `Gia sư: ${courseTitle.slice(0, 35)}`
      const createRes = await chatApi.createSession({
        course_id: courseId,
        lesson_id: currentLesson?.id,
        title,
      })
      const newSession = createRes.data
      setSessionId(newSession.id)
      localStorage.setItem(sessionStorageKey, newSession.id)
      setMessages([])
    } catch (err) {
      console.error('Failed to initialize course AI session:', err)
    } finally {
      setLoadingSession(false)
    }
  }, [courseId, courseTitle, currentLesson?.id, sessionStorageKey])

  useEffect(() => {
    initSession()
  }, [initSession])

  // Scroll to bottom smoothly on message change
  const lastMsg = messages[messages.length - 1]
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isSending, lastMsg?.content?.length])

  // Scope default logic
  useEffect(() => {
    if (!currentLesson && scope === 'lesson') {
      setScope('course')
    }
  }, [currentLesson, scope])

  const handleSend = async (queryText?: string, overrideMode?: string) => {
    const textToSend = (queryText || input).trim()
    if (!textToSend || isSending) return

    let currentSid = sessionId
    if (!currentSid) {
      await initSession()
      currentSid = localStorage.getItem(sessionStorageKey)
    }
    if (!currentSid) return

    if (!queryText) {
      setInput('')
    }

    const mode = overrideMode || tutorMode
    const now = new Date()
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const userMsgId = `user-${Date.now()}`
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: ts,
    }

    const aiMsgId = `ai-${Date.now() + 1}`
    const aiPlaceholder: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: ts,
      citations: [],
    }

    setMessages((prev) => [...prev, userMsg, aiPlaceholder])
    setIsSending(true)

    const appendToken = (chunk: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, content: m.content + chunk } : m))
      )
    }

    const applyCitations = (cites: ApiCitation[]) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                citations: cites.map((c, i) => ({
                  id: `cite-${i}`,
                  label: c.lesson_id
                    ? `[${i + 1}] Bài học (Trang ${c.page_number || '?'})`
                    : `[${i + 1}] Khóa học (Trang ${c.page_number || '?'})`,
                })),
              }
            : m
        )
      )
    }

    const targetLessonId = scope === 'lesson' && currentLesson ? currentLesson.id : undefined

    try {
      const controller = new AbortController()
      let streamTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
        controller.abort()
      }, 15000)

      const clearStreamTimeout = () => {
        if (streamTimeout) {
          clearTimeout(streamTimeout)
          streamTimeout = null
        }
      }

      try {
        const streamRes = await chatApi.askStream(
          {
            session_id: currentSid,
            query: textToSend,
            course_id: courseId,
            lesson_id: targetLessonId,
            course_title: courseTitle,
            strict_course: true,
            tutor_mode: mode,
          },
          (token) => {
            clearStreamTimeout()
            appendToken(token)
          },
          (meta) => {
            clearStreamTimeout()
            if (meta.citations) applyCitations(meta.citations)
          },
          controller.signal
        )
        clearStreamTimeout()
        if (streamRes.citations?.length) {
          applyCitations(streamRes.citations)
        }
      } catch (streamErr) {
        clearStreamTimeout()
        // Fallback to non-streaming JSON endpoint
        const fallbackRes = await chatApi.ask({
          session_id: currentSid,
          query: textToSend,
          course_id: courseId,
          lesson_id: targetLessonId,
          course_title: courseTitle,
          strict_course: true,
          tutor_mode: mode,
        })
        const data = fallbackRes.data
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: data.answer,
                  citations:
                    data.citations?.map((c: ApiCitation, i: number) => ({
                      id: `cite-${i}`,
                      label: c.lesson_id
                        ? `[${i + 1}] Bài học (Trang ${c.page_number || '?'})`
                        : `[${i + 1}] Khóa học (Trang ${c.page_number || '?'})`,
                    })) || [],
                }
              : m
          )
        )
        void streamErr
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content:
                  'Xin lỗi, không thể kết nối đến Gia sư AI. Vui lòng kiểm tra kết nối mạng và thử lại sau giây lát.',
              }
            : m
        )
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleReExplain = (mode: string, quote?: string) => {
    if (isSending) return
    const modeObj = TUTOR_MODES.find((m) => m.id === mode)
    const label = modeObj ? modeObj.label : mode
    const prompt = quote
      ? `Hãy giải thích lại phần sau theo phong cách ${label}: "${quote.slice(0, 160)}..."`
      : `Hãy giải thích lại nội dung trên theo phong cách ${label}.`
    handleSend(prompt, mode)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickPrompts =
    scope === 'lesson' && currentLesson
      ? [
          { text: 'Tóm tắt trọng tâm bài học này', icon: Lightbulb },
          { text: 'Giải thích các khái niệm cốt lõi', icon: BookOpen },
          { text: 'Cho ví dụ minh họa hoặc đoạn code thực hành', icon: Code },
          { text: 'Đặt câu hỏi thử thách tư duy về bài này', icon: HelpCircle },
        ]
      : [
          { text: 'Tổng quan cấu trúc và mục tiêu của khóa học này', icon: BookOpen },
          { text: 'Lộ trình kiến thức từ cơ bản đến nâng cao', icon: GraduationCap },
          { text: 'Các kỹ năng quan trọng nhất cần nắm sau khóa học', icon: Lightbulb },
          { text: 'Khóa học này gồm những chủ đề cốt lõi nào?', icon: HelpCircle },
        ]

  const showTyping =
    isSending &&
    (!lastMsg || lastMsg.role === 'user' || (lastMsg.role === 'assistant' && !lastMsg.content.trim()))

  const activeModeObj = TUTOR_MODES.find((m) => m.id === tutorMode) || TUTOR_MODES[0]
  const ActiveModeIcon = activeModeObj.icon

  return (
    <Card className={cn('flex flex-col h-[720px] max-h-[82vh] overflow-hidden border-border bg-card shadow-sm', className)}>
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground truncate max-w-[260px] sm:max-w-[400px]">
                Gia sư AI: {courseTitle}
              </span>
              <Badge variant="primary" label="Ưu tiên khóa học" className="text-3xs font-medium px-1.5 py-0" />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {scope === 'lesson' && currentLesson
                ? `Trọng tâm: ${currentLesson.title}`
                : 'Tra cứu toàn bộ bài giảng & tài liệu khóa học'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Scope Selector */}
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-background text-xs">
            <button
              type="button"
              onClick={() => setScope('lesson')}
              disabled={!currentLesson}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition',
                scope === 'lesson'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground disabled:opacity-50'
              )}
              title={currentLesson ? `Ưu tiên bài học: ${currentLesson.title}` : 'Chưa chọn bài học'}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Bài đang học</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('course')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition',
                scope === 'course'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Tra cứu trên toàn bộ khóa học"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Toàn khóa học</span>
            </button>
          </div>

          {/* Quick Quiz trigger in-place */}
          {onOpenQuiz && currentLesson && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenQuiz}
              className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
              title="Mở bài trắc nghiệm nhanh cho bài học này"
            >
              <ListChecks className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Luyện trắc nghiệm</span>
            </Button>
          )}

          {/* Reset Conversation */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => initSession(true)}
            disabled={isSending || loadingSession}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Bắt đầu đoạn hội thoại mới"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingSession ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm gap-2">
            <Sparkles className="h-4 w-4 animate-spin text-primary" />
            <span>Đang kết nối với Gia sư AI khóa học...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-lg mx-auto py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-base text-foreground">
              Gia sư AI đồng hành cùng khóa học
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Tôi được trang bị đầy đủ tài liệu, giáo trình và bài giảng của khóa học{' '}
              <strong className="text-foreground">"{courseTitle}"</strong>. Bạn có thể hỏi sâu về bài học
              hiện tại, hỏi mở rộng sang các bài khác, hoặc yêu cầu giải thích lại bất kỳ khái niệm nào.
            </p>

            {/* Quick Prompts list */}
            <div className="mt-6 w-full space-y-2 text-left">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Gợi ý câu hỏi bắt đầu:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((p, idx) => {
                  const Icon = p.icon
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(p.text)}
                      className="flex items-start gap-2.5 rounded-xl border border-border p-2.5 text-xs text-foreground bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition text-left group"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary mt-0.5 group-hover:scale-110 transition" />
                      <span className="line-clamp-2 leading-snug">{p.text}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 text-sm group',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <Avatar
                    fallback="AI"
                    size="sm"
                    className="shrink-0 bg-gradient-to-br from-primary to-accent text-primary-foreground ring-2 ring-primary/20"
                  />
                )}

                <div
                  className={cn(
                    'flex flex-col max-w-[85%] rounded-2xl p-3.5 shadow-2xs',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-xs'
                      : 'bg-muted/40 text-foreground border border-border rounded-bl-xs'
                  )}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="font-semibold text-xs opacity-75">
                      {msg.role === 'user' ? 'Bạn' : 'Gia sư AI'}
                    </span>
                    <span className="text-3xs opacity-60">{msg.timestamp}</span>
                  </div>

                  {msg.role === 'assistant' ? (
                    <div className="max-w-none text-foreground overflow-x-auto leading-relaxed">
                      <Markdown text={msg.content} />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                  )}

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap gap-1.5">
                      <span className="text-3xs font-semibold text-muted-foreground uppercase self-center mr-1">
                        Trích dẫn:
                      </span>
                      {msg.citations.map((c) => (
                        <Badge
                          key={c.id}
                          variant="outline"
                          label={c.label}
                          className="text-3xs font-mono py-0.5 px-2 bg-background/60 text-muted-foreground hover:text-foreground"
                        />
                      ))}
                    </div>
                  )}

                  {/* Quick Re-explain Action Bar for Assistant Responses */}
                  {msg.role === 'assistant' && msg.content && !isSending && (
                    <div className="mt-3 pt-2 border-t border-border/40 flex flex-wrap items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <span className="text-3xs text-muted-foreground mr-1 flex items-center gap-0.5">
                        <Lightbulb className="h-3 w-3" /> Giải thích lại:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReExplain('eli5', msg.content)}
                        className="text-3xs px-2 py-0.5 rounded-md border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition"
                      >
                        Dễ hiểu (ELI5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReExplain('analogy', msg.content)}
                        className="text-3xs px-2 py-0.5 rounded-md border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition"
                      >
                        Ẩn dụ đời thực
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReExplain('code_deepdive', msg.content)}
                        className="text-3xs px-2 py-0.5 rounded-md border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition"
                      >
                        Code & Kỹ thuật
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReExplain('socratic', msg.content)}
                        className="text-3xs px-2 py-0.5 rounded-md border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition"
                      >
                        Gợi mở Socratic
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <Avatar fallback={userInitials} size="sm" className="shrink-0 bg-primary/20 text-primary" />
                )}
              </div>
            ))}

            {showTyping && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Avatar
                  fallback="AI"
                  size="sm"
                  className="shrink-0 bg-gradient-to-br from-primary to-accent text-primary-foreground ring-2 ring-primary/20"
                />
                <div className="flex items-center gap-2 rounded-2xl bg-muted/40 border border-border px-3.5 py-2">
                  <div className="flex space-x-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                  </div>
                  <span className="text-xs">Gia sư AI đang đối chiếu dữ liệu khóa học...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 3. Input Toolbar & Box */}
      <div className="border-t border-border bg-muted/20 p-3 space-y-2">
        {/* Style mode dropdown & scope indicator */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Dropdown
              align="left"
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-foreground bg-background hover:bg-muted transition font-medium"
                >
                  <ActiveModeIcon className="h-3.5 w-3.5 text-primary" />
                  <span>Phong cách: {activeModeObj.label}</span>
                </button>
              }
              items={TUTOR_MODES.map((m) => {
                const Icon = m.icon
                return {
                  id: m.id,
                  label: m.label,
                  icon: <Icon className="h-4 w-4 text-primary" />,
                }
              })}
              onSelect={(id) => setTutorMode(id)}
            />

            {scope === 'lesson' && currentLesson ? (
              <span className="text-3xs text-muted-foreground hidden md:inline truncate max-w-[280px]">
                Đang ưu tiên: <strong>{currentLesson.title}</strong> (vẫn tra chéo bài khi cần)
              </span>
            ) : (
              <span className="text-3xs text-muted-foreground hidden md:inline">
                Đang tìm kiếm trên toàn bộ khóa học
              </span>
            )}
          </div>

          <span className="text-3xs text-muted-foreground hidden sm:inline">
            Enter để gửi • Shift+Enter xuống dòng
          </span>
        </div>

        {/* Input Textarea & Send button */}
        <div className="relative flex items-end rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-2xs">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              scope === 'lesson' && currentLesson
                ? `Hỏi Gia sư AI về bài "${currentLesson.title}"...`
                : `Hỏi Gia sư AI về khóa học "${courseTitle}"...`
            }
            className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32"
          />

          <div className="p-2">
            <Button
              size="sm"
              onClick={() => handleSend()}
              disabled={!input.trim() || isSending}
              className="h-8 w-8 p-0 rounded-lg shrink-0"
              title="Gửi câu hỏi"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
