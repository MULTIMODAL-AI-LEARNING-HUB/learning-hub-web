/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Hash,
  MessageCircle,
  MessageSquarePlus,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { socialChatApi, type SocialChatMessage, type SocialChatRoom, type SocialChatUser } from '../../services/api'
import { useAppStore } from '../../stores/appStore'
import { cn } from '../../utils/cn'

const MESSAGE_POLL_MS = 3000

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
}

function displayUserName(user: SocialChatUser) {
  return user.full_name || user.email
}

export function StudentSocialChat() {
  const currentUserId = useAppStore((state) => state.auth.user?.id)
  const [rooms, setRooms] = useState<SocialChatRoom[]>([])
  const [messages, setMessages] = useState<SocialChatMessage[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState<SocialChatUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<SocialChatUser[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true)
    try {
      const res = await socialChatApi.listRooms()
      setRooms(res.data.items)
      setSelectedRoomId((current) => current || res.data.items[0]?.id || null)
      setError(null)
    } catch {
      setError('Unable to load chats.')
    } finally {
      setRoomsLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (roomId: string, silent = false) => {
    if (!silent) setMessagesLoading(true)
    try {
      const res = await socialChatApi.listMessages(roomId)
      setMessages(res.data.items)
      setError(null)
    } catch {
      if (!silent) setError('Unable to load messages.')
    } finally {
      if (!silent) setMessagesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([])
      return
    }

    loadMessages(selectedRoomId)
    const interval = window.setInterval(() => loadMessages(selectedRoomId, true), MESSAGE_POLL_MS)
    return () => window.clearInterval(interval)
  }, [loadMessages, selectedRoomId])

  useEffect(() => {
    let cancelled = false
    const trimmed = userQuery.trim()
    if (!trimmed) {
      setUserResults([])
      return
    }

    const timer = window.setTimeout(() => {
      socialChatApi.searchUsers(trimmed)
        .then((res) => {
          if (!cancelled) setUserResults(res.data)
        })
        .catch(() => {
          if (!cancelled) setUserResults([])
        })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [userQuery])

  const filteredRooms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return rooms
    return rooms.filter((room) =>
      [room.name, room.description, room.last_message].some((value) => value?.toLowerCase().includes(normalizedQuery))
    )
  }, [query, rooms])

  const createGroup = async () => {
    const name = groupName.trim()
    if (!name) return

    setCreating(true)
    try {
      const res = await socialChatApi.createRoom({
        name,
        description: groupDescription.trim() || undefined,
        member_ids: selectedUsers.map((user) => user.id),
      })
      setRooms((current) => [res.data, ...current.filter((room) => room.id !== res.data.id)])
      setSelectedRoomId(res.data.id)
      setMessages([])
      setGroupName('')
      setGroupDescription('')
      setUserQuery('')
      setUserResults([])
      setSelectedUsers([])
      setCreateOpen(false)
      setError(null)
    } catch {
      setError('Unable to create group.')
    } finally {
      setCreating(false)
    }
  }

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !selectedRoom) return

    setSending(true)
    try {
      const res = await socialChatApi.sendMessage(selectedRoom.id, content)
      setMessages((current) => [...current.filter((message) => message.id !== res.data.id), res.data])
      setRooms((current) =>
        current.map((room) =>
          room.id === selectedRoom.id
            ? { ...room, last_message: res.data.content, updated_at: res.data.created_at }
            : room
        ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      )
      setDraft('')
      setError(null)
    } catch {
      setError('Message was not sent.')
    } finally {
      setSending(false)
    }
  }

  const toggleSelectedUser = (user: SocialChatUser) => {
    setSelectedUsers((current) =>
      current.some((item) => item.id === user.id)
        ? current.filter((item) => item.id !== user.id)
        : [...current, user]
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="primary" label="Student community" dot />
            <Badge variant="success" label="Realtime polling" />
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

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid min-h-[calc(100vh-15rem)] overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-soft lg:grid-cols-[22rem_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Messages</h2>
                <p className="text-xs text-muted-foreground">{rooms.length} conversations</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={loadRooms} aria-label="Refresh chats">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCreateOpen(true)} aria-label="Create group">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Input value={query} onChange={setQuery} placeholder="Search people or groups..." prefixIcon={<Search />} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {roomsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <EmptyState
                compact
                icon={<Users />}
                title={rooms.length === 0 ? 'No chats yet' : 'No matching chats'}
                description={rooms.length === 0 ? 'Create a group to start a study conversation.' : 'Try a different search keyword.'}
                action={rooms.length === 0 ? <Button size="sm" onClick={() => setCreateOpen(true)}>Create group</Button> : null}
              />
            ) : (
              <div className="space-y-1">
                {filteredRooms.map((room) => (
                  <ThreadButton key={room.id} room={room} active={room.id === selectedRoomId} onClick={() => setSelectedRoomId(room.id)} />
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-h-[36rem] min-w-0 flex-col">
          {selectedRoom ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar fallback="#" size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-semibold text-foreground">{selectedRoom.name}</h2>
                      <Badge variant="primary" label="Group" />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedRoom.member_count} member{selectedRoom.member_count === 1 ? '' : 's'} · {selectedRoom.description || 'No description'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" aria-label="Invite members" title="Invite members" onClick={() => setCreateOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="More options" title="More options">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-muted/10 p-4">
                {messagesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-2/3 rounded-2xl" />
                    <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <EmptyState compact icon={<MessageCircle />} title="Start the conversation" description="Messages are saved and visible to members of this group." />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const mine = message.sender_id === currentUserId
                      const name = message.sender_name || message.sender_role || 'Member'
                      return (
                        <div key={message.id} className={cn('flex gap-3', mine && 'justify-end')}>
                          {!mine && <Avatar src={message.sender_avatar_url || undefined} fallback={getInitials(name)} size="sm" />}
                          <div className={cn('max-w-[75%]', mine && 'text-right')}>
                            <div className={cn('mb-1 flex items-center gap-2 text-xs text-muted-foreground', mine && 'justify-end')}>
                              <span>{mine ? 'You' : name}</span>
                              <span>{formatTime(message.created_at)}</span>
                            </div>
                            <div className={cn('rounded-2xl px-3 py-2 text-sm leading-relaxed', mine ? 'bg-primary text-primary-foreground' : 'border border-border bg-surface-elevated text-foreground')}>
                              {message.content}
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
                    placeholder={`Message ${selectedRoom.name}...`}
                    rows={1}
                    maxLength={2000}
                    className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        event.currentTarget.form?.requestSubmit()
                      }
                    }}
                  />
                  <Button type="submit" size="icon" disabled={!draft.trim() || sending} loading={sending} aria-label="Send message">
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
                <p className="mt-2 text-sm text-muted-foreground">Select a chat from the sidebar or create a group for classmates and study partners.</p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button onClick={() => setCreateOpen(true)} icon={<Users className="h-4 w-4" />}>Create group</Button>
                  <Button variant="outline" disabled icon={<ShieldCheck className="h-4 w-4" />}>Stored in API</Button>
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
        description="Create a persistent group chat and invite classmates."
        footer={(
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createGroup} disabled={!groupName.trim() || creating} loading={creating} icon={<Hash className="h-4 w-4" />}>Create group</Button>
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
            <textarea value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} placeholder="What is this group for?" rows={3} className="w-full resize-none rounded-md border border-input bg-surface-elevated px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Invite members</label>
            <Input value={userQuery} onChange={setUserQuery} placeholder="Search by name or email..." prefixIcon={<Search />} />
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <button key={user.id} onClick={() => toggleSelectedUser(user)} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {displayUserName(user)}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
            {userResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                {userResults.map((user) => {
                  const selected = selectedUsers.some((item) => item.id === user.id)
                  return (
                    <button key={user.id} onClick={() => toggleSelectedUser(user)} className={cn('flex w-full items-center gap-3 p-3 text-left transition hover:bg-muted/60', selected && 'bg-primary/10')}>
                      <Avatar src={user.avatar_url || undefined} fallback={getInitials(displayUserName(user))} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{displayUserName(user)}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      {selected && <Badge variant="primary" label="Added" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ThreadButton({ room, active, onClick }: { room: SocialChatRoom; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-xl p-3 text-left transition', active ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/60')}>
      <Avatar fallback="#" size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{room.name}</p>
          <span className="shrink-0 text-[11px] text-muted-foreground">{formatTime(room.updated_at)}</span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{room.last_message || room.description || `${room.member_count} members`}</p>
      </div>
    </button>
  )
}
