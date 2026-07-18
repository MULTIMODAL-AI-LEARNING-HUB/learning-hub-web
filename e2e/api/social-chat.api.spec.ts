import { expect, request, test } from '@playwright/test'

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:8000/api/v1/'
const PASSWORD = 'TestPass123!'

async function registerAndLogin(email: string, fullName: string) {
  const api = await request.newContext({ baseURL: API_BASE })
  await api.post('auth/register', {
    data: { email, password: PASSWORD, full_name: fullName, role: 'student' },
  }).catch(() => {})

  const login = await api.post('auth/login', {
    data: { email, password: PASSWORD },
  })
  expect(login.status()).toBe(200)
  const body = await login.json()
  const accessToken = body.token?.access_token || body.access_token
  expect(accessToken).toBeTruthy()

  return request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
  })
}

test.describe('Friends Chat API', () => {
  test('creates a group, finds a member, sends a message, and reloads persisted messages', async () => {
    const ts = Date.now()
    const ownerEmail = `friends_owner_${ts}@test.com`
    const memberEmail = `friends_member_${ts}@test.com`
    const ownerApi = await registerAndLogin(ownerEmail, 'Friends Owner')
    await registerAndLogin(memberEmail, 'Friends Member')

    const search = await ownerApi.get('social-chat/users', { params: { q: memberEmail } })
    expect(search.status()).toBe(200)
    const users = await search.json()
    const member = users.find((user: { email: string }) => user.email === memberEmail)
    expect(member?.id).toBeTruthy()

    const createRoom = await ownerApi.post('social-chat/rooms', {
      data: {
        name: `E2E Friends Group ${ts}`,
        description: 'Created by friends chat E2E',
        member_ids: [member.id],
      },
    })
    expect(createRoom.status()).toBe(201)
    const room = await createRoom.json()
    expect(room.member_count).toBe(2)

    const content = `Hello from friends chat ${ts}`
    const send = await ownerApi.post(`social-chat/rooms/${room.id}/messages`, {
      data: { content },
    })
    expect(send.status()).toBe(201)
    const sent = await send.json()
    expect(sent.content).toBe(content)
    expect(sent.sender_name).toBeTruthy()

    const messages = await ownerApi.get(`social-chat/rooms/${room.id}/messages`)
    expect(messages.status()).toBe(200)
    const messageBody = await messages.json()
    expect(messageBody.items.some((message: { content: string }) => message.content === content)).toBeTruthy()

    const rooms = await ownerApi.get('social-chat/rooms')
    expect(rooms.status()).toBe(200)
    const roomsBody = await rooms.json()
    expect(roomsBody.items.some((item: { id: string; last_message: string | null }) => (
      item.id === room.id && item.last_message === content
    ))).toBeTruthy()
  })
})
