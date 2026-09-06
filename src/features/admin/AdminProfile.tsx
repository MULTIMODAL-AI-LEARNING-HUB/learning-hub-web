import { useState, useEffect } from 'react'
import { Mail, ShieldCheck, CalendarDays, Award, User } from 'lucide-react'
import { authApi, type AuthUser } from '../../services/api'
import { useAppStore } from '../../stores/appStore'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Skeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/useToast'

export function AdminProfile() {
  const toast = useToast()
  const loadStoreUser = useAppStore((s) => s.auth.loadUser)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      setLoading(true)
      try {
        const res = await authApi.me()
        if (cancelled) return
        setUser(res.data)
        setFullName(res.data.full_name || '')
      } catch {
        if (!cancelled) toast({ type: 'error', title: 'Không thể tải thông tin hồ sơ' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadProfile()
    return () => {
      cancelled = true
    }
  }, [toast])

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({ type: 'warning', title: 'Vui lòng nhập họ và tên' })
      return
    }

    setSaving(true)
    try {
      const res = await authApi.updateMe({ full_name: fullName.trim() })
      toast({ type: 'success', title: 'Cập nhật hồ sơ thành công' })
      setUser(res.data)
      setFullName(res.data.full_name || '')
      // Sync change with main app layout store
      await loadStoreUser()
    } catch {
      toast({ type: 'error', title: 'Không thể cập nhật hồ sơ' })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Không có'
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    )
  }

  const roleLabel =
    user?.role === 'admin'
      ? 'Quản trị viên'
      : user?.role === 'lecturer'
      ? 'Giảng viên'
      : user?.role === 'student'
      ? 'Học viên'
      : (user?.role || 'Quản trị viên')

  const displayName = fullName.trim() || user?.full_name || user?.email || 'Quản trị viên'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6 p-6 animate-fade-in font-body">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-elevated p-6 shadow-soft">
        <PageHeader
          title="Hồ Sơ Quản Trị Viên"
          description="Quản lý thông tin tài khoản quản trị viên hệ thống."
          icon={<User className="text-indigo-600 dark:text-indigo-400" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Main profile edit card */}
        <Card className="border-border shadow-soft bg-surface-elevated p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <Avatar fallback={initials} size="lg" className="ring-4 ring-indigo-500/10" />
            <div>
              <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
              <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Chế độ {roleLabel}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Họ và tên</label>
              <Input
                value={fullName}
                onChange={(v) => setFullName(v)}
                placeholder="Nhập họ và tên của bạn"
                className="max-w-md"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Địa chỉ Email</label>
              <div className="flex items-center gap-2 max-w-md rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground select-none">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <span>{user?.email}</span>
              </div>
              <p className="text-2xs text-muted-foreground mt-0.5">Liên hệ bộ phận hỗ trợ nếu bạn cần thay đổi địa chỉ email.</p>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} loading={saving} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
              Lưu thay đổi
            </Button>
          </div>
        </Card>

        {/* Info card */}
        <div className="space-y-6">
          <Card className="border-border shadow-soft bg-surface-elevated p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              <h3 className="font-semibold text-foreground">Trạng Thái Tài Khoản</h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/10 p-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xs text-muted-foreground">Tham gia từ</p>
                  <p className="text-xs font-semibold text-foreground tabular-nums">{formatDate(user?.created_at || null)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/10 p-3">
                <Award className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xs text-muted-foreground">Vai trò quyền hạn</p>
                  <p className="text-xs font-semibold text-foreground">{roleLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/10 p-3">
                <ShieldCheck className="h-4 w-4 text-success" />
                <div>
                  <p className="text-2xs text-muted-foreground">Trạng thái tài khoản</p>
                  <p className="text-xs font-semibold text-success">Đang hoạt động & Đã xác thực</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
