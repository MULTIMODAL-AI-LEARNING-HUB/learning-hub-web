import { useMemo, useState, type FormEvent } from 'react'
import {
  Hash,
  MessageCircle,
  MessageSquarePlus,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useAppStore } from '../../stores/appStore'
import { cn } from '../../utils/cn'

type ChatKind = 'direct' | 'group'

interface SocialMessage {
  id: string
  author: string
  authorInitials: string
  content: string
  createdAt: Date
  mine?: boolean
}

interface SocialThread {
  id: string
  name: string
  kind: ChatKind
  description?: string
  memberCount: number
  messages: SocialMessage[]
  updatedAt: Date
}

function formatTime(value: Date) {
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function StudentSocialChat() {
  const currentUser = useAppStore((state) => state.auth.user)
  const [threads, setThreads] = useState<SocialThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? null

  const filteredThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return threads
    return threads.filter((thread) =>
      [thread.name, thread.description].some((value) => value?.toLowerCase().includes(normalizedQuery))
    )
  }, [query, threads])

  const createGroup = () => {
    const name = groupName.trim()
    if (!name) return

    const nextThread: SocialThread = {
      id: crypto.randomUUID(),
      name,
      kind: 'group',
      description: groupDescription.trim() || 'Student group chat',
      memberCount: 1,
      messages: [],
      updatedAt: new Date(),
    }

    setThreads((current) => [nextThread, ...current])
    setSelectedThreadId(nextThread.id)
    setGroupName('')
    setGroupDescription('')
    setCreateOpen(false)
  }

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !selectedThread) return

    const message: SocialMessage = {
      id: crypto.randomUUID(),
      author: currentUser?.name || 'You',
      authorInitials: currentUser?.initials || getInitials(currentUser?.name || 'You'),
      content,
      createdAt: new Date(),
      mine: true,
    }

    setThreads((current) =>
      current.map((thread) =>
        thread.id === selectedThread.id
          ? { ...thread, messages: [...thread.messages, message], updatedAt: new Date() }
          : thread
      )
    )
    setDraft('')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="primary" label="Student community" dot />
            <Badge variant="outline" label="UI ready" />
          </div>
          <h1 className="text-fluid-2xl font-semibold tracking-tight text-foreground">Friends Chat</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Chat with classmates, create study groups, and keep course conversations separate from AI chat.
          </p>
        </div>
        <Button icon={<MessageSquarePlus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
          Create group
        </Button>
      </div>

      <div className="grid min-h-[calc(100vh-15rem)] overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-soft lg:grid-cols-[22rem_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Messages</h2>
                <p className="text-xs text-muted-foreground">{threads.length} conversations</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCreateOpen(true)} aria-label="Create group">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={query}
              onChange={setQuery}
              placeholder="Search people or groups..."
              prefixIcon={<Search />}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {filteredThreads.length === 0 ? (
              <EmptyState
                compact
                icon={<Users />}
                title={threads.length === 0 ? 'No chats yet' : 'No matching chats'}
                description={threads.length === 0 ? 'Create a group to start a study conversation.' : 'Try a different search keyword.'}
                action={threads.length === 0 ? <Button size="sm" onClick={() => setCreateOpen(true)}>Create group</Button> : null}
              />
            ) : (
              <div className="space-y-1">
                {filteredThreads.map((thread) => (
                  <ThreadButton
                    key={thread.id}
                    thread={thread}
                    active={thread.id === selectedThreadId}
                    onClick={() => setSelectedThreadId(thread.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-h-[36rem] min-w-0 flex-col">
          {selectedThread ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar fallback={selectedThread.kind === 'group' ? '#' : getInitials(selectedThread.name)} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-semibold text-foreground">{selectedThread.name}</h2>
                      <Badge variant={selectedThread.kind === 'group' ? 'primary' : 'info'} label={selectedThread.kind === 'group' ? 'Group' : 'Direct'} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedThread.memberCount} member{selectedThread.memberCount === 1 ? '' : 's'} · {selectedThread.description || 'No description'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" aria-label="Invite members" title="Invite members">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="More options" title="More options">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-muted/10 p-4">
                {selectedThread.messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <EmptyState
                      compact
                      icon={<MessageCircle />}
                      title="Start the conversation"
                      description="Messages you send here are kept in this browser session until the social chat API is connected."
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedThread.messages.map((message) => (
                      <div key={message.id} className={cn('flex gap-3', message.mine && 'justify-end')}>
                        {!message.mine && <Avatar fallback={message.authorInitials} size="sm" />}
                        <div className={cn('max-w-[75%]', message.mine && 'text-right')}>
                          <div className={cn('mb-1 flex items-center gap-2 text-xs text-muted-foreground', message.mine && 'justify-end')}>
                            <span>{message.mine ? 'You' : message.author}</span>
                            <span>{formatTime(message.createdAt)}</span>
                          </div>
                          <div className={cn(
                            'rounded-2xl px-3 py-2 text-sm leading-relaxed',
                            message.mine ? 'bg-primary text-primary-foreground' : 'border border-border bg-surface-elevated text-foreground'
                          )}>
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={sendMessage} className="border-t border-border p-4">
                <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2">
                  <Button variant="ghost" size="icon" type="button" aria-label="Emoji">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Message ${selectedThread.name}...`}
                    rows={1}
                    className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        event.currentTarget.form?.requestSubmit()
                      }
                    }}
                  />
                  <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send message">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-foreground">Choose a conversation</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select a chat from the sidebar or create a group for classmates and study partners.
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button onClick={() => setCreateOpen(true)} icon={<Users className="h-4 w-4" />}>
                    Create group
                  </Button>
                  <Button variant="outline" disabled icon={<ShieldCheck className="h-4 w-4" />}>
                    Backend API needed
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create study group"
        description="Set up a group space for classmates. This UI is ready for a realtime chat API."
        footer={(
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createGroup} disabled={!groupName.trim()} icon={<Hash className="h-4 w-4" />}>
              Create group
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Group name</label>
            <Input value={groupName} onChange={setGroupName} placeholder="Example: HSK 1 study group" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.target.value)}
              placeholder="What is this group for?"
              rows={4}
              className="w-full resize-none rounded-md border border-input bg-surface-elevated px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ThreadButton({ thread, active, onClick }: { thread: SocialThread; active: boolean; onClick: () => void }) {
  const latestMessage = thread.messages.at(-1)

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl p-3 text-left transition',
        active ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/60'
      )}
    >
      <Avatar fallback={thread.kind === 'group' ? '#' : getInitials(thread.name)} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{thread.name}</p>
          <span className="shrink-0 text-[11px] text-muted-foreground">{formatTime(thread.updatedAt)}</span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {latestMessage ? latestMessage.content : thread.description || `${thread.memberCount} members`}
        </p>
      </div>
    </button>
  )
}
