import { test, expect } from '@playwright/test'

const PROD_WEB_URL = process.env.PROD_WEB_URL ?? 'https://learninghubs.tech'
const PROD_API_URL = process.env.PROD_API_URL ?? 'https://learninghub-api-a89cebf8d45f.herokuapp.com'

test.describe('Production OAuth E2E Verification', () => {
  test('OAUTH-1: Backend production API has OAuth routes available', async ({ request }) => {
    // Check Google auth endpoint handles payload properly
    const googleRes = await request.post(`${PROD_API_URL}/api/v1/auth/google`, {
      data: { id_token: 'dummy_test_token_1234567890abcdef' }
    })
    // 400 Bad Request means endpoint is active, verified token format, and rejected dummy token
    expect(googleRes.status()).toBe(400)
    const googleBody = await googleRes.json()
    expect(googleBody.message).toContain('Invalid Google token')

    // Check Facebook auth endpoint handles payload properly
    const fbRes = await request.post(`${PROD_API_URL}/api/v1/auth/facebook`, {
      data: { access_token: 'dummy_test_token_1234567890abcdef' }
    })
    // 400 Bad Request means endpoint is active and Facebook token verification was reached
    expect(fbRes.status()).toBe(400)
    const fbBody = await fbRes.json()
    expect(fbBody.message).toContain('Invalid Facebook access token')
  })

  test('OAUTH-2: Frontend login page renders social login buttons', async ({ page }) => {
    await page.goto(`${PROD_WEB_URL}/login`, { waitUntil: 'networkidle' })

    const googleBtn = page.getByRole('button', { name: /google/i })
    await expect(googleBtn).toBeVisible()

    const facebookBtn = page.getByRole('button', { name: /facebook/i })
    await expect(facebookBtn).toBeVisible()
  })

  test('OAUTH-3: Facebook button triggers OAuth dialog or SDK with configured App ID', async ({ page, context }) => {
    await page.goto(`${PROD_WEB_URL}/login`, { waitUntil: 'networkidle' })

    const facebookBtn = page.getByRole('button', { name: /facebook/i })
    await expect(facebookBtn).toBeVisible()

    // Listen for popup or redirect
    const popupPromise = context.waitForEvent('page', { timeout: 8000 }).catch(() => null)
    await facebookBtn.click()
    const popup = await popupPromise

    if (popup) {
      const url = popup.url()
      console.log('Facebook popup URL:', url)
      expect(url).toContain('facebook.com')
      expect(url).toContain('885141314536567')
      await popup.close()
    } else {
      // Check if error message says "Chưa cấu hình Facebook App ID"
      const alert = page.getByRole('alert')
      if (await alert.isVisible()) {
        const text = await alert.innerText()
        console.log('Page alert text:', text)
        expect(text).not.toContain('Chưa cấu hình Facebook App ID')
      }
    }
  })

  test('OAUTH-4: Google button triggers Google OAuth flow with configured Client ID', async ({ page, context }) => {
    await page.goto(`${PROD_WEB_URL}/login`, { waitUntil: 'networkidle' })

    const googleBtn = page.getByRole('button', { name: /google/i })
    await expect(googleBtn).toBeVisible()

    const popupPromise = context.waitForEvent('page', { timeout: 8000 }).catch(() => null)
    await googleBtn.click()
    const popup = await popupPromise

    if (popup) {
      const url = popup.url()
      console.log('Google popup URL:', url)
      expect(url).toContain('accounts.google.com')
      expect(url).toContain('960032265898-rendmmncoirgn7r0am3o0limkq2j0ao4')
      await popup.close()
    } else {
      // If not a popup, check if no missing config alert
      const alert = page.getByRole('alert')
      if (await alert.isVisible()) {
        const text = await alert.innerText()
        console.log('Page alert text:', text)
        expect(text).not.toContain('Google OAuth client is not configured')
      }
    }
  })
})
