import { useState, useEffect } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { Course, Lesson } from '../../services/api'
import { lessonsApi } from '../../services/api'
import { useSections } from '../../hooks/useLecturerCourses'
import { SectionAccordion } from './SectionAccordion'
import { LessonEditor } from './LessonEditor'
import { QuizBuilder } from './QuizBuilder'
import { AssignmentBuilder } from './AssignmentBuilder'

interface CourseContentManagerProps {
  course: Course
}

export function CourseContentManager({ course }: CourseContentManagerProps) {
  const { sections, loading, fetchSections, createSection, updateSection, deleteSection } = useSections(course.id)
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionDescription, setNewSectionDescription] = useState('')
  const [editingLesson, setEditingLesson] = useState<{ sectionId: string; lesson: Lesson } | null>(null)
  const [showQuizBuilder, setShowQuizBuilder] = useState<string | null>(null)
  const [showAssignmentBuilder, setShowAssignmentBuilder] = useState<string | null>(null)

  useEffect(() => {
    fetchSections()
  }, [fetchSections])

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return
    await createSection({
      title: newSectionTitle,
      description: newSectionDescription || undefined,
    })
    setNewSectionTitle('')
    setNewSectionDescription('')
    setShowAddSection(false)
  }

  const handleSectionUpdate = async (sectionId: string, data: { title?: string; description?: string }) => {
    await updateSection(sectionId, data)
    fetchSections()
  }

  const handleSectionDelete = async (sectionId: string) => {
    await deleteSection(sectionId)
    fetchSections()
  }

  const handleAddLesson = async (sectionId: string, type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT') => {
    try {
      await lessonsApi.create(sectionId, {
        title: `New ${type.charAt(0) + type.slice(1).toLowerCase()} Lesson`,
        type,
      })
      fetchSections()
    } catch (err) {
      console.error('Failed to create lesson:', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Course Content
        </h2>
        <Button onClick={() => setShowAddSection(true)} size="sm" icon={<Plus className="h-4 w-4" />}>
          Add Section
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : sections.length > 0 ? (
          sections.map((section) => (
            <SectionAccordion
              key={section.id}
              section={section}
              onSectionUpdate={handleSectionUpdate}
              onSectionDelete={handleSectionDelete}
              onLessonClick={(sectionId, lesson) => setEditingLesson({ sectionId, lesson })}
              onAddLesson={handleAddLesson}
            />
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No sections yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding a section to organize your course content</p>
            <Button onClick={() => setShowAddSection(true)} icon={<Plus className="h-4 w-4" />}>
              Add First Section
            </Button>
          </div>
        )}
      </div>

      <Modal isOpen={showAddSection} onClose={() => setShowAddSection(false)} title="Add Section">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Section Title</label>
            <Input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              className="mt-1"
              placeholder="e.g., Introduction, Getting Started, etc."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              value={newSectionDescription}
              onChange={(e) => setNewSectionDescription(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddSection(false)}>Cancel</Button>
            <Button onClick={handleAddSection} disabled={!newSectionTitle.trim()}>Add Section</Button>
          </div>
        </div>
      </Modal>

      {editingLesson && (
        <LessonEditor
          courseId={course.id}
          sectionId={editingLesson.sectionId}
          lesson={editingLesson.lesson}
          isOpen={!!editingLesson}
          onClose={() => {
            setEditingLesson(null)
            fetchSections()
          }}
          onOpenQuiz={(lessonId) => setShowQuizBuilder(lessonId)}
          onOpenAssignment={(lessonId) => setShowAssignmentBuilder(lessonId)}
        />
      )}

      {showQuizBuilder && (
        <QuizBuilder
          lessonId={showQuizBuilder}
          isOpen={!!showQuizBuilder}
          onClose={() => setShowQuizBuilder(null)}
        />
      )}

      {showAssignmentBuilder && (
        <AssignmentBuilder
          lessonId={showAssignmentBuilder}
          isOpen={!!showAssignmentBuilder}
          onClose={() => setShowAssignmentBuilder(null)}
        />
      )}
    </div>
  )
}