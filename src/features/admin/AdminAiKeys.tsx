import { useEffect, useState, useMemo } from 'react'
import {
  Key,
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Bot,
  Zap,
  Cpu,
  Layers,
  Search,
  CheckCircle2,
  HelpCircle
} from 'lucide-react'
import { adminApi, type AiApiKey } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/useToast'

interface ProviderConfig {
  id: string
  label: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  icon: typeof Bot
  models: string
  placeholder: string
  namePlaceholder: string
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
    icon: Sparkles,
    models: 'gemini-2.0-flash-lite, gemini-2.0-flash',
    placeholder: 'AIzaSy... hoặc AQ.Ab8...',
    namePlaceholder: 'VD: Gemini Flash-Lite Key 1',
  },
  groq: {
    id: 'groq',
    label: 'Groq Cloud',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-800',
    icon: Zap,
    models: 'llama-3.3-70b, mixtral-8x7b, llama-3.1-8b',
    placeholder: 'gsk_...',
    namePlaceholder: 'VD: Groq Llama 3.3 Production Key',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    icon: Cpu,
    models: 'gpt-4o, gpt-4o-mini',
    placeholder: 'sk-proj-... hoặc sk-...',
    namePlaceholder: 'VD: OpenAI GPT-4o Key',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
    icon: Layers,
    models: 'claude-3-5-sonnet, claude-3-5-haiku',
    placeholder: 'sk-ant-...',
    namePlaceholder: 'VD: Claude 3.5 Sonnet Key',
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-800',
    icon: Bot,
    models: 'deepseek-chat, deepseek-reasoner',
    placeholder: 'sk-...',
    namePlaceholder: 'VD: DeepSeek V3 Key',
  },
  other: {
    id: 'other',
    label: 'Khác / Custom',
    badgeBg: 'bg-slate-50 dark:bg-slate-800/60',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    icon: HelpCircle,
    models: 'Custom Model Provider',
    placeholder: 'Dán mã API key...',
    namePlaceholder: 'VD: Custom AI Key 1',
  },
}

export function AdminAiKeys() {
  const toast = useToast()
  const [aiKeys, setAiKeys] = useState<AiApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [providerInput, setProviderInput] = useState('groq')
  const [nameInput, setNameInput] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [showPlainKey, setShowPlainKey] = useState(false)
  const [savingKey, setSavingKey] = useState(false)

  // Initial load without synchronous setState in effect
  useEffect(() => {
    let ignore = false
    adminApi.listAiKeys()
      .then((res) => {
        if (!ignore) setAiKeys(res.data.items || [])
      })
      .catch(() => {
        if (!ignore) toast({ type: 'error', title: 'Lỗi', message: 'Không thể tải danh sách AI API Keys' })
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [toast])

  // Manual refresh action
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const res = await adminApi.listAiKeys()
      setAiKeys(res.data.items || [])
    } catch {
      toast({ type: 'error', title: 'Lỗi', message: 'Không thể tải danh sách AI API Keys' })
    } finally {
      setLoading(false)
    }
  }

  // Actions
  const handleToggleKey = async (id: string) => {
    try {
      const res = await adminApi.toggleAiKey(id)
      setAiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: res.data.is_active } : k)))
      toast({
        type: 'success',
        title: 'Thành công',
        message: res.data.is_active ? 'Đã kích hoạt khóa trong vòng xoay' : 'Đã tạm ngưng khóa',
      })
    } catch {
      toast({ type: 'error', title: 'Lỗi', message: 'Không thể thay đổi trạng thái khóa' })
    }
  }

  const handleDeleteKey = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khóa "${name}" khỏi hệ thống?`)) return
    try {
      await adminApi.deleteAiKey(id)
      setAiKeys((prev) => prev.filter((k) => k.id !== id))
      toast({ type: 'success', title: 'Đã xóa', message: `Đã xóa khóa ${name}` })
    } catch {
      toast({ type: 'error', title: 'Lỗi', message: 'Không thể xóa khóa' })
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim() || !keyInput.trim()) {
      toast({ type: 'error', title: 'Thiếu thông tin', message: 'Vui lòng điền đầy đủ Tên gợi nhớ và Mã API Key' })
      return
    }

    setSavingKey(true)
    try {
      const res = await adminApi.createAiKey({
        provider: providerInput.toLowerCase().trim(),
        key_name: nameInput.trim(),
        api_key: keyInput.trim(),
      })
      setAiKeys((prev) => [res.data, ...prev])
      toast({
        type: 'success',
        title: 'Đã thêm thành công',
        message: `Khóa ${res.data.key_name} đã sẵn sàng xoay vòng tự động!`,
      })
      setModalOpen(false)
      setNameInput('')
      setKeyInput('')
      setShowPlainKey(false)
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } } }
      const detail = errObj.response?.data?.detail || 'Thêm khóa thất bại'
      toast({ type: 'error', title: 'Lỗi', message: detail })
    } finally {
      setSavingKey(false)
    }
  }

  // Filtered keys
  const filteredKeys = useMemo(() => {
    return aiKeys.filter((k) => {
      const matchesTab = selectedTab === 'all' || k.provider.toLowerCase() === selectedTab.toLowerCase()
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        k.key_name.toLowerCase().includes(query) ||
        k.masked_key.toLowerCase().includes(query) ||
        k.provider.toLowerCase().includes(query)
      return matchesTab && matchesSearch
    })
  }, [aiKeys, selectedTab, searchQuery])

  // Metrics
  const metrics = useMemo(() => {
    const total = aiKeys.length
    const active = aiKeys.filter((k) => k.is_active).length
    const providers = new Set(aiKeys.map((k) => k.provider.toLowerCase())).size
    const totalCalls = aiKeys.reduce((acc, k) => acc + (k.usage_count || 0), 0)
    return { total, active, providers, totalCalls }
  }, [aiKeys])

  const currentProviderConfig = PROVIDER_CONFIGS[providerInput] || PROVIDER_CONFIGS.other

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" label="Quản trị / Điều phối AI" className="text-xs font-mono" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Quản Lý AI & API Keys Đa Nhà Cung Cấp
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Kiểm soát tập trung toàn bộ API Key từ Google Gemini, Groq, OpenAI, Anthropic và DeepSeek. Tự động xoay vòng Round-Robin và tự động chuyển dự phòng (Auto-Failover) khi chạm hạn ngạch (Rate Limit 429).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm API Key
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng số Khóa</span>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Key className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{metrics.total}</p>
          <span className="text-xs text-slate-400 mt-1 block">Đã cấu hình trong DB</span>
        </Card>

        <Card className="p-4 border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Đang Hoạt Động</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-2">{metrics.active} / {metrics.total}</p>
          <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">Sẵn sàng xoay vòng</span>
        </Card>

        <Card className="p-4 border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">Nhà Cung Cấp</span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-2">{metrics.providers}</p>
          <span className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-1 block">Gemini, Groq, OpenAI...</span>
        </Card>

        <Card className="p-4 border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Tổng Lượt Gọi AI</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-2">{metrics.totalCalls}</p>
          <span className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 block">Lượt request đã phục vụ</span>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Provider Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'gemini', label: 'Google Gemini' },
              { id: 'groq', label: 'Groq Cloud' },
              { id: 'openai', label: 'OpenAI' },
              { id: 'anthropic', label: 'Anthropic' },
              { id: 'deepseek', label: 'DeepSeek' },
            ].map((tab) => {
              const active = selectedTab === tab.id
              const count = tab.id === 'all' ? aiKeys.length : aiKeys.filter((k) => k.provider.toLowerCase() === tab.id).length
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    active ? 'bg-indigo-700/60 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Nhà Cung Cấp</th>
                <th className="px-4 py-3">Tên Gợi Nhớ</th>
                <th className="px-4 py-3">Khóa Bảo Mật (Đã Ẩn)</th>
                <th className="px-4 py-3">Model Đề Xuất</th>
                <th className="px-4 py-3 text-center">Số Lần Gọi</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && aiKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách khóa...
                  </td>
                </tr>
              ) : filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">Không tìm thấy API Key nào</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Bấm "Thêm API Key" để thêm khóa mới'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredKeys.map((k) => {
                  const pConfig = PROVIDER_CONFIGS[k.provider.toLowerCase()] || PROVIDER_CONFIGS.other
                  const ProviderIcon = pConfig.icon
                  return (
                    <tr key={k.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Provider Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${pConfig.badgeBg} ${pConfig.badgeText} ${pConfig.badgeBorder}`}>
                          <ProviderIcon className="w-3.5 h-3.5" />
                          <span>{pConfig.label}</span>
                        </div>
                      </td>

                      {/* Key Name */}
                      <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {k.key_name}
                      </td>

                      {/* Masked Key */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs select-none">
                        <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded border border-slate-200/60 dark:border-slate-700 select-none cursor-default">
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-400 dark:text-slate-500 tracking-widest font-bold select-none">••••••••••••••••</span>
                          <span className="text-[10px] text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.2 rounded select-none font-sans font-medium">Đã bảo vệ</span>
                        </div>
                      </td>

                      {/* Recommended Models */}
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <span className="inline-block max-w-[200px] truncate" title={pConfig.models}>
                          {pConfig.models}
                        </span>
                      </td>

                      {/* Usage Count */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {k.usage_count} lượt gọi
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {k.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Tạm dừng
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleKey(k.id)}
                            className={`text-xs h-7 px-2.5 ${
                              k.is_active ? 'hover:bg-amber-50 hover:text-amber-600' : 'hover:bg-emerald-50 hover:text-emerald-600'
                            }`}
                          >
                            {k.is_active ? 'Tắt' : 'Bật'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKey(k.id, k.key_name)}
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Xóa khóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Key Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thêm API Key Đa Nhà Cung Cấp"
      >
        <form onSubmit={handleCreateKey} className="space-y-4 pt-1">
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
            Khóa sẽ được lưu an toàn vào cơ sở dữ liệu và tự động che mờ (chỉ hiển thị 6 ký tự đầu và 4 ký tự cuối). Hệ thống sẽ tự động đưa khóa vào pool xoay vòng (Round-Robin) của nhà cung cấp đã chọn.
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
              Nhà Cung Cấp (Provider)
            </label>
            <select
              value={providerInput}
              onChange={(e) => {
                setProviderInput(e.target.value)
                const cfg = PROVIDER_CONFIGS[e.target.value]
                if (cfg && !nameInput) {
                  setNameInput(cfg.namePlaceholder)
                }
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="groq">Groq Cloud (Siêu tốc: Llama 3.3, Llama 3.1, Mixtral)</option>
              <option value="gemini">Google Gemini (Mặc định: Flash-Lite, Flash 2.0)</option>
              <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet, Haiku)</option>
              <option value="deepseek">DeepSeek (DeepSeek-V3, DeepSeek-R1)</option>
              <option value="other">Khác (Custom Provider)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
              Tên Gợi Nhớ
            </label>
            <input
              type="text"
              placeholder={currentProviderConfig.namePlaceholder}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
              API Key (Được Bảo Mật)
            </label>
            <div className="relative">
              <input
                type={showPlainKey ? 'text' : 'password'}
                placeholder={currentProviderConfig.placeholder}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full pr-10 pl-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPlainKey(!showPlainKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showPlainKey ? 'Ẩn khóa' : 'Hiện khóa'}
              >
                {showPlainKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Định dạng mẫu cho {currentProviderConfig.label}: <code className="font-mono text-slate-600 dark:text-slate-300">{currentProviderConfig.placeholder}</code>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={savingKey}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={savingKey}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {savingKey ? 'Đang lưu & đồng bộ...' : 'Lưu & Kích Hoạt'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
