import { useState } from 'react'
import { useDiscussions } from '../../hooks/useDiscussions'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { MessageSquare, ThumbsUp, User, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  lessonId: string
}

export function DiscussionPanel({ lessonId }: Props) {
  const {
    discussions, loading, fetchDiscussions,
    createDiscussion, upvote,
  } = useDiscussions(lessonId)
  const [newContent, setNewContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  useState(() => { fetchDiscussions() })

  const handlePost = async () => {
    if (!newContent.trim()) return
    setSubmitting(true)
    try {
      await createDiscussion(newContent.trim())
      setNewContent('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return
    setSubmitting(true)
    try {
      await createDiscussion(replyContent.trim(), parentId)
      setReplyContent('')
      setReplyTo(null)
      setExpandedReplies(prev => new Set(prev).add(parentId))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleReplies = (id: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading && discussions.length === 0) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Discussions
      </h3>

      <div className="space-y-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Start a discussion..."
          className="w-full min-h-[60px] rounded-lg border border-input bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex justify-end">
          <Button onClick={handlePost} disabled={submitting || !newContent.trim()} size="sm">
            {submitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>

      {discussions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No discussions yet. Start one!</p>
      ) : (
        <div className="space-y-3">
          {discussions.map((discussion) => {
            const hasReplies = discussion.replies && discussion.replies.length > 0
            const repliesExpanded = expandedReplies.has(discussion.id)

            return (
              <Card key={discussion.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{discussion.user_name || 'Anonymous'}</span>
                      {discussion.is_pinned && <span className="text-xs text-warning font-medium">Pinned</span>}
                      <span className="text-xs text-muted-foreground">{new Date(discussion.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{discussion.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => upvote(discussion.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        {discussion.upvotes}
                      </button>
                      <button
                        onClick={() => setReplyTo(replyTo === discussion.id ? null : discussion.id)}
                        className="text-xs text-muted-foreground hover:text-primary transition"
                      >
                        Reply
                      </button>
                      {hasReplies && (
                        <button
                          onClick={() => toggleReplies(discussion.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
                        >
                          {repliesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {discussion.replies.length} {discussion.replies.length === 1 ? 'reply' : 'replies'}
                        </button>
                      )}
                    </div>

                    {replyTo === discussion.id && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="w-full min-h-[50px] rounded-lg border border-input bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => { setReplyTo(null); setReplyContent('') }}>Cancel</Button>
                          <Button size="sm" onClick={() => handleReply(discussion.id)} disabled={submitting || !replyContent.trim()}>
                            {submitting ? 'Replying...' : 'Reply'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {hasReplies && repliesExpanded && (
                      <div className="mt-3 space-y-2 pl-4 border-l-2 border-border">
                        {discussion.replies.map((reply: any) => (
                          <div key={reply.id} className="flex items-start gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                              {reply.user_name?.[0] || '?'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{reply.user_name || 'Anonymous'}</span>
                                <span className="text-2xs text-muted-foreground">{new Date(reply.created_at).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
