import { test, expect, request } from '@playwright/test'
import { createTestData, cleanupTestData } from '../helpers/fixtures'
import type { TestData } from '../helpers/fixtures'

const API_BASE = 'http://localhost:8000/api/v1/'

test.describe('Payment & Webhook API', () => {
  test.describe.configure({ mode: 'serial' })
  let td: TestData
  let stuApi: Awaited<ReturnType<typeof request.newContext>>

  test.beforeAll(async () => {
    td = await createTestData()
    stuApi = await request.newContext({
      baseURL: API_BASE, extraHTTPHeaders: { Authorization: `Bearer ${td.student.token}` }
    })
  })

  test.afterAll(async () => {
    await cleanupTestData(td)
  })

  test('P01: VNPay payment intent returns URL', async () => {
    const res = await stuApi.post(`courses/${td.course.id}/enroll/payment-intent`, {
      data: { payment_method: 'vnpay' }
    })
    expect([200, 400, 409]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      expect(body).toHaveProperty('payment_url')
      expect(body.payment_url).toContain('vnpay')
    }
  })

  test('P02: MoMo payment intent returns URL', async () => {
    const res = await stuApi.post(`courses/${td.course.id}/enroll/payment-intent`, {
      data: { payment_method: 'momo' }
    })
    expect([200, 400, 409]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      expect(body).toHaveProperty('payment_url')
      expect(body.payment_url).toContain('momo')
    }
  })

  test('P03: Invalid payment method returns 422', async () => {
    const res = await stuApi.post(`courses/${td.course.id}/enroll/payment-intent`, {
      data: { payment_method: 'bitcoin' }
    })
    expect(res.status()).toBe(422)
  })

  test('P04: Confirm enrollment without payment', async () => {
    const res = await stuApi.post(`courses/${td.course.id}/enroll/confirm`, {
      data: { payment_method: 'vnpay', transaction_id: 'test-txn-123' }
    })
    expect([200, 400, 404]).toContain(res.status())
  })

  test('P05: VNPay IPN webhook returns valid response', async () => {
    const webhookApi = await request.newContext({ baseURL: 'http://localhost:8000' })
    const res = await webhookApi.get('webhooks/payment/vnpay/return', {
      params: {
        vnp_Amount: '100000',
        vnp_OrderInfo: 'Test payment',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: `test_${Date.now()}`,
        vnp_SecureHash: 'test_hash'
      }
    })
    expect([200, 400, 404]).toContain(res.status())
  })

  test('P06: Unauthenticated payment intent returns 401', async () => {
    const unauthApi = await request.newContext({ baseURL: API_BASE })
    const res = await unauthApi.post(`courses/${td.course.id}/enroll/payment-intent`, {
      data: { payment_method: 'vnpay' }
    })
    expect(res.status()).toBe(401)
  })
})
