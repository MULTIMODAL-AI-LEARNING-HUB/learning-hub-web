import { useEffect, useState, useCallback } from 'react'
import {
  Database,
  Bot,
  Zap,
  Shield,
  HardDrive,
  Activity,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { adminApi, type AiApiKey } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
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

  // AI Keys state
  const [aiKeys, setAiKeys] = useState<AiApiKey[]>([])
  const [keysLoading, setKeysLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [providerInput, setProviderInput] = useState('gemini')
  const [showPlainKey, setShowPlainKey] = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  const fetchAiKeys = useCallback(async () => {
    setKeysLoading(true)
    try {
      const res = await adminApi.listAiKeys()
      setAiKeys(res.data.items)
    } catch {
      toast({ type: 'error', title: 'Không thể tải danh sách AI API Keys' })
    } finally {
      setKeysLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchHealth()
    fetchAiKeys()
  }, [fetchHealth, fetchAiKeys])

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyInput.trim()) {
      toast({ type: 'error', title: 'Vui lòng nhập API Key' })
      return
    }
    if (!nameInput.trim()) {
      toast({ type: 'error', title: 'Vui lòng đặt tên gợi nhớ cho khóa' })
      return
    }

    setSavingKey(true)
    try {
      await adminApi.createAiKey({
        api_key: keyInput.trim(),
        key_name: nameInput.trim(),
        provider: providerInput,
      })
      toast({ type: 'success', title: 'Thêm API Key thành công và đã đồng bộ xoay vòng' })
      setKeyInput('')
      setNameInput('')
      setShowPlainKey(false)
      setModalOpen(false)
      await fetchAiKeys()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu API Key'
      toast({ type: 'error', title: 'Thất bại', message: msg })
    } finally {
      setSavingKey(false)
    }
  }

  const handleToggleKey = async (id: string) => {
    try {
      const res = await adminApi.toggleAiKey(id)
      setAiKeys((prev) => prev.map((k) => (k.id === id ? res.data : k)))
      toast({
        type: 'info',
        title: res.data.is_active ? 'Đã kích hoạt khóa trong pool xoay vòng' : 'Đã tạm dừng khóa',
      })
    } catch {
      toast({ type: 'error', title: 'Không thể đổi trạng thái khóa' })
    }
  }

  const handleDeleteKey = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khóa "${name}" khỏi hệ thống xoay vòng?`)) {
      return
    }
    try {
      await adminApi.deleteAiKey(id)
      setAiKeys((prev) => prev.filter((k) => k.id !== id))
      toast({ type: 'success', title: `Đã xóa khóa "${name}"` })
    } catch {
      toast({ type: 'error', title: 'Không thể xóa khóa' })
    }
  }

  const handleCopyMasked = (id: string, masked: string) => {
    navigator.clipboard.writeText(masked)
    setCopiedId(id)
    toast({ type: 'info', title: 'Đã sao chép mã hiển thị' })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const services = [
    { name: 'PostgreSQL Database', description: 'Relational data storage', icon: Database, key: 'database' as const },
    { name: 'AI LangGraph Service', description: 'LLM workflow engine', icon: Bot, key: 'ai_service' as const },
    { name: 'Redis (Upstash)', description: 'Session & query caching', icon: Zap, key: 'redis' as const },
    { name: 'Cloudflare R2 Storage', description: 'S3-compatible object storage', icon: HardDrive, key: 's3_storage' as const },
    { name: 'Qdrant Vector DB', description: 'Vector embeddings database', icon: Database, key: 'qdrant' as const },
    { name: 'Celery Worker', description: 'Background task processing', icon: Activity, key: 'celery' as const },
  ]

  const overall = health?.status === 'healthy' ? 'All systems operational' : 'Some services degraded'
  const activeKeysCount = aiKeys.filter((k) => k.is_active).length

  return (
    <div className="space-y-6 p-6 font-body">
      <div className="flex flex-col gap-1">
        <h1 className="text-fluid-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground text-sm">Cấu hình nền tảng, quản lý API Key xoay vòng và giám sát hạ tầng.</p>
      </div>

      {/* AI API Keys Management & Key Rotation */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-semibold text-foreground">Quản Lý Gemini & LLM API Keys</h2>
                <Badge
                  variant={activeKeysCount > 0 ? 'success' : 'warning'}
                  label={`${activeKeysCount}/${aiKeys.length} Active`}
                  dot
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tự động xoay vòng Round-Robin & chuyển khóa dự phòng khi gặp Rate Limit (HTTP 429).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAiKeys} loading={keysLoading}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Làm mới
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm API Key
            </Button>
          </div>
        </div>

        <div className="p-5">
          {keysLoading && aiKeys.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Đang tải danh sách API Keys...</div>
          ) : aiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
              <Key className="mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">Chưa có API Key nào được cấu hình</p>
              <p className="mb-4 text-xs text-muted-foreground">
                Thêm ít nhất 1 hoặc nhiều Gemini API Key để hệ thống tự động xoay vòng cho toàn bộ người dùng.
              </p>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Thêm Khóa Đầu Tiên
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pl-2">Nhà Cung Cấp</th>
                    <th className="pb-3">Tên Gợi Nhớ</th>
                    <th className="pb-3">Khóa (Bảo Mật / Đã Ẩn)</th>
                    <th className="pb-3 text-center">Số Lần Dùng</th>
                    <th className="pb-3 text-center">Trạng Thái</th>
                    <th className="pb-3 text-right pr-2">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {aiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pl-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase text-primary">
                          <Sparkles className="h-3 w-3" />
                          {k.provider}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-foreground">{k.key_name}</td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">
                        <div className="inline-flex items-center gap-1.5 rounded bg-muted/60 px-2 py-1">
                          <span>{k.masked_key}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyMasked(k.id, k.masked_key)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Sao chép mã ẩn"
                          >
                            {copiedId === k.id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 text-center text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{k.usage_count}</span> calls
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={k.is_active ? 'success' : 'default'}
                          label={k.is_active ? 'Active' : 'Disabled'}
                          dot
                        />
                      </td>
                      <td className="py-3 text-right pr-2">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant={k.is_active ? 'outline' : 'secondary'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleToggleKey(k.id)}
                          >
                            {k.is_active ? 'Tắt' : 'Bật'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteKey(k.id, k.key_name)}
                            aria-label="Delete API Key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

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
          {services.map((svc) => {
            const status = health?.services[svc.key] ?? 'offline'
            return (
              <div key={svc.key} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    status === 'healthy' ? 'bg-success/10' : 'bg-destructive/10'
                  }`}
                >
                  <svc.icon className={`h-5 w-5 ${status === 'healthy' ? 'text-success' : 'text-destructive'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">{svc.description}</p>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    status === 'healthy'
                      ? 'text-success'
                      : status === 'unhealthy'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
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
            { label: 'AI Engine', value: 'LangGraph + Gemini Flash-Lite / Pro' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal Add API Key */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thêm API Key (Tự Động Xoay Vòng & Bảo Mật)"
        description="Khóa sẽ được lưu an toàn và tự động che mờ (chỉ hiển thị 6 ký tự đầu và 4 ký tự cuối)."
      >
        <form onSubmit={handleCreateKey} className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nhà Cung Cấp
            </label>
            <select
              value={providerInput}
              onChange={(e) => setProviderInput(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="gemini">Google Gemini (Khuyến nghị cho Flash-Lite)</option>
              <option value="groq">Groq (Llama 3 Intent)</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tên Gợi Nhớ
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="VD: Gemini Flash-Lite Key 1"
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              API Key (Được bảo mật)
            </label>
            <div className="relative">
              <input
                type={showPlainKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Dán mã API Key tại đây..."
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-10 text-sm font-mono text-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPlainKey(!showPlainKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPlainKey ? 'Ẩn khóa' : 'Hiện khóa'}
              >
                {showPlainKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Hệ thống sẽ mã hóa và che mờ khóa ngay sau khi lưu. Khi người dùng gọi AI, hệ thống tự động xoay vòng qua các khóa đang hoạt động.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" loading={savingKey}>
              Lưu & Kích Hoạt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
