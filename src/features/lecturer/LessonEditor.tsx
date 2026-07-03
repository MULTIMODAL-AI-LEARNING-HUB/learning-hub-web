import { useState, useEffect, useRef } from 'react'
import { Video, FileText, HelpCircle, ClipboardList, X, Check, BookOpen } from 'lucide-react'
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground truncate">Edit Lesson</h2>
            <Badge variant="outline" label="Lesson" />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* General Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Lesson Title</label>
              <Input value={title} onChange={setTitle} className="mt-1" placeholder="Enter lesson title..." />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={2} placeholder="Brief summary of the lesson..." />
            </div>
          </div>

          {/* Video Section */}
          <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Video className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Video Content</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Video URL (YouTube, Vimeo, etc.)</label>
                <Input
                  value={videoUrl}
                  onChange={setVideoUrl}
                  placeholder="https://youtube.com/..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Duration (seconds)</label>
                <Input
                  type="number"
                  value={videoDuration || ''}
                  onChange={(v) => setVideoDuration(parseInt(v) || undefined)}
                  className="mt-1"
                  placeholder="e.g. 600"
                />
              </div>
            </div>
          </div>

          {/* Article Section */}
          <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <FileText className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-foreground">Text Content (Article)</h3>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Content (Markdown / HTML)</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1"
                rows={6}
                placeholder="Write your lesson text content here..."
              />
            </div>
          </div>

          {/* Quiz Section */}
          <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <HelpCircle className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-foreground">Evaluation Quiz</h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/60 p-3 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-foreground">Quiz Attachment</h4>
                <p className="text-xs text-muted-foreground">
                  {lesson.has_quiz ? 'This lesson has an attached quiz.' : 'No quiz attached yet.'}
                </p>
              </div>
              <Button onClick={() => onOpenQuiz(lesson.id)} variant="secondary" size="sm" fullWidthMobile>
                {lesson.has_quiz ? 'Edit Quiz' : 'Create Quiz'}
              </Button>
            </div>
          </div>

          {/* Assignment Section */}
          <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <ClipboardList className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-foreground">Homework / Assignment</h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/60 p-3 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-foreground">Assignment Attachment</h4>
                <p className="text-xs text-muted-foreground">
                  {lesson.has_assignment ? 'This lesson has an attached assignment.' : 'No assignment attached yet.'}
                </p>
              </div>
              <Button onClick={() => onOpenAssignment(lesson.id)} variant="secondary" size="sm" fullWidthMobile>
                {lesson.has_assignment ? 'Edit Assignment' : 'Create Assignment'}
              </Button>
            </div>
          </div>

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
            <h4 className="font-medium text-foreground mb-3">Attachments (PDF or Word documents)</h4>
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