import { useEffect, useState, useCallback } from 'react'
import { Settings, Users, FileText, CheckCircle2, Clock, RefreshCw, Database, Bot, Zap, ChevronLeft, ChevronRight, Search, HardDrive, Cpu, Activity } from 'lucide-react'
import { adminApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatCard } from '../../components/ui/StatCard'
import { ServiceCard } from '../../components/ui/ServiceCard'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Avatar } from '../../components/ui/Avatar'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/useToast'
import { Input } from '../../components/ui/Input'
import { EmptyState } from '../../components/ui/EmptyState'
import { cn } from '../../utils/cn'

interface AnalyticsData {
  total_users: number
  total_documents: number
  documents_ready: number
  documents_processing: number
}

interface HealthData {
  status: string
  services: {
    database: string
    ai_service: string
    redis: string
    s3_storage: string
    qdrant: string
    celery: string
  }
}

interface UserItem {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string | null
}

export function AdminDashboard() {
  const toast = useToast()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [health, setHealth] = useState<HealthData | null>(null)
  const [users, setUsers] = useState<UserItem[]>([])
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const pageSize = 10

  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [loadingHealth, setLoadingHealth] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    await Promise.resolve()
    setLoadingAnalytics(true)
    try {
      const res = await adminApi.analytics()
      setAnalytics(res.data)
    } catch {
      toast({ type: 'error', title: 'Không thể tải dữ liệu thống kê' })
    } finally {
      setLoadingAnalytics(false)
    }
  }, [toast])

  const fetchHealth = useCallback(async () => {
    await Promise.resolve()
    setLoadingHealth(true)
    try {
      const res = await adminApi.health()
      setHealth(res.data)
    } catch {
      toast({ type: 'error', title: 'Không thể tải trạng thái hệ thống' })
    } finally {
      setLoadingHealth(false)
    }
  }, [toast])

  const fetchUsers = useCallback(
    async (p: number) => {
      await Promise.resolve()
      setLoadingUsers(true)
      try {
        const res = await adminApi.listUsers(p, pageSize)
        setUsers(res.data.items)
        setTotalUsers(res.data.total)
      } catch {
        toast({ type: 'error', title: 'Không thể tải danh sách người dùng' })
      } finally {
        setLoadingUsers(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics()
    fetchHealth()
  }, [fetchAnalytics, fetchHealth])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers(page)
  }, [page, fetchUsers])

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize))

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6 font-body">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-elevated p-6 shadow-soft">
        <PageHeader
          subtitle="Hệ thống quản trị"
          title="Bảng điều khiển quản trị"
          description="Giám sát hiệu năng, kiểm tra sức khỏe dịch vụ và quản lý người dùng theo thời gian thực."
          icon={<Settings className="text-indigo-600 dark:text-indigo-400" />}
          actions={
            <Button
              onClick={() => {
                fetchAnalytics()
                fetchHealth()
                fetchUsers(page)
              }}
              variant="outline"
              size="sm"
              className="border-border hover:bg-muted"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Làm mới dữ liệu
            </Button>
          }
        />
      </div>

      {/* Analytics Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng người dùng"
          value={analytics?.total_users ?? 0}
          icon={<Users className="text-indigo-600 dark:text-indigo-400" />}
          variant="primary"
          loading={loadingAnalytics}
          className="border-border bg-surface-elevated"
        />
        <StatCard
          label="Tổng tài liệu"
          value={analytics?.total_documents ?? 0}
          icon={<FileText className="text-indigo-600 dark:text-indigo-400" />}
          variant="primary"
          loading={loadingAnalytics}
          className="border-border bg-surface-elevated"
        />
        <StatCard
          label="Tài liệu sẵn sàng"
          value={analytics?.documents_ready ?? 0}
          icon={<CheckCircle2 className="text-emerald-500" />}
          variant="success"
          loading={loadingAnalytics}
          className="border-border bg-surface-elevated"
        />
        <StatCard
          label="Đang xử lý"
          value={analytics?.documents_processing ?? 0}
          icon={<Clock className="text-amber-500" />}
          variant="warning"
          loading={loadingAnalytics}
          className="border-border bg-surface-elevated"
        />
      </div>

      {/* Services Health */}
      <Card className="border-border shadow-soft bg-surface-elevated">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Dịch vụ hệ thống cốt lõi
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trạng thái hiện tại:{' '}
              <Badge
                variant={health?.status === 'healthy' ? 'success' : 'error'}
                label={health?.status === 'healthy' ? 'Hoạt động tốt' : (health?.status || 'Đang kiểm tra...')}
                dot
              />
            </p>
          </div>
          <Button
            onClick={fetchHealth}
            variant="outline"
            size="sm"
            loading={loadingHealth}
            className="border-border hover:bg-muted text-foreground"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Kiểm tra sức khỏe
          </Button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 md:grid-cols-3">
          <ServiceCard
            name="Cơ sở dữ liệu PostgreSQL"
            description="Lưu trữ dữ liệu quan hệ"
            icon={<Database className="text-blue-500" />}
            status={health?.services.database || 'offline'}
            className="bg-surface-elevated hover:shadow-indigo-500/5 border border-indigo-500/5"
          />
          <ServiceCard
            name="Dịch vụ AI LangGraph"
            description="Engine luồng xử lý LLM"
            icon={<Bot className="text-indigo-500" />}
            status={health?.services.ai_service || 'offline'}
            className="bg-surface-elevated hover:shadow-indigo-500/5 border border-indigo-500/5 glow-admin"
          />
          <ServiceCard
            name="Redis (Upstash)"
            description="Bộ nhớ đệm phiên & truy vấn"
            icon={<Zap className="text-amber-500" />}
            status={health?.services.redis || 'offline'}
            className="bg-surface-elevated hover:shadow-indigo-500/5 border border-indigo-500/5"
          />
          <ServiceCard
            name="Cloudflare R2 Storage"
            description="Lưu trữ đối tượng tương thích S3"
            icon={<HardDrive className="text-sky-500" />}
            status={health?.services.s3_storage || 'offline'}
            className="bg-surface-elevated hover:shadow-indigo-500/5 border border-indigo-500/5"
          />
          <ServiceCard
            name="Qdrant Vector DB"
            description="Cơ sở dữ liệu vector embeddings"
            icon={<Cpu className="text-violet-500" />}
            status={health?.services.qdrant || 'offline'}
            className="bg-surface-elevated hover:shadow-indigo-500/5 border border-indigo-500/5"
          />
          <ServiceCard
            name="Celery Worker"
            description="Xử lý tác vụ bất đồng bộ"
            icon={<Activity className="text-rose-500" />}
            status={health?.services.celery || 'offline'}
            className="bg-surface-elevated hover:shadow-indigo-500/5 border border-indigo-500/5"
          />
        </div>
      </Card>

      {/* User Management */}
      <Card className="border-border shadow-soft bg-surface-elevated">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">Danh bạ người dùng</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalUsers} người dùng đã đăng ký
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={setSearchQuery}
              prefixIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="w-56"
            />
            <Button
              onClick={() => fetchUsers(page)}
              variant="outline"
              size="sm"
              loading={loadingUsers}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Làm mới
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-3xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-5 font-semibold">Thông tin người dùng</th>
                <th className="py-3 px-5 font-semibold">Vai trò hệ thống</th>
                <th className="py-3 px-5 font-semibold">Trạng thái</th>
                <th className="py-3 px-5 font-semibold">Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <Skeleton variant="circular" width={32} height={32} />
                        <div className="space-y-1">
                          <Skeleton width={120} height={12} />
                          <Skeleton width={160} height={10} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5"><Skeleton width={60} height={20} /></td>
                    <td className="py-3 px-5"><Skeleton width={60} height={20} /></td>
                    <td className="py-3 px-5"><Skeleton width={80} height={12} /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12">
                    <EmptyState
                      icon={<Users className="text-muted-foreground/60 h-8 w-8" />}
                      title={searchQuery ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}
                      description={searchQuery ? 'Hãy thử tìm kiếm với từ khóa khác' : 'Chưa có người dùng nào đăng ký trong hệ thống.'}
                      compact
                      className="border-0 bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-indigo-500/5 hover:text-foreground transition-all duration-150">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          fallback={(u.full_name || u.email).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          size="sm"
                          className="ring-1 ring-indigo-500/10"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {u.full_name || 'Chưa cung cấp họ tên'}
                          </p>
                          <p className="text-2xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <Badge
                        variant={u.role === 'admin' ? 'primary' : u.role === 'lecturer' ? 'warning' : 'default'}
                        label={u.role === 'admin' ? 'Quản trị viên' : u.role === 'lecturer' ? 'Giảng viên' : 'Học viên'}
                        className={cn(
                          u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' :
                          u.role === 'lecturer' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        )}
                      />
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={
                            u.is_active
                              ? 'h-2 w-2 rounded-full bg-success animate-pulse'
                              : 'h-2 w-2 rounded-full bg-muted-foreground'
                          }
                        />
                        <span
                          className={
                            u.is_active
                              ? 'text-xs font-semibold text-success'
                              : 'text-xs font-medium text-muted-foreground'
                          }
                        >
                          {u.is_active ? 'Đang hoạt động' : 'Ngừng kích hoạt'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-xs text-muted-foreground tabular-nums">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Trang <span className="font-semibold text-foreground">{page}</span> trên{' '}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loadingUsers}
              variant="outline"
              size="sm"
              icon={<ChevronLeft className="h-3.5 w-3.5" />}
            >
              Trước
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loadingUsers}
              variant="outline"
              size="sm"
              iconRight={<ChevronRight className="h-3.5 w-3.5" />}
            >
              Tiếp
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
