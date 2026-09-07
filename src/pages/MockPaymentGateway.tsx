import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { paymentsApi } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'

export function MockPaymentGateway() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const method = (searchParams.get('method') || 'vnpay').toLowerCase()
  const transactionId = searchParams.get('transaction_id') || ''
  const amountStr = searchParams.get('amount') || '0'
  const amount = parseInt(amountStr, 10) || 0
  const orderInfo = searchParams.get('order_info') || 'Thanh toán khóa học'
  const mockToken = searchParams.get('token') || ''

  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'qr' | 'atm'>('qr')

  const isMoMo = method === 'momo'
  const brandName = isMoMo ? 'MoMo' : 'VNPAY-QR'
  const brandColor = isMoMo ? 'text-pink-600' : 'text-blue-600'
  const brandBg = isMoMo ? 'bg-pink-600' : 'bg-blue-600'

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleCopyTxn = () => {
    if (!transactionId) return
    navigator.clipboard.writeText(transactionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSimulate = async (action: 'success' | 'cancel' | 'fail') => {
    if (!transactionId) {
      alert('Không tìm thấy mã giao dịch')
      return
    }

    setLoadingAction(action)
    try {
      if (mockToken) {
        await paymentsApi.mockConfirm({
          transaction_id: transactionId,
          action,
          mock_token: mockToken,
        })
      }

      if (action === 'success') {
        const query = new URLSearchParams({
          vnp_ResponseCode: '00',
          resultCode: '0',
          vnp_TxnRef: transactionId,
          orderId: transactionId,
          payment_id: transactionId,
        })
        navigate(`/payment/return?${query.toString()}`)
      } else if (action === 'cancel') {
        const query = new URLSearchParams({
          vnp_ResponseCode: '24',
          resultCode: '1008',
          vnp_TxnRef: transactionId,
          orderId: transactionId,
          payment_id: transactionId,
        })
        navigate(`/payment/return?${query.toString()}`)
      } else {
        const query = new URLSearchParams({
          vnp_ResponseCode: '51',
          resultCode: '1001',
          vnp_TxnRef: transactionId,
          orderId: transactionId,
          payment_id: transactionId,
        })
        navigate(`/payment/return?${query.toString()}`)
      }
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      alert(axiosErr?.response?.data?.detail || 'Thao tác giả lập thất bại')
      setLoadingAction(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      {/* Sandbox Notice Banner */}
      <div className="max-w-3xl w-full mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧪</span>
          <div>
            <div className="font-semibold text-sm">Chế độ Giả lập Cổng Thanh toán (Sandbox Simulator)</div>
            <div className="text-xs opacity-80">
              Bạn đang ở giao diện mô phỏng thanh toán an toàn. Không trừ tiền thật.
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          label="MOCK MODE"
          className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-xs"
        />
      </div>

      <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Payment Details & QR */}
        <Card className="md:col-span-7 p-6 border shadow-lg bg-white dark:bg-slate-800 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shadow ${brandBg}`}>
                {isMoMo ? 'M' : 'V'}
              </div>
              <div>
                <h1 className={`font-bold text-lg leading-tight ${brandColor}`}>
                  {brandName}
                </h1>
                <p className="text-xs text-muted-foreground">Cổng thanh toán điện tử mô phỏng</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Thời gian còn lại</div>
              <div className="font-mono text-sm font-semibold text-rose-600">
                ⏱ {formatCountdown(timeLeft)}
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tổng tiền:</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {formatMoney(amount)}
            </span>
          </div>

          {/* Method Tabs */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700/50 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2 text-center rounded-md transition ${
                activeTab === 'qr'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Quét mã QR {brandName}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('atm')}
              className={`flex-1 py-2 text-center rounded-md transition ${
                activeTab === 'atm'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Thẻ ATM nội địa (NCB Demo)
            </button>
          </div>

          {activeTab === 'qr' ? (
            <div className="text-center space-y-4 py-2">
              {/* Realistic QR Frame */}
              <div className="relative inline-block p-4 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl shadow-inner">
                <svg
                  viewBox="0 0 200 200"
                  className="w-48 h-48 mx-auto"
                  fill="currentColor"
                >
                  {/* Outer corner markers */}
                  <rect x="10" y="10" width="50" height="50" rx="6" fill="#0f172a" />
                  <rect x="20" y="20" width="30" height="30" rx="3" fill="#ffffff" />
                  <rect x="26" y="26" width="18" height="18" rx="2" fill="#0f172a" />

                  <rect x="140" y="10" width="50" height="50" rx="6" fill="#0f172a" />
                  <rect x="150" y="20" width="30" height="30" rx="3" fill="#ffffff" />
                  <rect x="156" y="26" width="18" height="18" rx="2" fill="#0f172a" />

                  <rect x="10" y="140" width="50" height="50" rx="6" fill="#0f172a" />
                  <rect x="20" y="150" width="30" height="30" rx="3" fill="#ffffff" />
                  <rect x="26" y="156" width="18" height="18" rx="2" fill="#0f172a" />

                  {/* Decorative QR data matrix blocks */}
                  <rect x="70" y="15" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="90" y="15" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="110" y="25" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="75" y="45" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="100" y="45" width="12" height="12" rx="2" fill="#0f172a" />

                  <rect x="20" y="75" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="40" y="90" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="15" y="115" width="12" height="12" rx="2" fill="#0f172a" />

                  <rect x="145" y="75" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="165" y="95" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="145" y="115" width="12" height="12" rx="2" fill="#0f172a" />

                  <rect x="70" y="145" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="90" y="165" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="110" y="145" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="140" y="155" width="12" height="12" rx="2" fill="#0f172a" />
                  <rect x="165" y="165" width="12" height="12" rx="2" fill="#0f172a" />

                  {/* Center branding icon */}
                  <circle cx="100" cy="100" r="24" fill={isMoMo ? '#db2777' : '#2563eb'} />
                  <text
                    x="100"
                    y="106"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="16"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {isMoMo ? 'MoMo' : 'QR'}
                  </text>
                </svg>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/50 shadow-md animate-pulse pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Mở ứng dụng {isMoMo ? 'Ví MoMo' : 'Ngân hàng hỗ trợ VNPAY-QR'} quét mã để thanh toán.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 border rounded-xl p-4 space-y-3 text-xs">
              <div className="font-semibold text-slate-700 dark:text-slate-200">
                Thông tin thẻ thử nghiệm VNPAY Sandbox:
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                <div>Ngân hàng: <span className="font-medium text-slate-900 dark:text-white">NCB</span></div>
                <div>Tên chủ thẻ: <span className="font-medium text-slate-900 dark:text-white">NGUYEN VAN A</span></div>
                <div>Số thẻ: <span className="font-mono text-slate-900 dark:text-white">9704198526191432198</span></div>
                <div>Ngày phát hành: <span className="font-mono text-slate-900 dark:text-white">07/15</span></div>
                <div>Mã OTP: <span className="font-mono text-slate-900 dark:text-white">123456</span></div>
              </div>
            </div>
          )}

          {/* Order Details Accordion / Summary */}
          <div className="border-t pt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nội dung:</span>
              <span className="font-medium text-right max-w-xs truncate">{orderInfo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Mã đơn hàng:</span>
              <button
                type="button"
                onClick={handleCopyTxn}
                className="font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {transactionId ? `${transactionId.slice(0, 16)}...` : 'N/A'}
                <span>{copied ? '✓ Đã chép' : '📋'}</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Right Column: Sandbox Simulator Controls */}
        <Card className="md:col-span-5 p-6 border shadow-lg bg-white dark:bg-slate-800 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎮</span> Giả lập Hành động Thanh toán
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Chọn 1 trong các kịch bản thực tế bên dưới để kiểm thử flow hệ thống:
            </p>
          </div>

          <div className="space-y-3">
            {/* Success Scenario */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Kịch bản 1: Quét mã thành công
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                  200 OK
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Mô phỏng tiền đã vào tài khoản, hệ thống sẽ kích hoạt ghi danh và chuyển bạn vào học ngay.
              </p>
              <Button
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 shadow"
                disabled={loadingAction !== null}
                onClick={() => handleSimulate('success')}
              >
                {loadingAction === 'success' ? (
                  <Spinner className="w-4 h-4 mr-2" />
                ) : (
                  '✓ Giả lập: Thanh toán Thành công'
                )}
              </Button>
            </div>

            {/* Cancel Scenario */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                  Kịch bản 2: Hủy thanh toán
                </span>
                <span className="text-[10px] text-slate-500 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  Code 24
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Mô phỏng người dùng đổi ý và đóng tab hoặc bấm nút hủy giao dịch trên app ngân hàng.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs font-medium py-2 hover:bg-slate-100"
                disabled={loadingAction !== null}
                onClick={() => handleSimulate('cancel')}
              >
                {loadingAction === 'cancel' ? (
                  <Spinner className="w-4 h-4 mr-2" />
                ) : (
                  '✕ Giả lập: Hủy Giao dịch'
                )}
              </Button>
            </div>

            {/* Fail Scenario */}
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-rose-700 dark:text-rose-300">
                  Kịch bản 3: Lỗi thẻ / Thiếu số dư
                </span>
                <span className="text-[10px] text-rose-600 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                  Code 51
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Mô phỏng trường hợp thẻ không đủ số dư hoặc tài khoản bị khóa.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs font-medium py-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                disabled={loadingAction !== null}
                onClick={() => handleSimulate('fail')}
              >
                {loadingAction === 'fail' ? (
                  <Spinner className="w-4 h-4 mr-2" />
                ) : (
                  '⚠ Giả lập: Lỗi Giao dịch'
                )}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-slate-900"
              onClick={() => navigate(-1)}
              disabled={loadingAction !== null}
            >
              ← Quay lại trang trước
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
export default MockPaymentGateway
