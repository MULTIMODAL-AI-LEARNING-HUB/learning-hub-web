/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Edit2, Plus, Save, StickyNote, Trash2 } from 'lucide-react'
import { notesApi, type Note } from '../../../services/api'
import { Button } from '../../../components/ui/Button'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../components/ui/useToast'
import { cn } from '../../../utils/cn'

interface NotesPanelProps {
  courseId: string
  lessonId?: string
  lessonTitle?: string
}

export function NotesPanel({ courseId, lessonId, lessonTitle }: NotesPanelProps) {
  const toast = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    notesApi.list({ course_id: courseId, ...(lessonId ? { lesson_id: lessonId } : {}) })
      .then(res => setNotes(res.data))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [courseId, lessonId])

  const handleCreate = async () => {
    if (!newContent.trim()) return
    setSaving(true)
    try {
      const res = await notesApi.create({ course_id: courseId, lesson_id: lessonId, content: newContent.trim() })
      setNotes(prev => [res.data, ...prev])
      setNewContent('')
      toast({ type: 'success', title: 'Đã lưu ghi chú' })
    } catch {
      toast({ type: 'error', title: 'Không thể lưu ghi chú' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return
    try {
      const res = await notesApi.update(noteId, { content: editContent.trim() })
      setNotes(prev => prev.map(n => n.id === noteId ? res.data : n))
      setEditingId(null)
      toast({ type: 'success', title: 'Đã cập nhật ghi chú' })
    } catch {
      toast({ type: 'error', title: 'Không thể cập nhật ghi chú' })
    }
  }

  const handleDelete = async (noteId: string) => {
    if (deletingId !== noteId) { setDeletingId(noteId); return }
    try {
      await notesApi.delete(noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
      setDeletingId(null)
      toast({ type: 'success', title: 'Đã xóa ghi chú' })
    } catch {
      toast({ type: 'error', title: 'Không thể xóa ghi chú' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <StickyNote className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">
          Ghi chú cá nhân{lessonTitle ? ` – ${lessonTitle}` : ''}
        </h3>
      </div>

      {/* New note composer */}
      <div className="space-y-2">
        <textarea
          className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          rows={3}
          placeholder="Nhập ghi chú nhanh khi đang xem bài giảng..."
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCreate() }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Nhấn Ctrl+Enter để lưu nhanh</span>
          <Button
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={handleCreate}
            loading={saving}
            disabled={!newContent.trim()}
          >
            Lưu ghi chú
          </Button>
        </div>
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2 p-3 rounded-lg border border-border">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="py-8 text-center">
          <StickyNote className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chưa có ghi chú nào cho bài học này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="group rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              {editingId === note.id ? (
                <>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={3}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Hủy</Button>
                    <Button size="sm" icon={<Save className="h-3.5 w-3.5" />} onClick={() => handleSaveEdit(note.id)}>Lưu</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.updated_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
                        onClick={() => handleEdit(note)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className={cn(
                          'p-1 rounded transition',
                          deletingId === note.id
                            ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                            : 'hover:bg-muted text-muted-foreground hover:text-destructive'
                        )}
                        onClick={() => handleDelete(note.id)}
                        title={deletingId === note.id ? 'Nhấn lần nữa để xác nhận xóa' : 'Xóa'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
