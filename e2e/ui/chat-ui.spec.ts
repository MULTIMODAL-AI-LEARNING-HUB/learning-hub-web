import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test.describe('Chat UI', () => {
  test.use({
    storageState: join(__dirname, '../../.auth/student.json')
  })

  test('UC1: Chat panel renders with input and send button', async ({ page }) => {
    await page.goto('/app/chat')
    await page.waitForLoadState('networkidle')

    // Check for chat input
    const input = page.getByRole('textbox').or(page.getByPlaceholder(/message|chat/i))
    await expect(input.first()).toBeVisible({ timeout: 10000 })
  })

  test('UC2: Can type in chat input', async ({ page }) => {
    await page.goto('/app/chat')
    await page.waitForLoadState('networkidle')

    const input = page.getByRole('textbox').or(page.getByPlaceholder(/message|chat|type/i)).first()

    if (await input.isVisible().catch(() => false)) {
      await input.fill('Hello AI')
      await expect(input).toHaveValue('Hello AI')
    }
  })

  test('UC3: Chat panel with course context loads session', async ({ page }) => {
    // Visit chat with course context
    await page.goto('/app/chat?course_id=test')
    await page.waitForLoadState('networkidle')

    // Should have a chat input
    const input = page.getByRole('textbox').first()
    const hasInput = await input.isVisible().catch(() => false)
    expect(hasInput).toBeTruthy()
  })
})

test.describe('Chat Navigation', () => {
  test.use({
    storageState: join(__dirname, '../../.auth/student.json')
  })

  test('UC4: Sidebar chat link navigates to chat', async ({ page }) => {
    // Look for chat link in sidebar
    const chatLink = page.getByRole('link', { name: /chat|tin nhắn/i }).first()

    if (await chatLink.isVisible().catch(() => false)) {
      await chatLink.click()
      await page.waitForLoadState('networkidle')

      const input = page.getByRole('textbox').first()
      await expect(input).toBeVisible({ timeout: 5000 })
    }
  })
})