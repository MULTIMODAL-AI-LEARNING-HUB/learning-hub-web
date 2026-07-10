import { useEffect, useState, useCallback } from 'react'
import { Settings, Users, FileText, CheckCircle2, Clock, RefreshCw, Database, Bot, Zap, ChevronLeft, ChevronRight, Search } from 'lucide-react'
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
      toast({ type: 'error', title: 'Failed to load analytics' })
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
      toast({ type: 'error', title: 'Failed to load system health' })
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
        toast({ type: 'error', title: 'Failed to load users list' })
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
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/10 bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent p-6 glow-admin">
        <div className="absolute right-0 top-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl" />
        <PageHeader
          subtitle="System Controls"
          title="Admin Dashboard"
          description="Monitor performance, services health, and manage user directory in real-time."
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
              className="border-indigo-500/20 hover:bg-indigo-500/10 hover:text-indigo-600"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Refresh Data
            </Button>
          }
        />
      </div>

      {/* Analytics Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={analytics?.total_users ?? 0}
          icon={<Users className="text-indigo-600 dark:text-indigo-400" />}
          variant="primary"
          loading={loadingAnalytics}
          className="border-indigo-500/10 bg-gradient-to-b from-indigo-500/5 to-transparent shadow-soft hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all"
        />
        <StatCard
          label="Total Documents"
          value={analytics?.total_documents ?? 0}
          icon={<FileText className="text-indigo-600 dark:text-indigo-400" />}
          variant="primary"
          loading={loadingAnalytics}
          className="border-indigo-500/10 bg-gradient-to-b from-indigo-500/5 to-transparent shadow-soft hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all"
        />
        <StatCard
          label="Ready Documents"
          value={analytics?.documents_ready ?? 0}
          icon={<CheckCircle2 className="text-emerald-500" />}
          variant="success"
          loading={loadingAnalytics}
          className="border-emerald-500/10 hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all"
        />
        <StatCard
          label="Processing"
          value={analytics?.documents_processing ?? 0}
          icon={<Clock className="text-amber-500" />}
          variant="warning"
          loading={loadingAnalytics}
          className="border-amber-500/10 hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all"
        />
      </div>

      {/* Services Health */}
      <Card className="border-indigo-500/10 shadow-soft bg-surface-elevated/40 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Core System Services
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current status:{' '}
              <Badge
                variant={health?.status === 'healthy' ? 'success' : 'error'}
                label={health?.status || 'checking...'}
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
            Check Health
          </Button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <ServiceCard
            name="PostgreSQL"
            description="Database Instance"
            icon={<Database className="text-blue-500" />}
            status={health?.services.database || 'offline'}
            className="bg-surface-elevated hover:shadow-indigo-500/5 border border-indigo-500/5"
          />
          <ServiceCard
            name="AI LangGraph"
            description="Cognitive Pipeline"
            icon={<Bot className="text-indigo-500" />}
            status={health?.services.ai_service || 'offline'}
            className="bg-surface-elevated hover:shadow-indigo-500/5 border border-indigo-500/5 glow-admin"
          />
          <ServiceCard
            name="Redis Cache"
            description="Cache & Broker"
            icon={<Zap className="text-amber-500" />}
            status={health?.services.redis || 'offline'}
            className="bg-surface-elevated hover:shadow-indigo-500/5 border border-indigo-500/5"
          />
        </div>
      </Card>

      {/* User Management */}
      <Card className="border-indigo-500/10 shadow-soft bg-surface-elevated/40 backdrop-blur-md">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">User Directory</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalUsers} registered {totalUsers === 1 ? 'user' : 'users'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search users..."
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
              Refresh
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-3xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-5 font-semibold">User details</th>
                <th className="py-3 px-5 font-semibold">System Role</th>
                <th className="py-3 px-5 font-semibold">Activity Status</th>
                <th className="py-3 px-5 font-semibold">Creation Date</th>
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
                      title={searchQuery ? 'No matching users' : 'No users found'}
                      description={searchQuery ? 'Try a different search term' : 'No users have registered yet.'}
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
                            {u.full_name || 'No name provided'}
                          </p>
                          <p className="text-2xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <Badge
                        variant={u.role === 'admin' ? 'primary' : u.role === 'lecturer' ? 'warning' : 'default'}
                        label={u.role}
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
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-xs text-muted-foreground tabular-nums">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span> of{' '}
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
              Previous
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loadingUsers}
              variant="outline"
              size="sm"
              iconRight={<ChevronRight className="h-3.5 w-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
