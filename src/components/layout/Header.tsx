import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { Progress } from '../ui/Progress'

export function Header() {
  const navigate = useNavigate()
  const notifications = useAppStore((s) => s.notifications.items)
  const dismissNotif = useAppStore((s) => s.notifications.dismiss)
  const [search, setSearch] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const storagePct = Math.round((2 / 5) * 100)
  const tokenPct = Math.round((10000 / 50000) * 100)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="mb-4 flex flex-col gap-4 rounded-2xl border border-border bg-panel px-4 py-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      {/* Left: Search */}
      <div className="flex items-center gap-3">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-inkMute transition hover:bg-surface lg:hidden"
          onClick={() => navigate('/app')}
        >
          ☰
        </button>
        <div className="relative flex-1 lg:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-inkMute">🔍</span>
          <input
            type="search"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 lg:w-80"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-inkMute transition hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right: Quota + Notifications */}
      <div className="flex items-center gap-3 text-sm text-inkSoft">
        {/* Quota */}
        <div className="hidden rounded-xl border border-border bg-surface px-4 py-2.5 sm:block">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-inkMute">Quota</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Progress value={storagePct} variant="accent" />
            <span className="whitespace-nowrap text-xs">2/5GB</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Progress value={tokenPct} />
            <span className="whitespace-nowrap text-xs">10k/50k</span>
          </div>
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm transition hover:bg-surface"
          >
            🔔
            {notifications.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                {notifications.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-border bg-panel p-3 shadow-lift">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-inkMute">Notifications</p>
                {notifications.length > 0 && (
                  <button
                    onClick={() => useAppStore.getState().notifications.clear()}
                    className="text-xs text-accent transition hover:text-accent/80"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="mt-2 grid gap-2">
                {notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-inkMute">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="group flex items-start gap-3 rounded-xl bg-surface px-3 py-2.5 transition hover:bg-surfaceDeep"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{n.title}</p>
                        <p className="text-xs text-inkMute">{n.detail}</p>
                        <p className="mt-1 text-[10px] text-inkMute">{n.time}</p>
                      </div>
                      <button
                        onClick={() => dismissNotif(n.id)}
                        className="shrink-0 text-inkMute opacity-0 transition group-hover:opacity-100 hover:text-danger"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
