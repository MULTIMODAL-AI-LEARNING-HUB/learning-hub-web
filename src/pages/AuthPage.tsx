import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

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
  { label: 'Documents', value: '240+' },
  { label: 'Study Tools', value: '3 modules' },
  { label: 'Avg. Response', value: '1.4s' }
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
    } catch {
      setErrors({ email: 'Invalid credentials' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
        <section className="flex w-full flex-col gap-8 lg:w-5/12">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Learning Hub</p>
            <h1 className="font-display text-4xl font-semibold text-ink lg:text-5xl">{content.title}</h1>
            <p className="text-base text-inkMute">{content.subtitle}</p>
          </div>

          <div className="rounded-2xl border border-border bg-panel p-6 shadow-soft">
            <div className="grid gap-4">
              {variant === 'register' && (
                <div className="grid gap-1.5">
                  <label className="text-sm text-inkSoft">Full name</label>
                  <Input
                    placeholder="Nguyen Minh"
                    value={name}
                    onChange={setName}
                    error={errors.name}
                  />
                </div>
              )}

              <div className="grid gap-1.5">
                <label className="text-sm text-inkSoft">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm text-inkSoft">Password</label>
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
                  <label className="text-sm text-inkSoft">Confirm password</label>
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
            >
              {content.cta}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-inkMute">
              <span>{content.alt}</span>
              <Link className="font-medium text-ink transition hover:text-accent" to={content.linkTo}>
                {content.linkText}
              </Link>
            </div>
          </div>
        </section>

        <aside className="w-full rounded-2xl border border-border bg-panel p-8 shadow-lift lg:w-6/12">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-inkSoft italic">
              "Search documents, ask questions, and capture citations in one workspace."
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-xl bg-surface px-4 py-3 text-center">
                  <p className="font-display text-xl font-semibold text-ink">{item.value}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-inkMute">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3">
              {[
                'Upload PDFs, videos, audio, and URLs',
                'Track processing status in real time',
                'Chat with contextual citations'
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl bg-surface px-4 py-3 text-sm text-inkSoft">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
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
