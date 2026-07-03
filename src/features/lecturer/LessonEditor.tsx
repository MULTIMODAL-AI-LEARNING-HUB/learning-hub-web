import { useState, useEffect, useRef } from 'react'
import { Video, FileText, HelpCircle, ClipboardList, X, Check, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Switch } from '../../components/ui/Switch'
import { Modal } from '../../components/ui/Modal'
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
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title="Edit Lesson"
        size="xl"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <Button variant="danger" onClick={() => setShowDeleteModal(true)} fullWidthMobile>
              Delete Lesson
            </Button>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button variant="ghost" onClick={onClose} fullWidthMobile>Cancel</Button>
              <Button onClick={handleSave} icon={<Check className="h-4 w-4" />} variant="gradient" fullWidthMobile>Save Changes</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          {/* Section 1: Basic Information */}
          <div className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">General Info</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lesson Title</label>
                <Input value={title} onChange={setTitle} className="mt-1.5" placeholder="Enter lesson title..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" rows={2} placeholder="Brief summary of the lesson..." />
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch checked={isPreview} onCheckedChange={setIsPreview} id="free-preview" />
                  <label htmlFor="free-preview" className="text-sm font-medium text-foreground cursor-pointer">Free Preview</label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} id="lesson-active" />
                  <label htmlFor="lesson-active" className="text-sm font-medium text-foreground cursor-pointer">Active / Visible</label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Video Content */}
          <div className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <Video className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Video Content</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Video URL (YouTube, Vimeo, etc.)</label>
                <Input
                  value={videoUrl}
                  onChange={setVideoUrl}
                  placeholder="https://youtube.com/..."
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration (seconds)</label>
                <Input
                  type="number"
                  value={videoDuration || ''}
                  onChange={(v) => setVideoDuration(parseInt(v) || undefined)}
                  className="mt-1.5"
                  placeholder="e.g. 600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Text Content */}
          <div className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <FileText className="h-5 w-5 text-success" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Text Content (Article)</h3>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content (Markdown / HTML)</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1.5 font-mono text-sm"
                rows={6}
                placeholder="Write your lesson text content here..."
              />
            </div>
          </div>

          {/* Section 4: Interactive Components */}
          <div className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <HelpCircle className="h-5 w-5 text-accent" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Evaluation & Homework</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col justify-between gap-3 bg-card border border-border/60 p-3 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-accent" /> Quiz
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lesson.has_quiz ? 'This lesson has an attached quiz.' : 'No quiz attached yet.'}
                  </p>
                </div>
                <Button onClick={() => onOpenQuiz(lesson.id)} variant="secondary" size="sm">
                  {lesson.has_quiz ? 'Edit Quiz' : 'Create Quiz'}
                </Button>
              </div>

              <div className="flex flex-col justify-between gap-3 bg-card border border-border/60 p-3 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-warning" /> Assignment
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lesson.has_assignment ? 'This lesson has an attached assignment.' : 'No assignment attached yet.'}
                  </p>
                </div>
                <Button onClick={() => onOpenAssignment(lesson.id)} variant="secondary" size="sm">
                  {lesson.has_assignment ? 'Edit Assignment' : 'Create Assignment'}
                </Button>
              </div>
            </div>
          </div>

          {/* Section 5: Attachments */}
          <div className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Attachments (PDF, Word, etc.)</h3>
            <div className="space-y-2">
              {attachments?.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-2.5 bg-card border border-border/60 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground truncate">{att.file_name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X className="h-4 w-4 text-destructive" />}
                    onClick={() => deleteAttachment(att.id)}
                  />
                </div>
              ))}
              <label className="flex flex-col items-center justify-center gap-1.5 p-4 border-2 border-dashed border-border hover:border-primary/40 rounded-xl cursor-pointer hover:bg-muted/30 transition">
                <input type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) addAttachment(file); }} />
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Click to upload file attachment</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

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
    </>
  )
}