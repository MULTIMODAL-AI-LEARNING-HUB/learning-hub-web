import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, GripVertical, Video, FileText, HelpCircle, ClipboardList, BookOpen, Paperclip, Download } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { useLessons } from '../../hooks/useLessons'
import { lessonsApi, quizzesApi, assignmentsApi, type Section, type Lesson, type Attachment } from '../../services/api'
import { useToast } from '../../components/ui/useToast'

interface SectionAccordionProps {
  section: Section
  onSectionUpdate: (sectionId: string, data: { title?: string; description?: string }) => void
  onSectionDelete: (sectionId: string) => void
  onLessonClick: (sectionId: string, lesson: Lesson) => void
  onAddLesson: (sectionId: string, type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT') => void
  onOpenQuiz: (lessonId: string) => void
  onOpenAssignment: (lessonId: string) => void
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext || '')) return <FileText className="h-4 w-4 text-rose-500 shrink-0" />
  if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-4 w-4 text-blue-500 shrink-0" />
  if (['xls', 'xlsx'].includes(ext || '')) return <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
  if (['ppt', 'pptx'].includes(ext || '')) return <FileText className="h-4 w-4 text-orange-500 shrink-0" />
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return <FileText className="h-4 w-4 text-purple-500 shrink-0" />
  if (['mp4', 'mkv', 'avi', 'mov'].includes(ext || '')) return <Video className="h-4 w-4 text-indigo-500 shrink-0" />
  return <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function SectionAccordion({
  section,
  onSectionUpdate,
  onSectionDelete,
  onLessonClick,
  onAddLesson,
  onOpenQuiz,
  onOpenAssignment,
}: SectionAccordionProps) {
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(section.title)
  const [editDescription] = useState(section.description || '')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { lessons, fetchLessons } = useLessons(section.id)

  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({})
  const [lessonAttachmentsMap, setLessonAttachmentsMap] = useState<Record<string, Attachment[]>>({})
  const [loadingAttachments, setLoadingAttachments] = useState<Record<string, boolean>>({})
  const [showMaterialMenu, setShowMaterialMenu] = useState<Record<string, boolean>>({})
  const [activeUploadLessonId, setActiveUploadLessonId] = useState<string | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const handleDocumentUploadClick = (lessonId: string) => {
    setActiveUploadLessonId(lessonId)
    setTimeout(() => {
      document.getElementById('document-upload-input')?.click()
    }, 50)
  }

  const handleVideoUploadClick = (lessonId: string) => {
    setActiveUploadLessonId(lessonId)
    setTimeout(() => {
      document.getElementById('video-upload-input')?.click()
    }, 50)
  }

  const handleDocumentUploadSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeUploadLessonId) return

    setUploadingDoc(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_name', file.name)
    formData.append('file_type', file.type)

    try {
      const res = await lessonsApi.addAttachment(section.id, activeUploadLessonId, formData)
      
      setLessonAttachmentsMap(prev => ({
        ...prev,
        [activeUploadLessonId]: [...(prev[activeUploadLessonId] || []), res.data]
      }))

      setExpandedLessons(prev => ({ ...prev, [activeUploadLessonId]: true }))
      toast({ type: 'success', title: 'Tải tài liệu lên thành công' })
      fetchLessons()
    } catch (err) {
      console.error('Failed to upload document:', err)
      toast({ type: 'error', title: 'Không thể tải tài liệu lên' })
    } finally {
      setUploadingDoc(false)
      setActiveUploadLessonId(null)
      e.target.value = ''
    }
  }

  const handleVideoUploadSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeUploadLessonId) return

    setUploadingVideo(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_name', file.name)
    formData.append('file_type', file.type)

    try {
      const uploadRes = await lessonsApi.addAttachment(section.id, activeUploadLessonId, formData)
      
      const videoElement = document.createElement('video')
      videoElement.src = URL.createObjectURL(file)
      
      videoElement.onloadedmetadata = async () => {
        const duration = Math.round(videoElement.duration)
        URL.revokeObjectURL(videoElement.src)
        
        try {
          await lessonsApi.update(section.id, activeUploadLessonId, {
            video_url: uploadRes.data.file_url,
            video_duration: duration
          })
          
          toast({ type: 'success', title: 'Tải video lên và đính kèm bài học thành công' })
          fetchLessons()
        } catch (err) {
          console.error('Failed to update lesson video url:', err)
          toast({ type: 'error', title: 'Không thể cập nhật liên kết video bài học' })
        }
      }
    } catch (err) {
      console.error('Failed to upload video:', err)
      toast({ type: 'error', title: 'Không thể tải video lên' })
    } finally {
      setUploadingVideo(false)
      setActiveUploadLessonId(null)
      e.target.value = ''
    }
  }

  const handleAddVideoPrompt = async (lessonId: string) => {
    const url = prompt('Nhập đường dẫn URL video (ví dụ: YouTube, Vimeo...), hoặc để trống và bấm OK để tải video từ máy tính của bạn:')
    if (url === null) return

    if (url.trim() !== "") {
      try {
        await lessonsApi.update(section.id, lessonId, {
          video_url: url.trim()
        })
        toast({ type: 'success', title: 'Cập nhật liên kết video thành công' })
        fetchLessons()
      } catch (err) {
        console.error('Failed to update video url:', err)
        toast({ type: 'error', title: 'Không thể cập nhật liên kết video' })
      }
    } else {
      handleVideoUploadClick(lessonId)
    }
  }

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  const handleSave = async () => {
    await onSectionUpdate(section.id, { title: editTitle, description: editDescription })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await onSectionDelete(section.id)
    setShowDeleteModal(false)
  }

  const handleAddLessonLocal = async (type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT') => {
    await onAddLesson(section.id, type)
    setShowTypeMenu(false)
    fetchLessons()
  }

  const toggleLessonExpand = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation() // Prevent opening the edit modal
    
    const isCurrentlyExpanded = !!expandedLessons[lessonId]
    setExpandedLessons(prev => ({ ...prev, [lessonId]: !isCurrentlyExpanded }))
    
    if (!isCurrentlyExpanded && !lessonAttachmentsMap[lessonId]) {
      setLoadingAttachments(prev => ({ ...prev, [lessonId]: true }))
      try {
        const res = await lessonsApi.getAttachments(section.id, lessonId)
        setLessonAttachmentsMap(prev => ({ ...prev, [lessonId]: res.data }))
      } catch (err) {
        console.error('Failed to fetch attachments:', err)
        toast({ type: 'error', title: 'Không thể tải danh sách tài liệu' })
      } finally {
        setLoadingAttachments(prev => ({ ...prev, [lessonId]: false }))
      }
    }
  }

  const handleDeleteAttachment = async (e: React.MouseEvent, lessonId: string, attachmentId: string) => {
    e.stopPropagation() // Prevent opening the edit modal
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return

    try {
      await lessonsApi.deleteAttachment(section.id, lessonId, attachmentId)
      
      // Update attachments list map
      setLessonAttachmentsMap(prev => {
        const current = prev[lessonId] || []
        return {
          ...prev,
          [lessonId]: current.filter(att => att.id !== attachmentId)
        }
      })
      
      toast({ type: 'success', title: 'Đã xóa tài liệu thành công' })
      
      // Re-fetch lessons to update the Docs count indicator badge
      fetchLessons()
    } catch (err) {
      console.error('Failed to delete attachment:', err)
      toast({ type: 'error', title: 'Không thể xóa tài liệu' })
    }
  }

  const handleDeleteQuiz = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation()
    if (!confirm('Bạn có chắc chắn muốn xóa bài trắc nghiệm này?')) return

    try {
      await quizzesApi.delete(lessonId)
      toast({ type: 'success', title: 'Đã xóa bài trắc nghiệm' })
      fetchLessons()
    } catch (err) {
      console.error('Failed to delete quiz:', err)
      toast({ type: 'error', title: 'Không thể xóa bài trắc nghiệm' })
    }
  }

  const handleDeleteAssignmentItem = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation()
    if (!confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return

    try {
      await assignmentsApi.delete(lessonId)
      toast({ type: 'success', title: 'Đã xóa bài tập thành công' })
      fetchLessons()
    } catch (err) {
      console.error('Failed to delete assignment:', err)
      toast({ type: 'error', title: 'Không thể xóa bài tập' })
    }
  }

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-muted/30">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 hover:opacity-80"
        >
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={setEditTitle}
              className="h-8 max-w-xs"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="font-semibold text-foreground">{section.title}</h3>
          )}
          <span className="text-xs text-muted-foreground ml-2">
            {lessons?.length || section.lesson_count || 0} bài học
          </span>
        </button>

        <div className="flex items-center gap-1 relative">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleSave}>
                Lưu
              </Button>
            </>
          ) : (
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowTypeMenu(!showTypeMenu)}
                className="hidden sm:inline-flex"
              >
                Thêm bài học
              </Button>
              <Button
                size="icon"
                variant="ghost"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowTypeMenu(!showTypeMenu)}
                className="sm:hidden"
              />
              
              {showTypeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-surface-elevated border border-border rounded-xl shadow-lift py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => handleAddLessonLocal('VIDEO')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors"
                    >
                      <Video className="h-4 w-4 text-primary" /> Bài học Video
                    </button>
                    <button
                      onClick={() => handleAddLessonLocal('ARTICLE')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-success" /> Bài đọc / Lý thuyết
                    </button>
                    <button
                      onClick={() => handleAddLessonLocal('QUIZ')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors"
                    >
                      <HelpCircle className="h-4 w-4 text-accent" /> Bài trắc nghiệm (Quiz)
                    </button>
                    <button
                      onClick={() => handleAddLessonLocal('ASSIGNMENT')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors"
                    >
                      <ClipboardList className="h-4 w-4 text-warning" /> Bài tập tự luận
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {!isEditing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => setIsEditing(true)}
              />
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => setShowDeleteModal(true)}
              />
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="divide-y divide-border">
          {lessons?.map((lesson) => (
            <div key={lesson.id} className="border-b border-border last:border-b-0">
              <div
                className="flex items-center justify-between pl-8 pr-4 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onLessonClick(section.id, lesson)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Chevron Toggle at start of row (similar to Section) */}
                  <div className="shrink-0 flex items-center justify-center w-5 h-5" onClick={(e) => e.stopPropagation()}>
                    {lesson.attachment_count > 0 ? (
                      <button
                        onClick={(e) => toggleLessonExpand(e, lesson.id)}
                        className="hover:bg-muted p-0.5 rounded transition-colors"
                        title="Xem danh sách tài liệu"
                      >
                        {expandedLessons[lesson.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </div>
                  
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground/90 truncate">{lesson.title}</p>
                    {lesson.description && (
                      <p className="text-[11px] text-muted-foreground/80 line-clamp-1 mb-0.5">{lesson.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {lesson.video_url && (
                        <span className="flex items-center gap-1 text-[10px] text-primary" title="Video">
                          <Video className="h-3 w-3" /> Video
                        </span>
                      )}
                      {lesson.content && (
                        <span className="flex items-center gap-1 text-[10px] text-success" title="Bài đọc">
                          <FileText className="h-3 w-3" /> Bài đọc
                        </span>
                      )}
                      {lesson.attachment_count > 0 && (
                        <button
                          onClick={(e) => toggleLessonExpand(e, lesson.id)}
                          className="flex items-center gap-1 text-[10px] text-info hover:underline transition-all font-semibold"
                          title="Xem danh sách tài liệu"
                        >
                          <FileText className="h-3 w-3" /> Tài liệu ({lesson.attachment_count})
                        </button>
                      )}
                      {lesson.has_quiz && (
                        <span className="flex items-center gap-1 text-[10px] text-accent" title="Trắc nghiệm">
                          <HelpCircle className="h-3 w-3" /> Trắc nghiệm
                        </span>
                      )}
                      {lesson.has_assignment && (
                        <span className="flex items-center gap-1 text-[10px] text-warning" title="Bài tập">
                          <ClipboardList className="h-3 w-3" /> Bài tập
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {lesson.is_preview && <Badge variant="info" label="Học thử" />}
                  
                  {/* Add Material Dropdown */}
                  <div className="relative">
                    <button
                      disabled={uploadingDoc || uploadingVideo}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMaterialMenu(prev => ({ ...prev, [lesson.id]: !prev[lesson.id] }))
                      }}
                      className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg border border-primary/20 bg-card hover:bg-muted text-[11px] font-semibold text-primary gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Thêm học liệu hoặc bài tập vào bài học này"
                    >
                      {activeUploadLessonId === lesson.id && (uploadingDoc || uploadingVideo) ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0" />
                          <span>Đang tải lên...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Thêm học liệu</span>
                        </>
                      )}
                    </button>
                    
                    {showMaterialMenu[lesson.id] && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMaterialMenu(prev => ({ ...prev, [lesson.id]: false }))} />
                        <div className="absolute right-0 mt-1 w-48 bg-surface-elevated border border-border rounded-xl shadow-lift py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                          <button
                            onClick={() => {
                              setShowMaterialMenu(prev => ({ ...prev, [lesson.id]: false }))
                              handleDocumentUploadClick(lesson.id)
                            }}
                            className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors font-medium"
                          >
                            <FileText className="h-3.5 w-3.5 text-rose-500" /> Tải lên tài liệu
                          </button>
                          
                          {!lesson.video_url && (
                            <button
                              onClick={() => {
                                setShowMaterialMenu(prev => ({ ...prev, [lesson.id]: false }))
                                handleAddVideoPrompt(lesson.id)
                              }}
                              className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors font-medium"
                            >
                              <Video className="h-3.5 w-3.5 text-primary" /> Thêm Video
                            </button>
                          )}
                          
                          {!lesson.has_quiz && (
                            <button
                              onClick={() => {
                                setShowMaterialMenu(prev => ({ ...prev, [lesson.id]: false }))
                                onOpenQuiz(lesson.id)
                              }}
                              className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors font-medium"
                            >
                              <HelpCircle className="h-3.5 w-3.5 text-accent" /> Thêm bài trắc nghiệm
                            </button>
                          )}
                          
                          {!lesson.has_assignment && (
                            <button
                              onClick={() => {
                                setShowMaterialMenu(prev => ({ ...prev, [lesson.id]: false }))
                                onOpenAssignment(lesson.id)
                              }}
                              className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors font-medium"
                            >
                              <ClipboardList className="h-3.5 w-3.5 text-warning" /> Thêm bài tập
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {expandedLessons[lesson.id] && (
                <div 
                  className="relative pl-16 pr-4 pb-3.5 pt-2 space-y-2 bg-muted/5 border-t border-border/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Vertical tree explorer line */}
                  <div className="absolute left-[40px] top-0 bottom-6 w-[1.5px] bg-border/40" />

                  {/* Documents list (each taking exactly 1 full row) */}
                  {loadingAttachments[lesson.id] || (activeUploadLessonId === lesson.id && uploadingDoc) ? (
                    <div className="text-xs text-muted-foreground py-1.5 pl-2 animate-pulse flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                      {uploadingDoc ? 'Đang tải tài liệu lên...' : 'Đang tải nội dung...'}
                    </div>
                  ) : lessonAttachmentsMap[lesson.id] && lessonAttachmentsMap[lesson.id].length > 0 ? (
                    <div className="space-y-2">
                      {lessonAttachmentsMap[lesson.id].map((att) => (
                        <div 
                          key={att.id}
                          className="relative flex items-center justify-between gap-3 pl-3 pr-2 py-1.5 bg-card/65 hover:bg-card border border-border/40 hover:border-primary/30 rounded-xl text-[11px] transition-all duration-200 hover:translate-x-1 shadow-sm hover:shadow group w-full"
                        >
                          {/* Horizontal connection branch line */}
                          <div className="absolute -left-[24px] top-1/2 w-6 h-px bg-border/40" />
                          
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getFileIcon(att.file_name)}
                            <span className="truncate font-semibold text-foreground/80" title={att.file_name}>
                              {att.file_name}
                            </span>
                            {att.file_size !== null && att.file_size !== undefined && (
                              <span className="text-[9px] text-muted-foreground shrink-0 font-medium">
                                ({formatBytes(att.file_size || undefined)})
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                            <a
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                              title="Tải tài liệu"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={(e) => handleDeleteAttachment(e, lesson.id, att.id)}
                              className="p-1 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                              title="Xóa tài liệu"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Quiz (1 full row if present) */}
                  {lesson.has_quiz && (
                    <div className="relative flex items-center justify-between gap-3 pl-3 pr-2 py-1.5 bg-card/65 hover:bg-card border border-border/40 hover:border-accent/30 rounded-xl text-[11px] transition-all duration-200 hover:translate-x-1 shadow-sm hover:shadow group w-full">
                      {/* Horizontal connection branch line */}
                      <div className="absolute -left-[24px] top-1/2 w-6 h-px bg-border/40" />
                      
                      <div className="flex items-center gap-2.5 min-w-0">
                        <HelpCircle className="h-4 w-4 text-accent shrink-0" />
                        <span className="truncate font-semibold text-foreground/80">
                          Trắc nghiệm: Bài kiểm tra trắc nghiệm
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onOpenQuiz(lesson.id)}
                          className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Chỉnh sửa trắc nghiệm"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteQuiz(e, lesson.id)}
                          className="p-1 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                          title="Xóa trắc nghiệm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Assignment (1 full row if present) */}
                  {lesson.has_assignment && (
                    <div className="relative flex items-center justify-between gap-3 pl-3 pr-2 py-1.5 bg-card/65 hover:bg-card border border-border/40 hover:border-warning/30 rounded-xl text-[11px] transition-all duration-200 hover:translate-x-1 shadow-sm hover:shadow group w-full">
                      {/* Horizontal connection branch line */}
                      <div className="absolute -left-[24px] top-1/2 w-6 h-px bg-border/40" />
                      
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ClipboardList className="h-4 w-4 text-warning shrink-0" />
                        <span className="truncate font-semibold text-foreground/80">
                          Bài tập: Bài tập tự luận & thực hành
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onOpenAssignment(lesson.id)}
                          className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Chỉnh sửa bài tập"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteAssignmentItem(e, lesson.id)}
                          className="p-1 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                          title="Xóa bài tập"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* If nothing is in the expanded dropdown */}
                  {!loadingAttachments[lesson.id] && 
                   (!lessonAttachmentsMap[lesson.id] || lessonAttachmentsMap[lesson.id].length === 0) && 
                   !lesson.has_quiz && 
                   !lesson.has_assignment && (
                    <div className="relative text-xs text-muted-foreground py-2 pl-3 flex items-center gap-2">
                      <div className="absolute -left-[24px] top-1/2 w-6 h-px bg-border/40" />
                      Chưa có tài liệu hoặc bài tập nào trong bài học này.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {(!lessons || lessons.length === 0) && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Chưa có bài học nào. Bấm "Thêm bài học" để tạo bài học đầu tiên.
            </div>
          )}
        </div>
      )}

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Xóa Chương Học">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Bạn có chắc chắn muốn xóa chương "{section.title}"? Toàn bộ bài học trong chương này cũng sẽ bị xóa.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
            <Button variant="danger" onClick={handleDelete}>Xóa</Button>
          </div>
        </div>
      </Modal>
      
      {/* Hidden file inputs for direct uploads from lesson row */}
      <input
        type="file"
        id="document-upload-input"
        className="hidden"
        onChange={handleDocumentUploadSelected}
      />
      <input
        type="file"
        id="video-upload-input"
        className="hidden"
        accept="video/*"
        onChange={handleVideoUploadSelected}
      />
    </div>
  )
}
