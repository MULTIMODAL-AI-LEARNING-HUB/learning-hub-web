import { useState, useEffect } from 'react'
import { Settings, User, Lock, Bell, Check, AlertCircle } from 'lucide-react'
import { authApi } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/useToast'

type ApiUser = {
  full_name: string | null
  email: string
  created_at: string | null
  quota?: {
    storage_limit_mb: number
    storage_used_mb: number
    token_limit: number
    token_used: number
  }
}

function mapApiUser(u: ApiUser | null) {
  if (!u) return null
  return {
    full_name: u.full_name,
    email: u.email,
    created_at: u.created_at,
    quota: u.quota ? {
      storageUsed: u.quota.storage_used_mb,
      storageTotal: u.quota.storage_limit_mb,
      tokensUsed: u.quota.token_used,
      tokensTotal: u.quota.token_limit,
    } : undefined,
  }
}

export function LecturerSettings() {
  const toast = useToast()

  const [rawUser, setRawUser] = useState<{
    full_name: string | null
    email: string
    created_at: string | null
    quota?: { storageUsed: number; storageTotal: number; tokensUsed: number; tokensTotal: number }
  } | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    authApi.me().then(res => {
      const u = res.data
      setRawUser(mapApiUser(u))
      setFullName(u?.full_name ?? '')
      setEmail(u?.email ?? '')
    }).catch(() => {})
  }, [])

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({ type: 'warning', title: 'Vui lòng nhập họ và tên' })
      return
    }
    setSaving(true)
    try {
      await authApi.updateMe({ full_name: fullName })
      const res = await authApi.me()
      setRawUser(mapApiUser(res.data))
      toast({ type: 'success', title: 'Đã cập nhật hồ sơ' })
    } catch {
      toast({ type: 'error', title: 'Cập nhật hồ sơ thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại')
      return
    }
    if (!newPassword) {
      setPasswordError('Vui lòng nhập mật khẩu mới')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    setPasswordSaving(true)
    try {
      await authApi.resetPassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({ type: 'success', title: 'Đổi mật khẩu thành công' })
    } catch {
      setPasswordError('Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const quota = rawUser?.quota ?? null

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Cài Đặt"
        description="Quản lý cài đặt tài khoản của bạn"
        icon={<Settings />}
      />

      <div className="grid lg:grid-cols-2 gap-6 max-w-3xl">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Thông Tin Hồ Sơ</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Họ và tên</label>
              <Input value={fullName} onChange={setFullName} placeholder="Nhập họ và tên của bạn" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Địa chỉ email</label>
              <Input value={email} placeholder="your@email.com" type="email" disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Vai trò</label>
              <div className="px-3 py-2 rounded-lg border border-input bg-muted/30 text-sm text-muted-foreground">
                Giảng viên
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Thành viên từ</label>
              <div className="px-3 py-2 rounded-lg border border-input bg-muted/30 text-sm text-muted-foreground">
                {rawUser?.created_at
                  ? new Date(rawUser.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—'}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveProfile} loading={saving} icon={<Check className="h-4 w-4" />}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Lock className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">Đổi Mật Khẩu</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Mật khẩu hiện tại</label>
              <Input type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="Nhập mật khẩu hiện tại" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Mật khẩu mới</label>
              <Input type="password" value={newPassword} onChange={setNewPassword} placeholder="Nhập mật khẩu mới" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Xác nhận mật khẩu mới</label>
              <Input type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Nhập lại mật khẩu mới" />
            </div>
            {passwordError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {passwordError}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={handleChangePassword} loading={passwordSaving}>
                Đổi mật khẩu
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {quota && (
        <Card className="max-w-3xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Bell className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-foreground">Dung Lượng & Định Mức Sử Dụng</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lưu trữ</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {quota.storageUsed.toFixed(1)} / {quota.storageTotal} MB
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min((quota.storageUsed / quota.storageTotal) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Token AI</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {quota.tokensUsed.toLocaleString()} / {quota.tokensTotal.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{ width: `${Math.min((quota.tokensUsed / quota.tokensTotal) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}