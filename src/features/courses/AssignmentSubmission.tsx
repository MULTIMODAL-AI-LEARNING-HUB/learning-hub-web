import { useState } from 'react'
import { assignmentsApi, type Assignment, type AssignmentSubmission as Sub } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { FileText, Clock, CheckCircle, XCircle, Paperclip, Upload, Trash2, Download } from 'lucide-react'
import { useToast } from '../../components/ui/useToast'

interface Props {
  lessonId: string
  assignment: Assignment
}

export function AssignmentSubmissionView({ lessonId, assignment }: Props) {
  const toast = useToast()
  const [submissions, setSubmissions] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [subText, setSubText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ file_name: string; file_url: string; file_size?: number; file_type?: string }[]>([])
  const [uploading, setUploading] = useState(false)

  useState(() => {
    assignmentsApi.getSubmissions(assignment.id).then(res => {
      setSubmissions(res.data.items)
    }).catch(() => {}).finally(() => setLoading(false))
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const res = await assignmentsApi.uploadSubmissionFile(lessonId, file)
        const newFile = {
          file_name: res.data.file_name,
          file_url: res.data.storage_key, // Save key
          file_size: res.data.file_size,
          file_type: res.data.file_type
        }
        setUploadedFiles(prev => [...prev, newFile])
      }
      toast({ type: 'success', title: 'File(s) uploaded successfully' })
    } catch (err) {
      console.error(err)
      toast({ type: 'error', title: 'Failed to upload file(s)' })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!subText.trim() && uploadedFiles.length === 0) return
    setSubmitting(true)
    try {
      const res = await assignmentsApi.submit(lessonId, { 
        submission_text: subText,
        attachments: uploadedFiles.map(f => ({
          file_name: f.file_name,
          file_url: f.file_url
        }))
      })
      setSubmissions(prev => [res.data, ...prev])
      setSubText('')
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
                  
                  {sub.attachments && sub.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {sub.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs bg-muted/30 hover:bg-muted/50 p-2 rounded border border-border/50 max-w-fit transition-colors">
                          <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-medium text-foreground truncate max-w-[200px]">{file.file_name}</span>
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline ml-2 flex items-center gap-1 font-semibold"
                          >
                            <Download className="h-3 w-3" />
                            Tải về
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground/70 mt-1.5">
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
        <Card className="p-4 space-y-4 bg-surface-elevated border border-border shadow-lift rounded-xl">
          <textarea
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            placeholder="Write your submission text..."
            className="w-full min-h-[100px] rounded-lg border border-input bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">File đính kèm (Nộp bài)</label>
            
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-1 gap-2 max-w-md">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-2 bg-muted/40 border border-border/60 rounded-lg text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate font-medium text-foreground">{file.file_name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRemoveFile(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <label className="inline-block">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Button
                variant="outline"
                size="sm"
                as="span"
                loading={uploading}
                icon={<Upload className="h-3.5 w-3.5" />}
                className="cursor-pointer"
              >
                Chọn file đính kèm
              </Button>
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border/50">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || uploading || (!subText.trim() && uploadedFiles.length === 0)}
            >
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
