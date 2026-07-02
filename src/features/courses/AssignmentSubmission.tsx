import { useState } from 'react'
import { assignmentsApi, type Assignment, type AssignmentSubmission as Sub } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Props {
  lessonId: string
  assignment: Assignment
}

export function AssignmentSubmissionView({ lessonId, assignment }: Props) {
  const [submissions, setSubmissions] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [subText, setSubText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useState(() => {
    assignmentsApi.getSubmissions(assignment.id).then(res => {
      setSubmissions(res.data.items)
    }).catch(() => {}).finally(() => setLoading(false))
  })

  const handleSubmit = async () => {
    if (!subText.trim()) return
    setSubmitting(true)
    try {
      const res = await assignmentsApi.submit(lessonId, { submission_text: subText })
      setSubmissions(prev => [res.data, ...prev])
      setSubText('')
      setShowForm(false)
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const deadlinePassed = assignment.deadline ? new Date(assignment.deadline) < new Date() : false
  const canSubmit = !deadlinePassed || (deadlinePassed && assignment.allow_resubmit)

  if (loading) {
    return <Skeleton className="h-32 w-full" />
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{assignment.title}</h4>
            {assignment.description && <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>}
            {assignment.instructions && <p className="text-sm text-muted-foreground mt-1 italic">{assignment.instructions}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Max score: {assignment.max_score}</span>
              {assignment.deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due: {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                </span>
              )}
              <span>Resubmits: {assignment.allow_resubmit ? `${submissions.length}/${assignment.max_resubmits}` : 'No'}</span>
            </div>
          </div>
        </div>
      </Card>

      {submissions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Your Submissions</h4>
          {submissions.map((sub) => (
            <Card key={sub.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{sub.submission_text}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Submitted {new Date(sub.submitted_at).toLocaleDateString('vi-VN')}
                    {sub.is_late && <span className="text-warning ml-2">(Late)</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {sub.score !== null ? (
                    <div className="flex items-center gap-1">
                      {sub.score >= (assignment.max_score / 2) ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className={`text-sm font-medium ${sub.score >= (assignment.max_score / 2) ? 'text-success' : 'text-destructive'}`}>
                        {sub.score}/{assignment.max_score}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not graded</span>
                  )}
                  {sub.feedback && <p className="text-xs text-muted-foreground mt-1 italic">{sub.feedback}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm ? (
        <Card className="p-4 space-y-3">
          <textarea
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            placeholder="Write your submission..."
            className="w-full min-h-[100px] rounded-lg border border-input bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting || !subText.trim()}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </Card>
      ) : (
        canSubmit && (
          <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
            {submissions.length === 0 ? 'Submit Assignment' : 'Resubmit'}
          </Button>
        )
      )}

      {deadlinePassed && !assignment.allow_resubmit && submissions.length > 0 && (
        <p className="text-xs text-destructive">Deadline has passed. No more submissions allowed.</p>
      )}
    </div>
  )
}
