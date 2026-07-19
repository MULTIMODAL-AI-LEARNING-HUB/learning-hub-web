# Lecturer Teaching Experience Tasks

## Task 1: Student Progress Details

- API contract: `GET /api/v1/courses/{course_id}/students/{student_id}/progress-detail`.
- Backend: return enrollment summary, lesson completion, quiz attempts, assignment status.
- Frontend: make student rows clickable, open progress modal, expose slow-progress reminder action.
- Notification: `POST /api/v1/courses/{course_id}/students/{student_id}/reminders`.
- Tests: modal content, quiz history, lesson completion states, reminder for progress below 10%.

## Task 2: Course Announcements

- API contract: CRUD announcements under `/api/v1/courses/{course_id}/announcements`.
- Backend: persist announcement, fan out notifications, enqueue email job.
- Frontend: add Teaching Ops announcement composer and announcement list.
- Student: show announcements in course learning page with comments.
- Tests: lecturer publishes, student receives notification, student comments.

## Task 3: Lesson Q&A Forum

- API contract: extend existing discussions with lesson-scoped Q&A actions.
- Backend: support pin, official answer, replies, unanswered counts.
- Frontend: lesson-level Q&A panel with tags, pinned state, official answer controls.
- Tests: student asks, lecturer replies, pins, marks official answer.

## Task 4: AI Teaching Assistant

- API contract: route through AI service, never call LLM directly from API gateway.
- Backend: `POST /api/v1/courses/{course_id}/ai/outline`, `/summary`, `/transcript`.
- AI service: LangGraph nodes for outline, material summary, transcript drafting.
- Frontend: AI assistant panel for outline, summary, transcript output.
- Tests: mocked AI success, fallback error state, generated content inserted into lesson editor.

## Task 5: Exporting Data

- API contract: `GET /api/v1/courses/{course_id}/exports/{kind}` with `csv` or `xlsx`.
- Backend: shared export service for progress, gradebook, revenue, avoiding duplicated formatting logic.
- Frontend: export buttons in Teaching Ops.
- Tests: each export downloads expected file type and includes required columns.

## Task 6: Quiz Performance Analytics

- API contract: `GET /api/v1/courses/{course_id}/quiz-analytics`.
- Backend: aggregate wrong-answer rate per question, attempts, lesson grouping.
- Frontend: show weakest questions and link back to lesson/quiz editor.
- Tests: wrong-rate chart renders, sorting puts highest wrong-rate first.

## End-to-End Acceptance

- Lecturer logs in and opens dashboard.
- Lecturer opens a course and reviews students.
- Lecturer opens one slow-progress student, reviews lesson and quiz history, sends reminder.
- Lecturer publishes a course announcement.
- Lecturer manages lesson Q&A and marks an official answer.
- Lecturer generates an AI outline/material helper output.
- Lecturer starts student progress, gradebook, and revenue exports.
- Lecturer reviews quiz questions with the highest wrong-answer rate.

Current E2E spec: `e2e/ui/lecturer-role-complete.spec.ts`.
