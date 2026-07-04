import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, GripVertical, Video, FileText, HelpCircle, ClipboardList, BookOpen, Paperclip, Download } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { useLessons } from '../../hooks/useLessons'
import { lessonsApi, type Section, type Lesson, type Attachment } from '../../services/api'
import { useToast } from '../../components/ui/useToast'

interface SectionAccordionProps {
  section: Section
  onSectionUpdate: (sectionId: string, data: { title?: string; description?: string }) => void
  onSectionDelete: (sectionId: string) => void
  onLessonClick: (sectionId: string, lesson: Lesson) => void
  onAddLesson: (sectionId: string, type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT') => void
}

export function SectionAccordion({
  section,
  onSectionUpdate,
  onSectionDelete,
  onLessonClick,
  onAddLesson,
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
        toast({ type: 'error', title: 'Failed to load documents' })
      } finally {
        setLoadingAttachments(prev => ({ ...prev, [lessonId]: false }))
      }
    }
  }

  const handleDeleteAttachment = async (e: React.MouseEvent, lessonId: string, attachmentId: string) => {
    e.stopPropagation() // Prevent opening the edit modal
    if (!confirm('Are you sure you want to delete this document?')) return

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
      
      toast({ type: 'success', title: 'Document deleted successfully' })
      
      // Re-fetch lessons to update the Docs count indicator badge
      fetchLessons()
    } catch (err) {
      console.error('Failed to delete attachment:', err)
      toast({ type: 'error', title: 'Failed to delete document' })
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
            {lessons?.length || section.lesson_count || 0} lessons
          </span>
        </button>

        <div className="flex items-center gap-1 relative">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
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
                Add Lesson
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
                      <Video className="h-4 w-4 text-primary" /> Video Lesson
                    </button>
                    <button
                      onClick={() => handleAddLessonLocal('ARTICLE')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-success" /> Article Lesson
                    </button>
                    <button
                      onClick={() => handleAddLessonLocal('QUIZ')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors"
                    >
                      <HelpCircle className="h-4 w-4 text-accent" /> Add Quiz
                    </button>
                    <button
                      onClick={() => handleAddLessonLocal('ASSIGNMENT')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted/80 text-foreground flex items-center gap-2 transition-colors"
                    >
                      <ClipboardList className="h-4 w-4 text-warning" /> Add Assignment
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
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onLessonClick(section.id, lesson)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Chevron Toggle at start of row (similar to Section) */}
                  <div className="shrink-0 flex items-center justify-center w-5 h-5" onClick={(e) => e.stopPropagation()}>
                    {lesson.attachment_count > 0 ? (
                      <button
                        onClick={(e) => toggleLessonExpand(e, lesson.id)}
                        className="hover:bg-muted p-0.5 rounded transition-colors"
                        title="Toggle documents list"
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
                  
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                    {lesson.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{lesson.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {lesson.video_url && (
                        <span className="flex items-center gap-1 text-[11px] text-primary" title="Video">
                          <Video className="h-3 w-3" /> Video
                        </span>
                      )}
                      {lesson.content && (
                        <span className="flex items-center gap-1 text-[11px] text-success" title="Article">
                          <FileText className="h-3 w-3" /> Article
                        </span>
                      )}
                      {lesson.attachment_count > 0 && (
                        <button
                          onClick={(e) => toggleLessonExpand(e, lesson.id)}
                          className="flex items-center gap-1 text-[11px] text-info hover:underline transition-all font-semibold"
                          title="Toggle documents list"
                        >
                          <FileText className="h-3 w-3" /> Docs ({lesson.attachment_count})
                        </button>
                      )}
                      {lesson.has_quiz && (
                        <span className="flex items-center gap-1 text-[11px] text-accent" title="Quiz">
                          <HelpCircle className="h-3 w-3" /> Quiz
                        </span>
                      )}
                      {lesson.has_assignment && (
                        <span className="flex items-center gap-1 text-[11px] text-warning" title="Assignment">
                          <ClipboardList className="h-3 w-3" /> Assignment
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {lesson.is_preview && <Badge variant="info" label="Preview" />}
                </div>
              </div>

              {expandedLessons[lesson.id] && (
                <div 
                  className="bg-muted/10 px-12 pb-3 pt-1 space-y-1.5 border-t border-border/40"
                  onClick={(e) => e.stopPropagation()}
                >
                  {loadingAttachments[lesson.id] ? (
                    <div className="text-xs text-muted-foreground py-1 animate-pulse">Loading documents...</div>
                  ) : lessonAttachmentsMap[lesson.id] && lessonAttachmentsMap[lesson.id].length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {lessonAttachmentsMap[lesson.id].map((att) => (
                        <div 
                          key={att.id}
                          className="flex items-center justify-between gap-3 p-2 bg-card hover:bg-muted/40 border border-border/60 rounded-lg text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate font-medium text-foreground" title={att.file_name}>
                              {att.file_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                              title="Download document"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={(e) => handleDeleteAttachment(e, lesson.id, att.id)}
                              className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground py-1">No documents attached.</div>
                  )}
                </div>
              )}
            </div>
          ))}
          {(!lessons || lessons.length === 0) && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No lessons yet. Click "Add Lesson" to create one.
            </div>
          )}
        </div>
      )}

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Section">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete "{section.title}"? This will also delete all lessons in this section.
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