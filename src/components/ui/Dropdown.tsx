import { type ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../../utils/cn'

interface DropdownItem {
  id: string
  label: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  shortcut?: string
}

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  onSelect: (id: string) => void
  align?: 'left' | 'right' | 'center'
  className?: string
  menuClassName?: string
}

const alignClasses = {
  left: 'left-0',
  right: 'right-0',
  center: 'left-1/2 -translate-x-1/2'
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  align = 'right',
  className,
  menuClassName
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, handleClickOutside])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div
        onClick={() => setOpen((p) => !p)}
        className="cursor-pointer"
        role="button"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </div>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-2 min-w-[180px] rounded-xl border border-border bg-surface-elevated py-1 shadow-lift',
            'animate-slide-in-from-top',
            alignClasses[align],
            menuClassName
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return
                onSelect(item.id)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition',
                'focus-visible:outline-none',
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : item.danger
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-muted'
              )}
            >
              {item.icon && <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-2xs font-mono text-muted-foreground">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
