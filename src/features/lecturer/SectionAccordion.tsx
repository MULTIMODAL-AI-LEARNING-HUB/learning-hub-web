import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, GripVertical, Video, FileText, HelpCircle, ClipboardList, BookOpen } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { useLessons } from '../../hooks/useLessons'
import type { Section, Lesson } from '../../services/api'
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
  const [isOpen, setIsOpen] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(section.title)
  const [editDescription] = useState(section.description || '')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { lessons } = useLessons(section.id)

  const handleSave = async () => {
    await onSectionUpdate(section.id, { title: editTitle, description: editDescription })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await onSectionDelete(section.id)
    setShowDeleteModal(false)
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

        <div className="flex items-center gap-1">
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
            <>
              <Button
                size="sm"
                variant="ghost"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => onAddLesson(section.id, 'ARTICLE')}
                className="hidden sm:inline-flex"
              >
                Add Lesson
              </Button>
              <Button
                size="icon"
                variant="ghost"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => onAddLesson(section.id, 'ARTICLE')}
                className="sm:hidden"
              />
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
            <div
              key={lesson.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 cursor-pointer"
              onClick={() => onLessonClick(section.id, lesson)}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                  {lesson.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{lesson.description}</p>
                  )}
                  {/* Inline content indicators */}
                  <div className="flex items-center gap-2 mt-0.5">
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
                      <span className="flex items-center gap-1 text-[11px] text-info" title="Documents">
                        <FileText className="h-3 w-3" /> Docs ({lesson.attachment_count})
                      </span>
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
              <div className="flex items-center gap-2">
                {lesson.is_preview && <Badge variant="info" label="Preview" />}
              </div>
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