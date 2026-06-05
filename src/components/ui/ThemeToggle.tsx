import { useTheme } from './useTheme'
import { Button } from './Button'
import { Monitor, Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const label = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycle}
      icon={<Icon className="h-4 w-4" />}
      title={`Theme: ${label}`}
      aria-label={`Theme: ${label}`}
      className="text-muted-foreground hover:text-foreground"
    >
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
