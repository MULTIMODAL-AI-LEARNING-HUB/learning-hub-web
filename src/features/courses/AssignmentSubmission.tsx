/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type ChangeEvent } from 'react'
import { CheckCircle, Clock, Download, FileText, Paperclip, Trash2, Upload, XCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/useToast'
import { assignmentsApi, type Assignment, type AssignmentSubmission as Submission } from '../../services/api'

interface AssignmentSubmissionViewProps {
  lessonId: string
  assignment: Assignment
}

interface UploadedFile {
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
}

export function AssignmentSubmissionView({ lessonId, assignment }: AssignmentSubmissionViewProps) {
  const toast = useToast()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [submissionText, setSubmissionText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    assignmentsApi.getMySubmissions(lessonId)
      .then((res) => {
        if (!cancelled) setSubmissions(res.data)
      })
      .catch(() => {
        if (!cancelled) setSubmissions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lessonId])

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const res = await assignmentsApi.uploadSubmissionFile(lessonId, file)
          return {
            file_name: res.data.file_name,
            file_url: res.data.storage_key,
            file_size: res.data.file_size,
            file_type: res.data.file_type,
          }
        })
      )
      setUploadedFiles((current) => [...current, ...uploaded])
      toast({ type: 'success', title: 'Files uploaded successfully' })
    } catch (err) {
      console.error(err)
      toast({ type: 'error', title: 'Failed to upload files' })
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!submissionText.trim() && uploadedFiles.length === 0) return

    setSubmitting(true)
    try {
      const res = await assignmentsApi.submit(lessonId, {
        submission_text: submissionText,
        attachments: uploadedFiles.map((file) => ({
          file_name: file.file_name,
          file_url: file.file_url,
        })),
      })
      setSubmissions((current) => [res.data, ...current])
      setSubmissionText('')
      setUploadedFiles([])
      setShowForm(false)
      toast({ type: 'success', title: 'Assignment submitted successfully' })
    } catch {
      toast({ type: 'error', title: 'Failed to submit assignment' })
    } finally {
      setSubmitting(false)
    }
  }

  const deadlinePassed = assignment.deadline ? new Date(assignment.deadline) < new Date() : false
  const canSubmit = !deadlinePassed || assignment.allow_resubmit

  if (loading) {
    return <Skeleton className="h-32 w-full" />
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-foreground">{assignment.title}</h4>
            {assignment.description && <p className="mt-1 text-sm text-muted-foreground">{assignment.description}</p>}
            {assignment.instructions && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{assignment.instructions}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Max score: {assignment.max_score}</span>
              {assignment.deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due: {new Date(assignment.deadline).toLocaleDateString()}
                </span>
              )}
              <span>
                Resubmits: {assignment.allow_resubmit ? `${submissions.length}/${assignment.max_resubmits}` : 'Not allowed'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {submissions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Your submissions</h4>
          {submissions.map((submission) => (
            <Card key={submission.id} className="p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  {submission.submission_text && (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{submission.submission_text}</p>
                  )}

                  {submission.attachments && submission.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {submission.attachments.map((file, index) => (
                        <div
                          key={`${file.file_name}-${index}`}
                          className="flex max-w-fit items-center gap-2 rounded border border-border/50 bg-muted/30 p-2 text-xs transition-colors hover:bg-muted/50"
                        >
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="max-w-[200px] truncate font-medium text-foreground">{file.file_name}</span>
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-1.5 text-xs text-muted-foreground/70">
                    Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                    {submission.is_late && <span className="ml-2 text-warning">(Late)</span>}
                  </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  {submission.score !== null ? (
                    <div className="flex items-center gap-1 sm:justify-end">
                      {submission.score >= assignment.max_score / 2 ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className={submission.score >= assignment.max_score / 2 ? 'text-sm font-medium text-success' : 'text-sm font-medium text-destructive'}>
                        {submission.score}/{assignment.max_score}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not graded</span>
                  )}
                  {submission.feedback && <p className="mt-1 text-xs italic text-muted-foreground">{submission.feedback}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm ? (
        <Card className="space-y-4 rounded-xl border border-border bg-surface-elevated p-4 shadow-lift">
          <textarea
            value={submissionText}
            onChange={(event) => setSubmissionText(event.target.value)}
            placeholder="Write your submission text..."
            className="min-h-[100px] w-full resize-y rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submission attachments</label>

            {uploadedFiles.length > 0 && (
              <div className="grid max-w-md grid-cols-1 gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={`${file.file_name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 p-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate font-medium text-foreground">{file.file_name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-destructive hover:bg-destructive/10"
                      onClick={() => setUploadedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                      aria-label={`Remove ${file.file_name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60">
              <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
              <Upload className="h-3.5 w-3.5" />
              {uploading ? 'Uploading...' : 'Choose attachment files'}
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || uploading || (!submissionText.trim() && uploadedFiles.length === 0)}
              loading={submitting}
            >
              Submit
            </Button>
          </div>
        </Card>
      ) : (
        canSubmit && (
          <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
            {submissions.length === 0 ? 'Submit assignment' : 'Resubmit'}
          </Button>
        )
      )}

      {deadlinePassed && !assignment.allow_resubmit && (
        <p className="text-xs text-destructive">The deadline has passed. New submissions are closed.</p>
      )}
    </div>
  )
}
