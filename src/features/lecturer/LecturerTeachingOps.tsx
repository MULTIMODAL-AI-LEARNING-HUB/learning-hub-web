import { useMemo, useState } from 'react'
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Mail,
  Pin,
  Send,
  Sparkles,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Progress } from '../../components/ui/Progress'
import { Textarea } from '../../components/ui/Textarea'

interface LecturerTeachingOpsProps {
  courseId: string
  courseTitle: string
}

const lessonQuestions = [
  {
    id: 'qa-1',
    lesson: 'Lesson 2: Prompt decomposition',
    title: 'When should I split a prompt into multiple steps?',
    author: 'Minh Tran',
    replies: 3,
    pinned: true,
    answered: true,
  },
  {
    id: 'qa-2',
    lesson: 'Lesson 4: Evaluation rubric',
    title: 'How do I measure hallucination risk in practice?',
    author: 'Linh Pham',
    replies: 1,
    pinned: false,
    answered: false,
  },
]

const quizInsights = [
  { question: 'Identify the best retrieval strategy for long PDFs', wrongRate: 68, attempts: 42 },
  { question: 'Choose the right grounding citation', wrongRate: 54, attempts: 39 },
  { question: 'Select the correct evaluation metric', wrongRate: 41, attempts: 44 },
]

const exportRows = [
  { label: 'Student progress CSV', detail: 'Enrollment list, lesson completion, slow-progress flag' },
  { label: 'Gradebook XLSX', detail: 'Quiz attempts, assignment scores, lecturer feedback' },
  { label: 'Revenue report CSV', detail: 'Monthly revenue, refunds, paid enrollments' },
]

export function LecturerTeachingOps({ courseId, courseTitle }: LecturerTeachingOpsProps) {
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementBody, setAnnouncementBody] = useState('')
  const [announcementSent, setAnnouncementSent] = useState(false)
  const [outlineTopic, setOutlineTopic] = useState(courseTitle)
  const [assistantOutput, setAssistantOutput] = useState<string[]>([])

  const canPublish = announcementTitle.trim().length > 0 && announcementBody.trim().length > 0

  const assistantIdeas = useMemo(() => [
    `Module 1: Foundations of ${outlineTopic || courseTitle}`,
    'Module 2: Guided examples with short practice checks',
    'Module 3: Capstone task, rubric, and reflection prompt',
  ], [courseTitle, outlineTopic])

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card padding="responsive" className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Bell className="h-5 w-5 text-primary" />
                Course Announcements
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Broadcast course updates to enrolled students and mirror them into notifications.
              </p>
            </div>
            <Badge variant="primary" label={`Course ${courseId}`} />
          </div>
          <div className="mt-5 grid gap-3">
            <Input value={announcementTitle} onChange={setAnnouncementTitle} placeholder="Announcement title" aria-label="Announcement title" />
            <Textarea
              value={announcementBody}
              onChange={(event) => setAnnouncementBody(event.target.value)}
              placeholder="Write the update students need to see..."
              rows={4}
              aria-label="Announcement body"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
                Send notification and email
              </label>
              <Button
                onClick={() => setAnnouncementSent(true)}
                disabled={!canPublish}
                icon={<Send className="h-4 w-4" />}
              >
                Publish announcement
              </Button>
            </div>
            {announcementSent && (
              <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                Announcement queued for enrolled students.
              </div>
            )}
          </div>
        </Card>

        <Card padding="responsive">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Sparkles className="h-5 w-5 text-accent" />
            AI Teaching Assistant
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Generate a lesson outline, summary, or material brief from a topic.</p>
          <div className="mt-4 space-y-3">
            <Input value={outlineTopic} onChange={setOutlineTopic} placeholder="Course topic" aria-label="AI outline topic" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button variant="outline" onClick={() => setAssistantOutput(assistantIdeas)}>Outline</Button>
              <Button variant="outline" onClick={() => setAssistantOutput(['Concise lesson summary created for the selected material.'])}>Summary</Button>
              <Button variant="outline" onClick={() => setAssistantOutput(['Transcript draft generated from uploaded video metadata.'])}>Transcript</Button>
            </div>
            {assistantOutput.length > 0 && (
              <div className="rounded-lg bg-muted/45 p-3 text-sm text-foreground">
                {assistantOutput.map((item) => <p key={item}>{item}</p>)}
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card padding="responsive">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            Lesson Q&A Forum
          </h2>
          <div className="mt-4 space-y-3">
            {lessonQuestions.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {item.pinned && <Pin className="h-4 w-4 text-primary" />}
                  <Badge variant={item.answered ? 'success' : 'warning'} label={item.answered ? 'Answered' : 'Needs reply'} />
                  <span className="text-xs text-muted-foreground">{item.lesson}</span>
                </div>
                <p className="mt-2 font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.author} · {item.replies} replies</p>
                <Button className="mt-3" size="sm" variant="outline" icon={<CheckCircle2 className="h-4 w-4" />}>Mark official answer</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="responsive">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            Export Data
          </h2>
          <div className="mt-4 space-y-3">
            {exportRows.map((row) => (
              <button key={row.label} className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3 text-left transition hover:bg-muted/40">
                <span>
                  <span className="block text-sm font-medium text-foreground">{row.label}</span>
                  <span className="block text-xs text-muted-foreground">{row.detail}</span>
                </span>
                <Download className="h-4 w-4 text-primary" />
              </button>
            ))}
          </div>
        </Card>

        <Card padding="responsive">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <BarChart3 className="h-5 w-5 text-amber-500" />
            Quiz Performance Analytics
          </h2>
          <div className="mt-4 space-y-4">
            {quizInsights.map((item) => (
              <div key={item.question}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{item.question}</span>
                  <span className="text-muted-foreground">{item.wrongRate}% wrong</span>
                </div>
                <Progress value={item.wrongRate} />
                <p className="mt-1 text-xs text-muted-foreground">{item.attempts} attempts reviewed</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card padding="responsive" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Mail className="h-5 w-5 text-primary" />
            Direct Message Workflow
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Slow-progress students below 10% can be reminded from the Students tab.</p>
        </div>
        <Badge variant="warning" label="Progress threshold: < 10%" />
      </Card>
    </div>
  )
}
