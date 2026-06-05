import { useNavigate, useLocation } from 'react-router-dom'
import {
  FileText,
  MessageSquare,
  BookOpen,
  Layers,
  PenLine,
  Settings,
  Upload,
  Plus,
  LogOut,
  Sparkles,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Tabs } from '../ui/Tabs'
import { DocumentCard } from '../../features/documents/DocumentCard'
import { useToast } from '../ui/useToast'
import { Tooltip } from '../ui/Tooltip'
import { cn } from '../../utils/cn'

const navItems = [
  { id: 'documents', label: 'Documents', icon: FileText, path: '/app/documents' },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare, path: '/app/chat' },
  { id: 'quiz', label: 'Quiz', icon: BookOpen, path: '/app/quiz' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, path: '/app/flashcards' },
  { id: 'essay', label: 'Essay', icon: PenLine, path: '/app/essay' }
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppStore((s) => s.auth.user)
  const logout = useAppStore((s) => s.auth.logout)
  const docs = useAppStore((s) => s.documents.items)
  const selectedDocId = useAppStore((s) => s.documents.selectedId)
  const selectDoc = useAppStore((s) => s.documents.select)
  const sessions = useAppStore((s) => s.chat.sessions)
  const activeSessionId = useAppStore((s) => s.chat.activeSessionId)
  const selectSession = useAppStore((s) => s.chat.selectSession)
  const addSession = useAppStore((s) => s.chat.addSession)
  const openUpload = useAppStore((s) => s.ui.openUploadModal)
  const toast = useToast()

  const showAdmin = user?.role === 'admin'
  const activePath = location.pathname
  const isDocumentsRoute = activePath.startsWith('/app/documents')
  const isChatRoute = activePath.startsWith('/app/chat')

  const tabValue = isDocumentsRoute ? 'docs' : isChatRoute ? 'sessions' : null

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto scrollbar-thin">
      {/* Brand + Collapse */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-soft">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-display font-semibold text-foreground truncate">
              Learning Hub
            </p>
            <p className="text-2xs text-muted-foreground truncate">AI Study Workspace</p>
          </div>
        </div>
        <Tooltip content="Collapse sidebar" side="bottom">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => useAppStore.getState().ui.toggleSidebar()}
            className="hidden lg:flex h-7 w-7"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      {/* Profile Card */}
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 p-2.5">
        <Avatar fallback={user.initials} size="md" status="online" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
        </div>
      </div>

      {/* Upload Button */}
      <Button
        onClick={openUpload}
        variant="primary"
        size="md"
        icon={<Upload className="h-4 w-4" />}
        className="w-full"
        fullWidth
      >
        Upload Document
      </Button>

      {/* Main Navigation */}
      <nav className="grid gap-0.5">
        {navItems.map((item) => {
          const active = activePath.startsWith(item.path)
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition',
                active
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-foreground/80 hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
            </button>
          )
        })}
        {showAdmin && (
          <button
            onClick={() => navigate('/app/admin')}
            className={cn(
              'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition',
              activePath.startsWith('/app/admin')
                ? 'bg-primary text-primary-foreground shadow-soft'
                : 'text-foreground/80 hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">Admin Panel</span>
          </button>
        )}
      </nav>

      {/* Contextual Tabs: Documents / Sessions */}
      {tabValue && (
        <div className="mt-2">
          <Tabs defaultValue={tabValue} className="w-full">
            <Tabs.List className="w-full">
              {isDocumentsRoute && (
                <Tabs.Trigger value="docs" icon={<FileText className="h-3.5 w-3.5" />} count={docs.length} className="flex-1 justify-center">
                  Documents
                </Tabs.Trigger>
              )}
              {isChatRoute && (
                <Tabs.Trigger value="sessions" icon={<MessageSquare className="h-3.5 w-3.5" />} count={sessions.length} className="flex-1 justify-center">
                  Sessions
                </Tabs.Trigger>
              )}
            </Tabs.List>
            {isDocumentsRoute && (
              <Tabs.Content value="docs" className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                {docs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No documents yet
                  </p>
                ) : (
                  docs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      isSelected={selectedDocId === doc.id}
                      onSelect={() => selectDoc(doc.id)}
                      variant="compact"
                    />
                  ))
                )}
              </Tabs.Content>
            )}
            {isChatRoute && (
              <Tabs.Content value="sessions" className="space-y-1 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                {sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No sessions yet
                  </p>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        addSession()
                        toast({ type: 'success', title: 'New session created' })
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New session
                    </button>
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => selectSession(s.id)}
                        className={cn(
                          'w-full rounded-lg px-2.5 py-2 text-left text-xs transition',
                          activeSessionId === s.id
                            ? 'bg-primary/10 border border-primary/30 text-foreground'
                            : 'text-foreground/80 hover:bg-muted'
                        )}
                      >
                        <p className="font-medium truncate">{s.title}</p>
                        <p className="mt-0.5 text-2xs text-muted-foreground truncate">
                          {s.preview || 'No messages yet'}
                        </p>
                      </button>
                    ))}
                  </>
                )}
              </Tabs.Content>
            )}
          </Tabs>
        </div>
      )}

      <div className="flex-1 min-h-2" />

      {/* Logout */}
      <button
        onClick={() => {
          logout()
          navigate('/login')
        }}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        <span>Log out</span>
      </button>
    </div>
  )
}

export function SidebarCollapseButton() {
  return (
    <Tooltip content="Open sidebar" side="right">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => useAppStore.getState().ui.toggleSidebar()}
        className="h-7 w-7"
        aria-label="Open sidebar"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>
    </Tooltip>
  )
}
