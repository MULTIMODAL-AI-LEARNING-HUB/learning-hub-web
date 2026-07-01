import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface ResponsiveContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  as?: 'div' | 'section' | 'article' | 'main'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none'
}

const paddings = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5 lg:p-6',
  lg: 'p-5 sm:p-6 lg:p-8',
}

const maxWidths = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
  none: '',
}

export function ResponsiveContainer({
  children,
  as: Tag = 'div',
  padding = 'md',
  maxWidth = 'xl',
  className,
  ...rest
}: ResponsiveContainerProps) {
  return (
    <Tag
      className={cn(
        'w-full mx-auto',
        paddings[padding],
        maxWidth !== 'none' && maxWidth !== 'full' && maxWidths[maxWidth],
        maxWidth === 'full' && 'max-w-full',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

interface ResponsiveGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'none' | 'sm' | 'md' | 'lg'
}

const grids: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
}

const gaps = {
  none: 'gap-0',
  sm: 'gap-3',
  md: 'gap-4 lg:gap-6',
  lg: 'gap-6 lg:gap-8',
}

export function ResponsiveGrid({
  children,
  cols = 3,
  gap = 'md',
  className,
  ...rest
}: ResponsiveGridProps) {
  return (
    <div
      className={cn('grid', grids[cols], gaps[gap], className)}
      {...rest}
    >
      {children}
    </div>
  )
}
