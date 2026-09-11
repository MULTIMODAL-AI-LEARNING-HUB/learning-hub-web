/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  Check,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from 'lucide-react'
import { authApi } from '../../services/api'
import { useAppStore } from '../../stores/appStore'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/useToast'

export function StudentProfile() {
  const toast = useToast()
  const user = useAppStore((s) => s.auth.user)
  const loadUser = useAppStore((s) => s.auth.loadUser)

  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [loading, setLoading] = useState(true)

  // Change password states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.name || '')
      setLoading(false)
    } else {
      loadUser()
        .then(() => setLoading(false))
        .catch(() => setLoading(false))
    }
  }, [user, loadUser])

  const displayName = fullName.trim() || user?.name || user?.email || 'Học viên'
  const initials = useMemo(() => {
    return displayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'HV'
  }, [displayName])

  const roleLabel = useMemo(() => {
    switch (user?.role) {
      case 'admin':
        return 'Quản trị viên'
      case 'lecturer':
        return 'Giảng viên'
      default:
        return 'Học viên'
    }
  }, [user?.role])

  const handleSaveProfile = async () => {
    const trimmed = fullName.trim()
    if (!trimmed) {
      toast({ type: 'warning', title: 'Vui lòng nhập họ và tên' })
      return
    }

    setSavingProfile(true)
    try {
      await authApi.updateMe({ full_name: trimmed })
      toast({ type: 'success', title: 'Cập nhật hồ sơ thành công' })
      await loadUser()
    } catch {
      toast({ type: 'error', title: 'Không thể cập nhật hồ sơ' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      toast({ type: 'warning', title: 'Vui lòng nhập mật khẩu hiện tại' })
      return
    }
    if (newPassword.length < 8) {
      toast({ type: 'warning', title: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
      return
    }
    if (newPassword === currentPassword) {
      toast({ type: 'warning', title: 'Mật khẩu mới phải khác mật khẩu hiện tại' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ type: 'warning', title: 'Mật khẩu xác nhận không khớp' })
      return
    }

    setSavingPassword(true)
    try {
      const res = await authApi.changePassword(currentPassword, newPassword)
      toast({ type: 'success', title: res.data.message || 'Đổi mật khẩu thành công' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await loadUser()
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.'
      toast({ type: 'error', title: errorMsg })
    } finally {
      setSavingPassword(false)
    }
  }

  const storageUsed = user?.quota?.storageUsed ?? 0
  const storageTotal = user?.quota?.storageTotal ?? 10240
  const storagePct = Math.min(100, Math.round((storageUsed / (storageTotal || 1)) * 100))

  const tokensUsed = user?.quota?.tokensUsed ?? 0
  const tokensTotal = user?.quota?.tokensTotal ?? 2000000
  const tokenPct = Math.min(100, Math.max(0, Math.round((tokensUsed / (tokensTotal || 1)) * 100)))

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in font-body">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-accent/5 to-surface-elevated p-5 sm:p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar fallback={initials} size="xl" className="ring-4 ring-surface-elevated shadow-md" />
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="primary" label={roleLabel} dot />
                <Badge variant="success" label="Đang hoạt động" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-surface-elevated/80 px-4 py-2.5 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-2xs text-muted-foreground font-medium">Hạn mức AI</p>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {tokensTotal >= 1000000 ? `${(tokensTotal / 1000000).toFixed(0)} Triệu Tokens` : `${tokensTotal} Tokens`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Main Column */}
        <div className="space-y-6">
          {/* Personal Info Card */}
          <Card padding="responsive" className="space-y-5 border-border shadow-soft bg-surface-elevated">
            <div className="flex items-center gap-2.5 border-b border-border pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Thông tin cá nhân</h2>
                <p className="text-xs text-muted-foreground">Cập nhật họ tên hiển thị trong hệ thống và giao lưu bạn bè.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Họ và tên</label>
                <Input
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Nhập họ và tên đầy đủ của bạn"
                  className="max-w-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Địa chỉ email</label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground select-none">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  <span className="truncate">{user?.email}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Vai trò tài khoản</label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground select-none">
                  <Award className="h-4 w-4 shrink-0 text-primary" />
                  <span>{roleLabel}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <Button
                onClick={handleSaveProfile}
                loading={savingProfile}
                icon={<Save className="h-4 w-4" />}
                className="font-medium"
              >
                Lưu thông tin
              </Button>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card padding="responsive" className="space-y-5 border-border shadow-soft bg-surface-elevated">
            <div className="flex items-center gap-2.5 border-b border-border pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Đổi mật khẩu</h2>
                <p className="text-xs text-muted-foreground">
                  Thay đổi mật khẩu đăng nhập để bảo vệ an toàn cho tài khoản và dữ liệu học tập.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Mật khẩu hiện tại</label>
                <div className="relative max-w-lg">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu bạn đang sử dụng"
                    className="w-full rounded-lg border border-input bg-surface-elevated px-3 py-2 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
                    aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
                      className="w-full rounded-lg border border-input bg-surface-elevated px-3 py-2 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
                      aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full rounded-lg border border-input bg-surface-elevated px-3 py-2 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
                      aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <Button
                  type="submit"
                  loading={savingPassword}
                  disabled={!currentPassword || !newPassword || !confirmPassword || savingPassword}
                  icon={<Lock className="h-4 w-4" />}
                  className="font-medium"
                >
                  Cập nhật mật khẩu
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar / Quota & Security Cards */}
        <div className="space-y-6">
          {/* Quotas Card */}
          <Card padding="responsive" className="space-y-4 border-border shadow-soft bg-surface-elevated">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-foreground">Tài nguyên & Hạn mức</h3>
            </div>

            <div className="space-y-4">
              {/* Storage quota */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Database className="h-3.5 w-3.5 text-muted-foreground" />
                    Dung lượng lưu trữ
                  </span>
                  <span className="font-semibold text-muted-foreground tabular-nums">
                    {storageUsed >= 1024 ? `${(storageUsed / 1024).toFixed(1)}GB` : `${Math.round(storageUsed)}MB`} /{' '}
                    {storageTotal >= 1024 ? `${(storageTotal / 1024).toFixed(0)}GB` : `${storageTotal}MB`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.max(3, storagePct)}%` }}
                  />
                </div>
                <p className="text-2xs text-muted-foreground">Đã sử dụng {storagePct}% tổng dung lượng lưu tài liệu.</p>
              </div>

              {/* AI Token quota */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Zap className="h-3.5 w-3.5 text-purple-500 fill-purple-500/20" />
                    Hạn mức Token AI
                  </span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400 tabular-nums">
                    {tokensUsed.toLocaleString('vi-VN')} / {tokensTotal.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${Math.max(1, tokenPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-2xs text-muted-foreground">
                  <span>Hạn mức tối đa: 2.000.000 AI</span>
                  <span>{tokenPct}% đã dùng</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80 leading-relaxed">
              Token AI được trừ tự động khi sử dụng Trò chuyện AI, Tạo đề thi trắc nghiệm và Flashcards từ tài liệu.
            </div>
          </Card>

          {/* Account & Security Card */}
          <Card padding="responsive" className="space-y-3.5 border-border shadow-soft bg-surface-elevated">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-foreground">Bảo mật tài khoản</h3>
            </div>

            <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
                <span>Mật khẩu phải có độ dài tối thiểu 8 ký tự để đảm bảo tính an toàn.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
                <span>Khi đổi mật khẩu thành công, phiên làm việc hiện tại được làm mới tự động.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
                <span>Mọi phiên đăng nhập trên các thiết bị khác sẽ được tự động đăng xuất để tránh rủi ro.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
