import { useState, useEffect } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { lessonsApi } from '../../services/api'
import type { Course, Lesson } from '../../services/api'
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

  const handleAddLesson = async (sectionId: string, type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT' = 'ARTICLE') => {
    try {
      const res = await lessonsApi.create(sectionId, {
        title: 'Bài học mới',
        type,
      })
      await fetchSections()
      setEditingLesson({ sectionId, lesson: res.data })
    } catch (err) {
      console.error('Failed to create lesson:', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Nội Dung Khóa Học
        </h2>
        <Button onClick={() => setShowAddSection(true)} size="sm" icon={<Plus className="h-4 w-4" />}>
          Thêm chương học
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : sections.length > 0 ? (
          sections.map((section) => (
            <SectionAccordion
              key={section.id}
              section={section}
              onSectionUpdate={handleSectionUpdate}
              onSectionDelete={handleSectionDelete}
              onLessonClick={(sectionId, lesson) => setEditingLesson({ sectionId, lesson })}
              onAddLesson={handleAddLesson}
              onOpenQuiz={(lessonId) => setShowQuizBuilder(lessonId)}
              onOpenAssignment={(lessonId) => setShowAssignmentBuilder(lessonId)}
            />
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có chương học nào</h3>
            <p className="text-muted-foreground mb-4">Bắt đầu bằng việc thêm chương học để sắp xếp nội dung khóa học</p>
            <Button onClick={() => setShowAddSection(true)} icon={<Plus className="h-4 w-4" />}>
              Thêm chương đầu tiên
            </Button>
          </div>
        )}
      </div>

      <Modal open={showAddSection} onClose={() => setShowAddSection(false)} title="Thêm Chương Học Mới">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tên chương học</label>
            <Input
              value={newSectionTitle}
              onChange={setNewSectionTitle}
              className="mt-1"
              placeholder="VD: Giới thiệu, Bắt đầu học, Kiến thức nền tảng..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Mô tả ngắn (không bắt buộc)</label>
            <Textarea
              value={newSectionDescription}
              onChange={(e) => setNewSectionDescription(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddSection(false)}>Hủy</Button>
            <Button onClick={handleAddSection} disabled={!newSectionTitle.trim()}>Thêm chương</Button>
          </div>
        </div>
      </Modal>

      {editingLesson && (
        <LessonEditor
          courseId={course.id}
          sectionId={editingLesson.sectionId}
          lesson={editingLesson.lesson}
          isOpen={!!editingLesson && !showQuizBuilder && !showAssignmentBuilder}
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