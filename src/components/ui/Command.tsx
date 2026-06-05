import { useEffect, useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { CommandItem } from './command-items'

interface CommandPaletteProps {
  items: CommandItem[]
  open: boolean
  onClose: () => void
}

export function CommandPalette({ items, open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const prevOpenRef = useRef(open)

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    prevOpenRef.current = open
  }, [open])

  const filtered = items.filter((it) =>
    query === '' ? true : (it.label + (it.description || '')).toLowerCase().includes(query.toLowerCase())
  )

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, it) => {
    if (!acc[it.group]) acc[it.group] = []
    acc[it.group].push(it)
    return acc
  }, {})

  const flatList = filtered

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, flatList.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = flatList[activeIndex]
        if (item) {
          item.action()
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, flatList, activeIndex, onClose])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  let runningIndex = -1

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-surface-elevated shadow-lift overflow-hidden animate-slide-in-from-top">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder="Search or jump to..."
            className="flex-1 h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-2xs font-mono text-muted-foreground">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="sm:hidden p-1 rounded text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">No results for "{query}"</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group} className="px-2">
                <p className="px-2 py-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
                {groupItems.map((item) => {
                  runningIndex++
                  const idx = runningIndex
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => {
                        item.action()
                        onClose()
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition',
                        idx === activeIndex
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'shrink-0 [&>svg]:h-4 [&>svg]:w-4',
                          idx === activeIndex ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Icon />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.description && (
                          <p
                            className={cn(
                              'text-xs truncate',
                              idx === activeIndex
                                ? 'text-primary-foreground/80'
                                : 'text-muted-foreground'
                            )}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.shortcut && (
                        <kbd
                          className={cn(
                            'inline-flex items-center rounded border px-1.5 py-0.5 text-2xs font-mono',
                            idx === activeIndex
                              ? 'border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground'
                              : 'border-border bg-muted text-muted-foreground'
                          )}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-t border-border bg-muted/30 text-2xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 font-mono">↑↓</kbd>
            Navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 font-mono">↵</kbd>
            Select
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 font-mono">ESC</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  )
}
