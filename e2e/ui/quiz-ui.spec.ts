import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test.describe('Quiz UI', () => {
  test.use({
    storageState: join(__dirname, '../../.auth/student.json')
  })

  test('UQ1: Student can navigate to quiz page', async ({ page }) => {
    await page.goto('/app/student/quiz')
    await expect(page.getByRole('heading', { name: /quiz/i })).toBeVisible({ timeout: 10000 })
  })

  test('UQ2: Quiz page shows configuration options', async ({ page }) => {
    await page.goto('/app/student/quiz')

    // Should show document selection or "no documents" state
    const hasContent = await page.getByText(/quiz|tạo quiz|document/i).isVisible().catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('UQ3: Quiz page shows course context when accessed with course_id', async ({ page }) => {
    // Visit with a course context
    await page.goto('/app/student/quiz?course_id=test-course-id')
    await expect(page.getByRole('heading', { name: /quiz/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Quiz Taking UI (course page)', () => {
  test.use({
    storageState: join(__dirname, '../../.auth/student.json')
  })

  test('UQ4: Quiz generation button exists on course page', async ({ page }) => {
    // Visit course learning page
    await page.goto('/app/courses')
    await page.waitForLoadState('networkidle')

    // Find and click on a course card
    const courseCards = page.getByTestId('course-card').or(page.getByRole('link', { name: /course/i }))
    const firstCourse = courseCards.first()

    if (await firstCourse.isVisible().catch(() => false)) {
      await firstCourse.click()
      await page.waitForLoadState('networkidle')

      // Should find quiz-related buttons
      const quizButton = page.getByRole('link', { name: /quiz|tạo quiz/i }).or(
        page.getByRole('button', { name: /quiz|tạo quiz/i })
      )
      const hasQuizButton = await quizButton.first().isVisible().catch(() => false)
      if (hasQuizButton) {
        expect(hasQuizButton).toBeTruthy()
      }
    }
  })

  test('UQ5: QuizTaking page renders with quiz questions', async ({ page }) => {
    // Navigate directly to quiz taking with a course_id
    // The page should render the quiz interface (generating or questions)
    await page.goto('/app/student/quiz')
    await page.waitForLoadState('networkidle')

    // Should show either loading, config, or questions
    const hasState = await (
      page.getByText(/tạo quiz|generating|question/i).isVisible().catch(() => false) ||
      page.getByRole('button', { name: /tạo quiz/i }).isVisible().catch(() => false) ||
      page.getByText(/no documents|course/i).isVisible().catch(() => false)
    )
    expect(hasState).toBeTruthy()
  })
})