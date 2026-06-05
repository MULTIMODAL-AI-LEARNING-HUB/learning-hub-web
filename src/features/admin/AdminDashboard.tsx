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
    fetchAnalytics()
    fetchHealth()
  }, [fetchAnalytics, fetchHealth])

  useEffect(() => {
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
    <div className="space-y-6">
      <PageHeader
        subtitle="Admin"
        title="Dashboard"
        description="Monitor system performance, services health, and manage user accounts."
        icon={<Settings />}
        actions={
          <Button
            onClick={() => {
              fetchAnalytics()
              fetchHealth()
              fetchUsers(page)
            }}
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh All
          </Button>
        }
      />

      {/* Analytics Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={analytics?.total_users ?? 0}
          icon={<Users />}
          loading={loadingAnalytics}
        />
        <StatCard
          label="Total Documents"
          value={analytics?.total_documents ?? 0}
          icon={<FileText />}
          loading={loadingAnalytics}
        />
        <StatCard
          label="Ready Documents"
          value={analytics?.documents_ready ?? 0}
          icon={<CheckCircle2 />}
          variant="success"
          loading={loadingAnalytics}
        />
        <StatCard
          label="Processing"
          value={analytics?.documents_processing ?? 0}
          icon={<Clock />}
          variant="warning"
          loading={loadingAnalytics}
        />
      </div>

      {/* Services Health */}
      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              System Services
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Overall:{' '}
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
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-3">
          <ServiceCard
            name="PostgreSQL"
            description="Relational Storage"
            icon={<Database />}
            status={health?.services.database || 'offline'}
          />
          <ServiceCard
            name="AI LangGraph"
            description="LLM Workflow"
            icon={<Bot />}
            status={health?.services.ai_service || 'offline'}
          />
          <ServiceCard
            name="Redis Cache"
            description="Key-Value Memory"
            icon={<Zap />}
            status={health?.services.redis || 'offline'}
          />
        </div>
      </Card>

      {/* User Management */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">User Directory</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalUsers} registered {totalUsers === 1 ? 'user' : 'users'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={setSearchQuery}
              prefixIcon={<Search className="h-4 w-4" />}
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
              <tr className="border-b border-border bg-muted/30 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-5 font-semibold">User</th>
                <th className="py-2.5 px-5 font-semibold">Role</th>
                <th className="py-2.5 px-5 font-semibold">Status</th>
                <th className="py-2.5 px-5 font-semibold">Registered</th>
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
                      icon={<Users />}
                      title={searchQuery ? 'No matching users' : 'No users found'}
                      description={searchQuery ? 'Try a different search term' : 'No users have registered yet.'}
                      compact
                      className="border-0 bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          fallback={(u.full_name || u.email).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {u.full_name || 'No name provided'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <Badge
                        variant={u.role === 'admin' ? 'primary' : 'default'}
                        label={u.role}
                      />
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={
                            u.is_active
                              ? 'h-2 w-2 rounded-full bg-success animate-pulse-soft'
                              : 'h-2 w-2 rounded-full bg-muted-foreground'
                          }
                        />
                        <span
                          className={
                            u.is_active
                              ? 'text-xs font-medium text-success'
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
