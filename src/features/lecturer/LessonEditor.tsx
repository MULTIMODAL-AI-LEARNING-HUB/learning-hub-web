import { useState, useEffect, useRef } from 'react'
import { Video, FileText, HelpCircle, ClipboardList, X, Check, Music, Film, FileImage, FileArchive, FileSpreadsheet, Download, Upload } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Switch } from '../../components/ui/Switch'
import { Modal } from '../../components/ui/Modal'
import { useLessons, useLessonAttachments } from '../../hooks/useLessons'
import { lessonsApi, type Lesson } from '../../services/api'
import { useToast } from '../../components/ui/useToast'

const getFileDetails = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  if (['pdf'].includes(ext)) {
    return {
      icon: <FileText className="h-5 w-5 text-red-500" />,
      bg: 'bg-red-500/10 border-red-500/20',
      label: 'PDF Document'
    }
  }
  if (['doc', 'docx'].includes(ext)) {
    return {
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      bg: 'bg-blue-500/10 border-blue-500/20',
      label: 'Word Document'
    }
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return {
      icon: <FileSpreadsheet className="h-5 w-5 text-emerald-500" />,
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      label: 'Spreadsheet'
    }
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return {
      icon: <FileText className="h-5 w-5 text-orange-500" />,
      bg: 'bg-orange-500/10 border-orange-500/20',
      label: 'Presentation'
    }
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return {
      icon: <FileArchive className="h-5 w-5 text-purple-500" />,
      bg: 'bg-purple-500/10 border-purple-500/20',
      label: 'Archive'
    }
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    return {
      icon: <FileImage className="h-5 w-5 text-cyan-500" />,
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      label: 'Image File'
    }
  }
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return {
      icon: <Music className="h-5 w-5 text-indigo-500" />,
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      label: 'Audio File'
    }
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return {
      icon: <Film className="h-5 w-5 text-pink-500" />,
      bg: 'bg-pink-500/10 border-pink-500/20',
      label: 'Video File'
    }
  }
  return {
    icon: <FileText className="h-5 w-5 text-muted-foreground" />,
    bg: 'bg-muted/10 border-border/50',
    label: 'Attachment'
  }
}

const formatBytes = (bytes: number | null | undefined) => {
  if (bytes === null || bytes === undefined || bytes === 0) return 'Unknown size'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

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
  const toast = useToast()
  const { updateLesson, deleteLesson } = useLessons(sectionId)
  const { attachments, fetchAttachments, addAttachment, deleteAttachment } = useLessonAttachments(sectionId, lesson?.id || '')

  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoDuration, setVideoDuration] = useState<number | undefined>()
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const initializedRef = useRef(false)

  const handleDeleteAttachment = async (attachmentId: string, fileUrl?: string) => {
    await deleteAttachment(attachmentId)
    // If the deleted file was the current lesson video, clear it from the form and DB
    if (fileUrl && lesson && (videoUrl === fileUrl || (videoUrl && fileUrl && (videoUrl.includes(fileUrl) || fileUrl.includes(videoUrl))))) {
      setVideoUrl('')
      setVideoDuration(undefined)
      try {
        await lessonsApi.update(sectionId, lesson.id, { video_url: undefined, video_duration: undefined })
        toast({ type: 'success', title: 'Video removed from lesson' })
      } catch (err) {
        console.error('Failed to clear video url:', err)
      }
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !lesson) return

    setUploadingVideo(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_name', file.name)
    formData.append('file_type', file.type)

    try {
      const res = await lessonsApi.addAttachment(sectionId, lesson.id, formData)
      setVideoUrl(res.data.file_url)
      
      // Auto-detect video duration locally
      const videoElement = document.createElement('video')
      videoElement.src = URL.createObjectURL(file)
      videoElement.onloadedmetadata = () => {
        setVideoDuration(Math.round(videoElement.duration))
        URL.revokeObjectURL(videoElement.src)
      }
      
      toast({ type: 'success', title: 'Video uploaded successfully' })
    } catch (err) {
      console.error('Failed to upload video:', err)
      toast({ type: 'error', title: 'Failed to upload video' })
    } finally {
      setUploadingVideo(false)
    }
  }


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
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Video URL (YouTube, Vimeo, or upload file)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={videoUrl}
                      onChange={setVideoUrl}
                      placeholder="https://youtube.com/... or upload a file"
                      className="flex-1 pr-8"
                    />
                    {videoUrl && (
                      <button
                        type="button"
                        onClick={() => { setVideoUrl(''); setVideoDuration(undefined) }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                        title="Clear video URL"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <label className="shrink-0 cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                    />
                    <Button
                      variant="secondary"
                      as="span"
                      loading={uploadingVideo}
                      icon={<Upload className="h-4 w-4" />}
                      className="h-9 px-3 text-xs cursor-pointer"
                    >
                      Upload Video
                    </Button>
                  </label>
                </div>
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

          {/* Section 5: Attachments & Lesson Materials */}
          <div className="bg-muted/20 p-5 rounded-xl border border-border/50 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Attachments & Materials</h3>
              </div>
              <span className="metadata-text font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {attachments?.length || 0} Files
              </span>
            </div>

            {/* Upload Area */}
            <label className="group flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer hover:bg-primary/5 transition duration-200">
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => { const file = e.target.files?.[0]; if (file) addAttachment(file); }} 
              />
              <div className="p-3 bg-muted/40 rounded-full group-hover:bg-primary/10 group-hover:scale-110 transition duration-200">
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition">Click to upload file attachment</p>
                <p className="text-[10px] text-muted-foreground">Supports PDF, Word, Excel, Images, ZIP up to 50MB</p>
              </div>
            </label>

            {/* Attachments List */}
            {attachments && attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {attachments.map((att) => {
                  const details = getFileDetails(att.file_name)
                  return (
                    <div 
                      key={att.id} 
                      className="flex items-start justify-between p-3 bg-card border border-border/70 hover:border-border-strong rounded-xl shadow-xs hover:shadow-sm transition"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg border ${details.bg} shrink-0`}>
                          {details.icon}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p 
                            className="text-xs font-semibold text-foreground truncate max-w-[150px]" 
                            title={att.file_name}
                          >
                            {att.file_name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span>{formatBytes(att.file_size)}</span>
                            <span>•</span>
                            <span className="capitalize">{details.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 ml-2">
                        {att.file_url && (
                          <a 
                            href={att.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                            title="Download/View file"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteAttachment(att.id, att.file_url || undefined)}
                          className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                          title="Remove file"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
