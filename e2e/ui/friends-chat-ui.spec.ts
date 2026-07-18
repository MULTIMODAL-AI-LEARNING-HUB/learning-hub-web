import { expect, test } from '@playwright/test'

const BASE_URL = process.env.E2E_WEB_BASE ?? 'http://localhost:5173'
const owner = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'friends.owner@test.com',
  full_name: 'Friends Owner',
  avatar_url: null,
  role: 'student',
  created_at: '2026-07-19T00:00:00Z',
  quota: null,
}
const member = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'friends.member@test.com',
  full_name: 'Friends Member',
  avatar_url: null,
  role: 'student',
}

test.describe('Friends Chat UI', () => {
  test('student creates a group and sends a visible message', async ({ page }) => {
    const rooms: Array<{
      id: string
      name: string
      description: string | null
      kind: 'group'
      member_count: number
      last_message: string | null
      updated_at: string
    }> = []
    const messagesByRoom = new Map<string, Array<{
      id: string
      room_id: string
      sender_id: string
      sender_name: string
      sender_avatar_url: string | null
      sender_role: string
      content: string
      created_at: string
    }>>()

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(owner) })
    })
    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, unread_count: 0 }),
      })
    })
    await page.route('**/api/v1/dashboard/my-dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          enrolled_courses: 0,
          in_progress_courses: 0,
          completed_courses: 0,
          average_progress: 0,
        }),
      })
    })
    await page.route('**/api/v1/social-chat/users**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([member]) })
    })
    await page.route('**/api/v1/social-chat/rooms', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() as { name: string; description?: string }
        const room = {
          id: '33333333-3333-4333-8333-333333333333',
          name: payload.name,
          description: payload.description ?? null,
          kind: 'group' as const,
          member_count: 2,
          last_message: null,
          updated_at: new Date().toISOString(),
        }
        rooms.unshift(room)
        messagesByRoom.set(room.id, [])
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(room) })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: rooms, total: rooms.length }),
      })
    })
    await page.route('**/api/v1/social-chat/rooms/*/messages**', async (route) => {
      const url = new URL(route.request().url())
      const roomId = url.pathname.split('/').at(-2) ?? ''
      const roomMessages = messagesByRoom.get(roomId) ?? []

      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() as { content: string }
        const message = {
          id: crypto.randomUUID(),
          room_id: roomId,
          sender_id: owner.id,
          sender_name: owner.full_name,
          sender_avatar_url: null,
          sender_role: owner.role,
          content: payload.content,
          created_at: new Date().toISOString(),
        }
        roomMessages.push(message)
        messagesByRoom.set(roomId, roomMessages)
        rooms.forEach((room) => {
          if (room.id === roomId) {
            room.last_message = message.content
            room.updated_at = message.created_at
          }
        })
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(message) })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: roomMessages, total: roomMessages.length }),
      })
    })

    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-token')
      localStorage.setItem('token', 'mock-token')
    })
    await page.goto(`${BASE_URL}/app/student/friends-chat`)
    await expect(page.getByRole('heading', { name: 'Friends Chat' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('friends-chat-shell')).toBeVisible()

    await page.getByRole('button', { name: /create group/i }).first().click()
    await page.getByPlaceholder('Example: HSK 1 study group').fill('UI Friends Group')
    await page.getByPlaceholder('Search by name or email...').fill(member.email)
    await expect(page.getByText(member.email)).toBeVisible()
    await page.getByText(member.email).click()
    await page.getByRole('dialog', { name: 'Create study group' }).getByRole('button', { name: /^Create group$/i }).click()

    await expect(page.getByRole('heading', { name: 'UI Friends Group' })).toBeVisible()
    const message = 'UI hello from mocked E2E'
    await page.getByPlaceholder(/Message UI Friends Group/i).fill(message)
    await page.getByRole('button', { name: /send message/i }).click()
    await expect(page.getByTestId('friends-chat-messages').getByText(message)).toBeVisible()
    await expect(page.getByTestId('friends-chat-composer')).toBeInViewport()
  })
})
