/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { assignmentsApi, type Assignment } from '../../services/api'
import { AssignmentSubmissionView } from './AssignmentSubmission'

interface LessonAssignmentModalProps {
  open: boolean
  onClose: () => void
  lessonId: string
  lessonTitle: string
  assignmentData?: Assignment | null
}

export function LessonAssignmentModal({
  open,
  onClose,
  lessonId,
  lessonTitle,
  assignmentData,
}: LessonAssignmentModalProps) {
  const [assignment, setAssignment] = useState<Assignment | null>(assignmentData || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (assignmentData) {
        setAssignment(assignmentData)
      } else if (lessonId) {
        setLoading(true)
        assignmentsApi
          .get(lessonId)
          .then((res) => {
            setAssignment(res.data)
          })
          .catch(() => {
            setAssignment(null)
          })
          .finally(() => {
            setLoading(false)
          })
      }
    }
  }, [open, lessonId, assignmentData])

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="4xl"
      title={assignment ? assignment.title : 'Bài tập thực hành'}
    >
      <div className="p-4 sm:p-6 space-y-5">
        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : !assignment ? (
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold text-foreground">Không tìm thấy bài tập</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bài học này chưa có thông tin bài tập tự luận.
            </p>
            <Button variant="outline" className="mt-5" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="warning" label="Bài tập tự luận" />
                <span className="text-xs text-muted-foreground">{lessonTitle}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Thang điểm: <span className="font-semibold text-foreground">{assignment.max_score}</span>
              </div>
            </div>

            <AssignmentSubmissionView lessonId={lessonId} assignment={assignment} />

            <div className="flex justify-end border-t border-border pt-4">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
