import { useState, useEffect, useRef } from 'react'
import { X, ClipboardList, FileText, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import type { AssignmentSubmission } from '../../services/api'
import { useAssignment, useAssignmentSubmissions } from '../../hooks/useAssignment'

interface AssignmentBuilderProps {
  lessonId: string
  isOpen: boolean
  onClose: () => void
}

export function AssignmentBuilder({ lessonId, isOpen, onClose }: AssignmentBuilderProps) {
  const { assignment, fetchAssignment, createAssignment, updateAssignment, deleteAssignment } = useAssignment(lessonId)
  const { submissions, total, fetchSubmissions, gradeSubmission } = useAssignmentSubmissions(assignment?.id || '')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showSubmissions, setShowSubmissions] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [deadline, setDeadline] = useState('')
  const [maxScore, setMaxScore] = useState(100)
  const [allowResubmit, setAllowResubmit] = useState(false)
  const [maxResubmits, setMaxResubmits] = useState(1)
  const [isActive, setIsActive] = useState(true)
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null)
  const [gradeScore, setGradeScore] = useState(0)
  const [gradeFeedback, setGradeFeedback] = useState('')
  const initializedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      fetchAssignment()
      initializedRef.current = false
    }
  }, [isOpen, fetchAssignment])

  useEffect(() => {
    if (assignment && !initializedRef.current) {
      setTitle(assignment.title)
      setDescription(assignment.description || '')
      setInstructions(assignment.instructions || '')
      setDeadline(assignment.deadline || '')
      setMaxScore(assignment.max_score)
      setAllowResubmit(assignment.allow_resubmit)
      setMaxResubmits(assignment.max_resubmits)
      setIsActive(assignment.is_active)
      initializedRef.current = true
    }
  }, [assignment])

  useEffect(() => {
    if (showSubmissions && assignment) {
      fetchSubmissions()
    }
  }, [showSubmissions, assignment, fetchSubmissions])

  const handleCreate = async () => {
    await createAssignment({
      title,
      description: description || undefined,
      instructions: instructions || undefined,
      deadline: deadline || undefined,
      max_score: maxScore,
      allow_resubmit: allowResubmit,
      max_resubmits: maxResubmits,
    })
    setShowCreateForm(false)
  }

  const handleUpdate = async () => {
    await updateAssignment({
      title,
      description: description || undefined,
      instructions: instructions || undefined,
      deadline: deadline || undefined,
      max_score: maxScore,
      allow_resubmit: allowResubmit,
      max_resubmits: maxResubmits,
      is_active: isActive,
    })
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      await deleteAssignment()
      onClose()
    }
  }

  const openGradingModal = (submission: AssignmentSubmission) => {
    setGradingSubmission(submission)
    setGradeScore(submission.score || 0)
    setGradeFeedback(submission.feedback || '')
  }

  const handleGrade = async () => {
    if (gradingSubmission) {
      await gradeSubmission(gradingSubmission.id, gradeScore, gradeFeedback)
      setGradingSubmission(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-lift w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in-from-bottom">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Assignment Builder</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!assignment && !showCreateForm && (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assignment Yet</h3>
              <p className="text-muted-foreground mb-4">Create an assignment for students to complete</p>
              <Button onClick={() => setShowCreateForm(true)} icon={<Plus className="h-4 w-4" />}>
                Create Assignment
              </Button>
            </div>
          )}

          {showCreateForm && (
            <Card className="p-4 space-y-4">
              <h3 className="font-medium">Create Assignment</h3>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={setTitle} className="mt-1" placeholder="Assignment title" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium">Instructions</label>
                <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="mt-1" rows={4} placeholder="Detailed instructions for students..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Deadline</label>
                  <Input type="datetime-local" value={deadline} onChange={setDeadline} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Score</label>
                  <Input type="number" value={maxScore} onChange={(v) => setMaxScore(parseInt(v))} className="mt-1" min={1} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!title}>Create Assignment</Button>
              </div>
            </Card>
          )}

          {assignment && (
            <>
              <Card className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={title}
                      onChange={setTitle}
                      className="text-lg font-semibold max-w-md"
                      onBlur={handleUpdate}
                    />
                    <Badge variant={assignment.is_active ? 'success' : 'default'} label={assignment.is_active ? 'Active' : 'Inactive'} />
                  </div>
                  <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Max Score: </span>
                    <span className="font-medium">{assignment.max_score}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deadline: </span>
                    <span className="font-medium">{assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'No deadline'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resubmit: </span>
                    <span className="font-medium">{assignment.allow_resubmit ? `Yes (${assignment.max_resubmits} max)` : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submissions: </span>
                    <span className="font-medium">{assignment.submission_count || 0}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={2} onBlur={handleUpdate} />
                </div>
                <div>
                  <label className="text-sm font-medium">Instructions</label>
                  <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="mt-1" rows={4} onBlur={handleUpdate} />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Student Submissions ({total})</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowSubmissions(!showSubmissions)}>
                    {showSubmissions ? 'Hide' : 'View'} Submissions
                  </Button>
                </div>

                {showSubmissions && (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="border border-border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{sub.student_name || 'Unknown Student'}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted {new Date(sub.submitted_at).toLocaleString()}
                              {sub.is_late && <span className="text-destructive ml-2">(Late)</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.score !== null ? (
                              <Badge variant={sub.score >= 70 ? 'success' : sub.score >= 50 ? 'warning' : 'error'} label={`${sub.score}/${assignment.max_score}`} />
                            ) : (
                              <Badge variant="default" label="Not graded" />
                            )}
                            <Button size="sm" variant="outline" onClick={() => openGradingModal(sub)}>
                              {sub.score !== null ? 'Re-grade' : 'Grade'}
                            </Button>
                          </div>
                        </div>
                        {sub.submission_text && (
                          <p className="mt-2 text-sm bg-muted/30 p-2 rounded">{sub.submission_text}</p>
                        )}
                        {sub.attachments && sub.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {sub.attachments.map((att, idx) => (
                              <a key={idx} href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                                <FileText className="h-4 w-4" /> {att.file_name}
                              </a>
                            ))}
                          </div>
                        )}
                        {sub.feedback && (
                          <p className="mt-2 text-sm text-muted-foreground italic">Feedback: {sub.feedback}</p>
                        )}
                      </div>
                    ))}
                    {submissions.length === 0 && (
                      <p className="text-center py-4 text-muted-foreground">No submissions yet</p>
                    )}
                  </div>
                )}
              </Card>
            </>
          )}

          <Modal open={!!gradingSubmission} onClose={() => setGradingSubmission(null)} title="Grade Submission">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Score (out of {assignment?.max_score})</label>
                <Input type="number" value={gradeScore} onChange={(v) => setGradeScore(parseInt(v))} className="mt-1" min={0} max={assignment?.max_score} />
              </div>
              <div>
                <label className="text-sm font-medium">Feedback</label>
                <Textarea value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} className="mt-1" rows={4} placeholder="Provide feedback for the student..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setGradingSubmission(null)}>Cancel</Button>
                <Button onClick={handleGrade}>Submit Grade</Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  )
}