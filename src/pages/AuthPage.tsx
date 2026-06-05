import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, BookOpen, Zap, MessageSquare, FileText, ShieldCheck } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

type Variant = 'login' | 'register'

const copy = {
  login: {
    title: 'Welcome back',
    subtitle: 'Continue your study sessions with a single sign in.',
    cta: 'Sign in',
    alt: 'Need an account?',
    linkText: 'Create one',
    linkTo: '/register'
  },
  register: {
    title: 'Create your workspace',
    subtitle: 'Upload knowledge sources and chat with your AI tutor.',
    cta: 'Create account',
    alt: 'Already have an account?',
    linkText: 'Sign in',
    linkTo: '/login'
  }
} as const

const stats = [
  { label: 'Documents', value: '240+', icon: FileText },
  { label: 'Study Tools', value: '3 modules', icon: BookOpen },
  { label: 'Avg. Response', value: '1.4s', icon: Zap }
]

const features = [
  { icon: FileText, text: 'Upload PDFs, videos, audio, and URLs' },
  { icon: ShieldCheck, text: 'Track processing status in real time' },
  { icon: MessageSquare, text: 'Chat with contextual citations' }
]

function AuthShell({ variant }: { variant: Variant }) {
  const content = copy[variant]
  const navigate = useNavigate()
  const login = useAppStore((s) => s.auth.login)
  const register = useAppStore((s) => s.auth.register)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (variant === 'register' && !name.trim()) errs.name = 'Name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 8) errs.password = 'Min 8 characters'
    if (variant === 'register' && password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      if (variant === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
      navigate('/app/documents')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setErrors({ email: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
        <section className="flex w-full flex-col gap-8 lg:w-5/12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-foreground">Learning Hub</p>
                <p className="text-2xs text-muted-foreground">AI Study Workspace</p>
              </div>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground text-balance lg:text-5xl">
              {content.title}
            </h1>
            <p className="text-base text-muted-foreground max-w-md">{content.subtitle}</p>
          </div>

          <Card className="p-6">
            <div className="grid gap-4">
              {variant === 'register' && (
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-foreground/80">
                    Full name
                  </label>
                  <Input
                    placeholder="Nguyen Minh"
                    value={name}
                    onChange={setName}
                    error={errors.name}
                  />
                </div>
              )}

              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground/80">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground/80">Password</label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={setPassword}
                  error={errors.password}
                />
              </div>

              {variant === 'register' && (
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-foreground/80">
                    Confirm password
                  </label>
                  <Input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    error={errors.confirmPassword}
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              loading={loading}
              className="mt-6 w-full"
              size="lg"
              iconRight={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
            >
              {content.cta}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{content.alt}</span>
              <Link
                className="font-semibold text-primary transition hover:underline"
                to={content.linkTo}
              >
                {content.linkText}
              </Link>
            </div>
          </Card>
        </section>

        <aside className="w-full lg:w-6/12">
          <Card className="p-8" variant="elevated">
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm text-foreground/90 italic leading-relaxed">
                  "Search documents, ask questions, and capture citations in one workspace."
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border bg-surface-elevated p-4 text-center"
                    >
                      <Icon className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
                      <p className="font-display text-lg font-bold text-foreground tabular-nums">
                        {item.value}
                      </p>
                      <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
                        {item.label}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="grid gap-2.5">
                {features.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.text}
                      className="flex items-start gap-3 rounded-xl border border-border bg-surface-elevated p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm text-foreground/80 pt-1">{item.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export function LoginPage() {
  return <AuthShell variant="login" />
}

export function RegisterPage() {
  return <AuthShell variant="register" />
}
