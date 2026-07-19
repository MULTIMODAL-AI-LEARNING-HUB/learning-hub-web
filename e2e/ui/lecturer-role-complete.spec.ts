import { expect, test, type Page } from '@playwright/test'

const lecturer = {
  id: 'lecturer-1',
  email: 'lecturer@example.com',
  full_name: 'E2E Lecturer',
  avatar_url: null,
  role: 'lecturer',
  created_at: '2026-07-01T00:00:00Z',
}

const course = {
  id: 'course-1',
  title: 'Applied Multimodal AI',
  description: 'Build production-ready multimodal learning workflows.',
  thumbnail_url: null,
  price: 1200000,
  category_id: 'ai',
  lecturer_id: lecturer.id,
  status: 'published',
  level: 'intermediate',
  language: 'Vietnamese',
  requirements: null,
  learning_outcomes: null,
  tags: 'ai,multimodal',
  view_count: 120,
  rating_avg: 4.7,
  rating_count: 18,
  enrollment_count: 2,
  materials: [],
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-18T00:00:00Z',
}

const students = [
  {
    id: 'enrollment-1',
    user_id: 'student-1',
    student_id: 'student-1',
    course_id: course.id,
    enrolled_at: '2026-07-10T00:00:00Z',
    completed_at: null,
    progress_percent: 6,
    status: 'active',
    payment_id: 'payment-1',
    payment_status: 'paid',
    student_name: 'An Nguyen',
    student_email: 'an@example.com',
  },
  {
    id: 'enrollment-2',
    user_id: 'student-2',
    student_id: 'student-2',
    course_id: course.id,
    enrolled_at: '2026-07-12T00:00:00Z',
    completed_at: null,
    progress_percent: 84,
    status: 'active',
    payment_id: 'payment-2',
    payment_status: 'paid',
    student_name: 'Binh Le',
    student_email: 'binh@example.com',
  },
]

test.describe('Lecturer complete teaching workflow', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'lecturer-token')
      localStorage.setItem('refresh_token', 'lecturer-refresh')
    })
  })

  test('covers dashboard, student progress, announcements, Q&A, AI assistant, exports, and quiz analytics', async ({ page }) => {
    await page.goto('/app/lecturer/dashboard')

    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()
    await expect(page.getByText('Total students')).toBeVisible()
    await page.getByText('Applied Multimodal AI').click()

    await expect(page).toHaveURL(/\/app\/lecturer\/courses\/course-1/)
    await expect(page.getByRole('heading', { name: 'Applied Multimodal AI' })).toBeVisible()

    const courseTabs = page.locator('main').getByRole('navigation')
    await courseTabs.getByRole('button', { name: 'Students' }).click()
    await expect(page.getByText('An Nguyen')).toBeVisible()
    await page.getByRole('button', { name: 'View details' }).first().click()
    await expect(page.getByRole('dialog')).toContainText('Lesson completion')
    await expect(page.getByRole('dialog')).toContainText('Quiz attempts')
    await expect(page.getByText('Slow progress detected')).toBeVisible()
    await page.getByRole('button', { name: 'Send reminder' }).click()
    await expect(page.getByText('Reminder message sent.')).toBeVisible()
    await page.getByLabel('Close student progress details').click()

    await courseTabs.getByRole('button', { name: 'Teaching Ops' }).click()
    await expect(page.getByRole('heading', { name: 'Course Announcements' })).toBeVisible()
    await page.getByLabel('Announcement title').fill('Updated lesson 5 materials')
    await page.getByLabel('Announcement body').fill('The new worksheet and examples are now available.')
    await page.getByRole('button', { name: 'Publish announcement' }).click()
    await expect(page.getByText('Announcement queued for enrolled students.')).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Lesson Q&A Forum' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark official answer' }).first()).toBeVisible()

    await page.getByLabel('AI outline topic').fill('Multimodal retrieval systems')
    await page.getByRole('button', { name: 'Outline' }).click()
    await expect(page.getByText('Module 1: Foundations of Multimodal retrieval systems')).toBeVisible()

    await expect(page.getByText('Student progress CSV')).toBeVisible()
    await expect(page.getByText('Gradebook XLSX')).toBeVisible()
    await expect(page.getByText('Revenue report CSV')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Quiz Performance Analytics' })).toBeVisible()
    await expect(page.getByText(/68% wrong/)).toBeVisible()
  })
})

async function mockApi(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname

    if (path.endsWith('/auth/me')) {
      await route.fulfill({ json: lecturer })
      return
    }

    if (path.endsWith('/courses/stats')) {
      await route.fulfill({
        json: {
          total_courses: 1,
          total_students: 2,
          total_revenue: 2400000,
          avg_rating: 4.7,
          recent_enrollments: [{ date: '2026-07-18', count: 2 }],
          course_stats: [{ course_id: course.id, title: course.title, enrollment_count: 2, revenue: 2400000, rating_avg: 4.7 }],
        },
      })
      return
    }

    if (path.endsWith('/courses/lecturer')) {
      await route.fulfill({ json: { items: [course], total: 1, page: 1, page_size: 20 } })
      return
    }

    if (path.endsWith(`/courses/${course.id}`)) {
      await route.fulfill({ json: course })
      return
    }

    if (path.endsWith(`/courses/${course.id}/enrolled-students`)) {
      await route.fulfill({ json: { items: students, total: students.length } })
      return
    }

    if (path.endsWith(`/courses/${course.id}/sections`)) {
      await route.fulfill({ json: [] })
      return
    }

    await route.fulfill({ json: { items: [], total: 0 } })
  })
}
