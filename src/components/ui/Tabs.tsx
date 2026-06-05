import { useState, type ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { TabsContext, useTabs } from './tabs-context'

interface TabsProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  children: ReactNode
  className?: string
}

function TabsRoot({ value, defaultValue, onChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const currentValue = value ?? internalValue
  const handleChange = (v: string) => {
    if (value === undefined) setInternalValue(v)
    onChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsListImpl({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-lg bg-muted',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  icon?: ReactNode
  className?: string
  count?: number
}

function TabsTriggerImpl({ value, children, icon, className, count }: TabsTriggerProps) {
  const { value: current, onChange } = useTabs()
  const active = current === value
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => onChange(value)}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 h-7 text-xs font-medium rounded-md transition',
        active
          ? 'bg-surface-elevated text-foreground shadow-soft'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            'ml-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded text-[10px] font-semibold',
            active ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

function TabsContentImpl({ value, children, className }: TabsContentProps) {
  const { value: current } = useTabs()
  if (current !== value) return null
  return (
    <div role="tabpanel" className={cn('mt-3 animate-fade-in', className)}>
      {children}
    </div>
  )
}

export const Tabs = TabsRoot as typeof TabsRoot & {
  List: typeof TabsListImpl
  Trigger: typeof TabsTriggerImpl
  Content: typeof TabsContentImpl
}

Tabs.List = TabsListImpl
Tabs.Trigger = TabsTriggerImpl
Tabs.Content = TabsContentImpl

