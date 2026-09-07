import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { paymentsApi } from '../services/api'
import { Spinner } from '../components/ui/Spinner'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAppStore } from '../stores/appStore'

export function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAppStore((state) => state.auth.user)
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')
  const [courseId, setCourseId] = useState<string | null>(null)

  const myCoursesPath = user?.role === 'lecturer' ? '/app/lecturer/courses' : '/app/student/courses'
  const browsePath = user?.role === 'lecturer' ? '/app/lecturer/dashboard' : '/app/student/browse'

  useEffect(() => {
    const paymentId = searchParams.get('payment_id') || searchParams.get('vnp_TxnRef') || searchParams.get('orderId')
    const statusCode = searchParams.get('vnp_ResponseCode') || searchParams.get('resultCode')

    const verifyPayment = async () => {
      if (!paymentId) {
        setStatus('failed')
        setMessage('Không tìm thấy thông tin thanh toán')
        return
      }

      try {
        const res = await paymentsApi.getStatus(paymentId)
        const paymentStatus = res.data.status
        if (res.data.course_id) {
          setCourseId(res.data.course_id)
        }

        if (paymentStatus === 'paid' || statusCode === '00' || statusCode === '0') {
          setStatus('success')
          setMessage('Thanh toán thành công! Bạn có thể bắt đầu học ngay.')
        } else if (statusCode === '24') {
          setStatus('failed')
          setMessage('Thanh toán đã bị hủy')
        } else {
          setStatus('failed')
          setMessage(`Thanh toán thất bại. Mã lỗi: ${statusCode || paymentStatus}`)
        }
      } catch (err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        if (statusCode === '00' || statusCode === '0') {
          setStatus('success')
          setMessage('Thanh toán thành công! Bạn có thể bắt đầu học ngay.')
        } else {
          setStatus('failed')
          setMessage(axiosErr?.response?.data?.detail || 'Không thể xác minh thanh toán')
        }
      }
    }

    verifyPayment()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <Card className="max-w-md w-full p-8 text-center shadow-lg border">
        {status === 'loading' && (
          <>
            <Spinner className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Đang xác minh thanh toán...</h2>
            <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 text-green-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-600">Thanh toán thành công!</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {courseId ? (
                <Button onClick={() => navigate(`/app/student/courses/${courseId}/learn`)}>
                  Vào học ngay
                </Button>
              ) : null}
              <Button
                variant={courseId ? 'outline' : 'primary'}
                onClick={() => navigate(myCoursesPath)}
              >
                Khóa học của tôi
              </Button>
              <Button variant="outline" onClick={() => navigate(browsePath)}>
                Khám phá thêm
              </Button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✗</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-600">Thanh toán chưa hoàn tất</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(browsePath)}>
                Quay lại danh mục
              </Button>
              <Button onClick={() => navigate(myCoursesPath)}>
                Khóa học của tôi
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}