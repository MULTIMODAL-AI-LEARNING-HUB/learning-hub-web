import { useEffect, useState, useCallback } from 'react'
import { Database, Bot, Zap, Shield, HardDrive, Activity } from 'lucide-react'
import { adminApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/useToast'

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

export function AdminSettings() {
  const toast = useToast()
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.health()
      setHealth(res.data)
    } catch {
      toast({ type: 'error', title: 'Failed to load health status' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHealth()
  }, [fetchHealth])

  const services = [
    { name: 'PostgreSQL Database', description: 'Relational data storage', icon: Database, key: 'database' as const },
    { name: 'AI LangGraph Service', description: 'LLM workflow engine', icon: Bot, key: 'ai_service' as const },
    { name: 'Redis (Upstash)', description: 'Session & query caching', icon: Zap, key: 'redis' as const },
    { name: 'Cloudflare R2 Storage', description: 'S3-compatible object storage', icon: HardDrive, key: 's3_storage' as const },
    { name: 'Qdrant Vector DB', description: 'Vector embeddings database', icon: Database, key: 'qdrant' as const },
    { name: 'Celery Worker', description: 'Background task processing', icon: Activity, key: 'celery' as const },
  ]

  const overall = health?.status === 'healthy' ? 'All systems operational' : 'Some services degraded'

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-fluid-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground text-sm">Platform configuration and service health overview.</p>
      </div>

      {/* System Health */}
      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-semibold text-foreground">System Health</h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={health?.status === 'healthy' ? 'success' : 'error'}
              label={overall}
              dot
            />
            <Button variant="outline" size="sm" onClick={fetchHealth} loading={loading}>
              Refresh
            </Button>
          </div>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {services.map(svc => {
            const status = health?.services[svc.key] ?? 'offline'
            return (
              <div key={svc.key} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  status === 'healthy' ? 'bg-success/10' : 'bg-destructive/10'
                }`}>
                  <svc.icon className={`h-5 w-5 ${status === 'healthy' ? 'text-success' : 'text-destructive'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">{svc.description}</p>
                </div>
                <span className={`text-xs font-semibold ${
                  status === 'healthy' ? 'text-success' : status === 'unhealthy' ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {status}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Platform Info */}
      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-base font-semibold text-foreground">Platform Information</h2>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'Platform', value: 'MULTIMODAL AI LEARNING HUB' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Frontend', value: 'React 19 + Vite + Tailwind CSS' },
            { label: 'Backend', value: 'FastAPI + SQLAlchemy + PostgreSQL' },
            { label: 'AI Engine', value: 'LangGraph + Claude/GPT-4' },
          ].map(item => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}