import { useState, useEffect, useRef } from 'react'
import { Video, FileText, HelpCircle, ClipboardList, X, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Switch } from '../../components/ui/Switch'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { useLessons, useLessonAttachments } from '../../hooks/useLessons'
import type { Lesson } from '../../services/api'

interface LessonEditorProps {
  courseId: string
  sectionId: string
  lesson: Lesson | null
  isOpen: boolean
  onClose: () => void
  onOpenQuiz: (lessonId: string) => void
  onOpenAssignment: (lessonId: string) => void
}

export function LessonEditor({
  sectionId,
  lesson,
  isOpen,
  onClose,
  onOpenQuiz,
  onOpenAssignment,
}: LessonEditorProps) {
  const { updateLesson, deleteLesson } = useLessons(sectionId)
  const { attachments, fetchAttachments, addAttachment, deleteAttachment } = useLessonAttachments(sectionId, lesson?.id || '')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoDuration, setVideoDuration] = useState<number | undefined>()
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (isOpen && lesson) {
      fetchAttachments()
      initializedRef.current = false
    }
  }, [isOpen, lesson, fetchAttachments])

  useEffect(() => {
    if (lesson && !initializedRef.current) {
      setTitle(lesson.title)
      setDescription(lesson.description || '')
      setVideoUrl(lesson.video_url || '')
      setVideoDuration(lesson.video_duration || undefined)
      setContent(lesson.content || '')
      setIsPreview(lesson.is_preview)
      setIsActive(lesson.is_active)
      initializedRef.current = true
    }
  }, [lesson])

  if (!isOpen || !lesson) return null

  const handleSave = async () => {
    await updateLesson(lesson.id, {
      title,
      description,
      video_url: videoUrl || undefined,
      video_duration: videoDuration,
      content: content || undefined,
      is_preview: isPreview,
      is_active: isActive,
    })
    onClose()
  }

  const handleDelete = async () => {
    await deleteLesson(lesson.id)
    setShowDeleteModal(false)
    onClose()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="h-5 w-5 text-primary" />
      case 'ARTICLE': return <FileText className="h-5 w-5 text-success" />
      case 'QUIZ': return <HelpCircle className="h-5 w-5 text-accent" />
      case 'ASSIGNMENT': return <ClipboardList className="h-5 w-5 text-warning" />
      default: return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            {getTypeIcon(lesson.type)}
            <h2 className="text-lg font-semibold text-foreground truncate">Edit Lesson</h2>
            <Badge variant="outline" label={lesson.type} />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input value={title} onChange={setTitle} className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={2} />
          </div>

          {lesson.type === 'VIDEO' && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Video URL</label>
                <Input
                  value={videoUrl}
                  onChange={setVideoUrl}
                  placeholder="https://youtube.com/..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Duration (seconds)</label>
                <Input
                  type="number"
                  value={videoDuration || ''}
                  onChange={(v) => setVideoDuration(parseInt(v) || undefined)}
                  className="mt-1 w-32"
                />
              </div>
            </>
          )}

          {lesson.type === 'ARTICLE' && (
            <div>
              <label className="text-sm font-medium text-foreground">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1"
                rows={10}
                placeholder="Write your lesson content here..."
              />
            </div>
          )}

          {lesson.type === 'QUIZ' && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-medium text-foreground">Quiz Attached</h4>
                  <p className="text-sm text-muted-foreground">
                    {lesson.has_quiz ? 'This lesson has a quiz' : 'No quiz yet'}
                  </p>
                </div>
                <Button onClick={() => onOpenQuiz(lesson.id)} variant="secondary" size="sm" fullWidthMobile>
                  {lesson.has_quiz ? 'Edit Quiz' : 'Create Quiz'}
                </Button>
              </div>
            </div>
          )}

          {lesson.type === 'ASSIGNMENT' && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-medium text-foreground">Assignment Attached</h4>
                  <p className="text-sm text-muted-foreground">
                    {lesson.has_assignment ? 'This lesson has an assignment' : 'No assignment yet'}
                  </p>
                </div>
                <Button onClick={() => onOpenAssignment(lesson.id)} variant="secondary" size="sm" fullWidthMobile>
                  {lesson.has_assignment ? 'Edit Assignment' : 'Create Assignment'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={isPreview} onCheckedChange={setIsPreview} />
                <span className="text-sm text-foreground">Free Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm text-foreground">Active</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-foreground mb-3">Attachments</h4>
            <div className="space-y-2">
              {attachments?.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{att.file_name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X className="h-4 w-4" />}
                    onClick={() => deleteAttachment(att.id)}
                  />
                </div>
              ))}
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50">
                <input type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) addAttachment(file); }} />
                <span className="text-sm text-muted-foreground">Click to upload file</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 p-4 border-t border-border bg-muted/30">
          <Button variant="danger" onClick={() => setShowDeleteModal(true)} fullWidthMobile>
            Delete Lesson
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="ghost" onClick={onClose} fullWidthMobile>Cancel</Button>
            <Button onClick={handleSave} icon={<Check className="h-4 w-4" />} fullWidthMobile>Save Changes</Button>
          </div>
        </div>
      </div>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Lesson">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete "{lesson.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}