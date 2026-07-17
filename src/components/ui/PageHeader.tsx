import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  icon?: ReactNode
  breadcrumb?: ReactNode
  actions?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'mb-4',
  md: 'mb-6',
  lg: 'mb-8'
}

export function PageHeader({
  title,
  subtitle,
  description,
  icon,
  breadcrumb,
  actions,
  className,
  size = 'md'
}: PageHeaderProps) {
  return (
    <header className={cn(sizes[size], className)}>
      {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {subtitle && (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {subtitle}
              </p>
            )}
            <h1 className="page-title font-display text-foreground">
              {title}
            </h1>
            {description && (
              <p className="mt-1 supporting-text text-muted-foreground max-w-[75ch]">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  )
}

export function Breadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground/40">/</span>}
          {item.to ? (
            <Link
              to={item.to}
              className="hover:text-foreground transition"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
