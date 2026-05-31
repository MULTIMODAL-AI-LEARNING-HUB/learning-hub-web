import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Progress } from '../ui/Progress'
import type { DocumentItem } from '../../types'

const fileIcon = (type: string) => {
  if (type === 'pdf') return '📄'
  if (type === 'video') return '🎬'
  if (type === 'audio') return '🎧'
  return '🔗'
}

const navItems = [
  { id: 'documents', label: 'Documents', icon: '📚', path: '/app/documents' },
  { id: 'chat', label: 'AI Chat', icon: '💬', path: '/app/chat' },
  { id: 'quiz', label: 'Quiz Generator', icon: '📝', path: '/app/quiz' },
  { id: 'flashcards', label: 'Flashcards', icon: '🃏', path: '/app/flashcards' },
  { id: 'essay', label: 'Essay Grading', icon: '✍️', path: '/app/essay' }
]

function DocumentCard({ doc, isSelected, onSelect }: { doc: DocumentItem; isSelected: boolean; onSelect: () => void }) {
  const retry = useAppStore((s) => s.documents.retry)
  const toast = useAppStore((s) => s.toasts.add)

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border px-3 py-2.5 text-sm transition cursor-pointer ${
        isSelected
          ? 'border-accent bg-accentSoft shadow-soft'
          : 'border-border bg-white hover:border-accent/40'
      }`}
    >
      <div className="flex items-center gap-2 text-ink">
        <span className="text-base">{fileIcon(doc.type)}</span>
        <p className="truncate flex-1">{doc.name}</p>
      </div>
      <div className="mt-1.5 text-xs text-inkMute">
        {doc.status === 'processing' && (
          <div className="space-y-1.5">
            <Progress value={doc.progress ?? 0} variant="accent" />
            <p>Processing • {doc.progress}%</p>
          </div>
        )}
        {doc.status === 'ready' && <p className="text-success">✓ Ready • {doc.pageCount} pages</p>}
        {doc.status === 'failed' && (
          <div className="flex items-center justify-between">
            <p className="text-danger">✕ Failed</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                retry(doc.id)
                toast({ type: 'info', title: 'Retrying...', message: `${doc.name}` })
              }}
              className="text-accent underline transition hover:text-accent/80"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

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
  const toasts = useAppStore((s) => s.toasts.add)

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto">
      {/* Profile */}
      <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-3">
        <Avatar fallback={user.initials} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
          <p className="text-xs text-inkMute">{user.role}</p>
        </div>
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="text-xs text-inkMute transition hover:text-danger"
          title="Logout"
        >
          ⏻
        </button>
      </div>

      {/* Upload Button */}
      <Button onClick={openUpload} variant="outline" size="sm" className="w-full" icon="＋">
        Upload Document
      </Button>

      {/* Navigation */}
      <nav className="mt-2 grid gap-0.5">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path)
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                active
                  ? 'bg-accent text-white shadow-soft'
                  : 'text-inkSoft hover:bg-surface hover:text-ink'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Documents (only show on documents route) */}
      {location.pathname.startsWith('/app/documents') && (
        <section className="mt-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-inkMute">
            <span>My Documents</span>
            <span>{docs.length}</span>
          </div>
          <div className="mt-2 grid gap-2">
            {docs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                isSelected={selectedDocId === doc.id}
                onSelect={() => selectDoc(doc.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Chat Sessions (only show on chat route) */}
      {location.pathname.startsWith('/app/chat') && (
        <section className="mt-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-inkMute">
            <span>Sessions</span>
            <button
              onClick={() => {
                addSession()
                toasts({ type: 'success', title: 'New session created' })
              }}
              className="text-accent transition hover:text-accent/80"
            >
              + New
            </button>
          </div>
          <div className="mt-2 grid gap-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={`rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  activeSessionId === s.id
                    ? 'bg-accentSoft border border-accent/30 text-ink'
                    : 'bg-surface text-inkSoft hover:bg-surfaceDeep'
                }`}
              >
                <p className="font-medium truncate">{s.title}</p>
                <p className="mt-0.5 text-xs text-inkMute truncate">{s.preview || 'No messages yet'}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex-1" />

      {/* Logout */}
      <button
        onClick={() => {
          logout()
          navigate('/login')
        }}
        className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-inkMute transition hover:bg-surface hover:text-danger"
      >
        <span>⏻</span> Log out
      </button>
    </div>
  )
}
