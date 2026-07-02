import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Upload,
  MessageSquare,
  BookOpen,
  Layers,
  FileText,
  Clock,
  ArrowRight,
  ChevronRight,
  HardDrive,
  Cpu,
  Compass,
  FileQuestion
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { fileIconEmoji } from '../../utils/fileIcon'

export function HomePage() {
  const navigate = useNavigate()
  
  // Select state
  const user = useAppStore((s) => s.auth.user)
  const docs = useAppStore((s) => s.documents.items)
  const loadDocuments = useAppStore((s) => s.documents.loadDocuments)
  const selectDoc = useAppStore((s) => s.documents.select)
  
  const sessions = useAppStore((s) => s.chat.sessions)
  const selectSession = useAppStore((s) => s.chat.selectSession)
  const addSession = useAppStore((s) => s.chat.addSession)
  
  const openUploadModal = useAppStore((s) => s.ui.openUploadModal)
  
  // Call loadDocuments on mount
  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Time-based greeting helper
  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good morning'
    if (hr < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date())

  // Stats
  const totalDocs = docs.length
  const readyDocs = docs.filter((d) => d.status === 'ready').length
  const activeSessions = sessions.length

  // Quota
  const storageUsed = user?.quota?.storageUsed ?? 0
  const storageTotal = user?.quota?.storageTotal ?? 100 // default 100MB
  const storagePercent = Math.min(100, Math.round((storageUsed / storageTotal) * 100))

  const tokensUsed = user?.quota?.tokensUsed ?? 0
  const tokensTotal = user?.quota?.tokensTotal ?? 50000 // default 50K
  const tokensPercent = Math.min(100, Math.round((tokensUsed / tokensTotal) * 100))

  // Recent 4 documents
  const recentDocs = [...docs]
    .sort((a, b) => b.id.localeCompare(a.id)) // mock sort by id desc
    .slice(0, 4)

  // Recent 3 chat sessions
  const recentSessions = [...sessions].slice(0, 3)

  // Handlers
  const handleDocClick = (id: string) => {
    selectDoc(id)
    navigate('/app/documents')
  }

  const handleSessionClick = (id: string) => {
    selectSession(id)
    navigate('/app/student/chat')
  }

  const handleStartNewChat = async () => {
    await addSession()
    navigate('/app/student/chat')
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface-elevated/40 p-6 md:p-8 backdrop-blur-md shadow-soft">
        {/* Colorful gradient blurs in background for premium glow */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3 animate-pulse" />
              {formattedDate}
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {getGreeting()}, {user?.name || 'Scholar'}! 👋
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Welcome back to your study workspace. Upload documents, generate quizzes, and use AI to accelerate your learning.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button
              variant="gradient"
              size="lg"
              onClick={openUploadModal}
              icon={<Upload className="h-4 w-4" />}
            >
              Upload Material
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="responsive" className="backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Documents</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{totalDocs}</span>
            <span className="text-xs text-muted-foreground">{readyDocs} ready</span>
          </div>
          <p className="mt-2 text-2xs text-muted-foreground">PDFs, videos, and website URLs</p>
        </Card>

        <Card padding="responsive" className="backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Quota Limit</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{tokensPercent}%</span>
            <span className="text-xs text-muted-foreground">{tokensUsed.toLocaleString()} / {tokensTotal.toLocaleString()} tokens</span>
          </div>
          <div className="mt-3.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${tokensPercent}%` }}
            />
          </div>
        </Card>

        <Card padding="responsive" className="backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cloud Storage</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{storagePercent}%</span>
            <span className="text-xs text-muted-foreground">{storageUsed.toFixed(1)} / {storageTotal} MB</span>
          </div>
          <div className="mt-3.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-success transition-all duration-500"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </Card>

        <Card padding="responsive" className="backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Sessions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{activeSessions}</span>
            <span className="text-xs text-muted-foreground">active chats</span>
          </div>
          <p className="mt-2 text-2xs text-muted-foreground">Interactive text and citation maps</p>
        </Card>
      </div>

      {/* Quick Actions (Large Cards) */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Action 1: Upload */}
          <div
            onClick={openUploadModal}
            className="group cursor-pointer rounded-2xl border border-border/40 bg-surface-elevated/40 p-5 backdrop-blur-sm shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                Upload Materials
                <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-2xs text-muted-foreground mt-1">Add PDF, video, audio, or webpage links.</p>
            </div>
          </div>

          {/* Action 2: Chat */}
          <div
            onClick={handleStartNewChat}
            className="group cursor-pointer rounded-2xl border border-border/40 bg-surface-elevated/40 p-5 backdrop-blur-sm shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                AI Assistant
                <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-2xs text-muted-foreground mt-1">Start a conversation with AI about documents.</p>
            </div>
          </div>

          {/* Action 3: Quiz */}
          <div
            onClick={() => navigate('/app/quiz')}
            className="group cursor-pointer rounded-2xl border border-border/40 bg-surface-elevated/40 p-5 backdrop-blur-sm shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500 group-hover:scale-110 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                Generate Quizzes
                <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-2xs text-muted-foreground mt-1">Test your knowledge with custom questions.</p>
            </div>
          </div>

          {/* Action 4: Flashcards */}
          <div
            onClick={() => navigate('/app/flashcards')}
            className="group cursor-pointer rounded-2xl border border-border/40 bg-surface-elevated/40 p-5 backdrop-blur-sm shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                Study Flashcards
                <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-2xs text-muted-foreground mt-1">Create smart decks for active recall.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Panels */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Documents Section */}
        <div className="lg:col-span-3 rounded-2xl border border-border/50 bg-surface-elevated/40 p-6 backdrop-blur-sm shadow-soft flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Documents
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/documents')}
              iconRight={<ChevronRight className="h-4 w-4" />}
            >
              View All
            </Button>
          </div>

          <div className="flex-1 space-y-2.5">
            {recentDocs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                <FileQuestion className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-semibold text-foreground">No documents uploaded</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                  Add study materials to start using AI tools.
                </p>
                <Button variant="outline" size="sm" onClick={openUploadModal} className="mt-4">
                  Upload PDF
                </Button>
              </div>
            ) : (
              recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocClick(doc.id)}
                  className="group flex items-center gap-3 rounded-xl border border-border/40 bg-surface-elevated/60 p-3 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all duration-200"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                    {fileIconEmoji(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-2xs text-muted-foreground mt-0.5">{doc.size}</p>
                  </div>
                  <Badge
                    variant={
                      doc.status === 'ready'
                        ? 'success'
                        : doc.status === 'processing'
                        ? 'warning'
                        : 'error'
                    }
                    label={doc.status}
                    dot
                  />
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Chat Sessions Section */}
        <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-surface-elevated/40 p-6 backdrop-blur-sm shadow-soft flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Recent Chats
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/student/chat')}
              iconRight={<ChevronRight className="h-4 w-4" />}
            >
              View All
            </Button>
          </div>

          <div className="flex-1 space-y-2.5">
            {recentSessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-semibold text-foreground">No chat history</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Start a chat session with your AI buddy.
                </p>
                <Button variant="outline" size="sm" onClick={handleStartNewChat} className="mt-4">
                  New Chat
                </Button>
              </div>
            ) : (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className="group flex flex-col gap-1 rounded-xl border border-border/40 bg-surface-elevated/60 p-3.5 hover:border-accent/30 hover:bg-accent/5 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors">
                      {session.title || 'Untitled Session'}
                    </p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {session.preview || 'No messages in this chat session yet.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
