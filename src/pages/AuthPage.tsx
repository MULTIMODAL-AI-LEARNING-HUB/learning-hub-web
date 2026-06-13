import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles, ArrowRight, Mail, Lock, User,
  FileText, BookOpen, Zap, MessageSquare, ShieldCheck,
  Quote
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { AuthInput } from '../components/auth/AuthInput'
import { SocialLoginButton } from '../components/auth/SocialLoginButton'

type Variant = 'login' | 'register'

const copy = {
  login: {
    title: 'Welcome back',
    subtitle: 'Continue your study sessions with a single sign in.',
    cta: 'Sign in',
    alt: "Don't have an account?",
    linkText: 'Create one',
    linkTo: '/register',
    heading: 'Sign in to',
  },
  register: {
    title: 'Create your workspace',
    subtitle: 'Upload knowledge sources and chat with your AI tutor.',
    cta: 'Create account',
    alt: 'Already have an account?',
    linkText: 'Sign in',
    linkTo: '/login',
    heading: 'Join',
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

function AnimatedNumber({ value }: { value: string }) {
  return (
    <span className="font-display text-lg font-bold text-foreground tabular-nums">
      {value}
    </span>
  )
}

function AuthShell({ variant }: { variant: Variant }) {
  const content = copy[variant]
  const navigate = useNavigate()
  const login = useAppStore((s) => s.auth.login)
  const register = useAppStore((s) => s.auth.register)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (variant === 'register' && !name.trim()) errs.name = 'Name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email address'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 8) errs.password = 'Minimum 8 characters'
    if (variant === 'register' && password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="relative min-h-screen gradient-mesh-auth animate-fade-in">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-20">
        {/* ─── Left: Brand + Form ─── */}
        <section
          key={variant}
          className="flex w-full flex-col gap-8 lg:w-5/12 animate-zoom-in-95"
        >
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
              <Sparkles className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-foreground">Learning Hub</p>
              <p className="text-2xs text-muted-foreground">AI Study Workspace</p>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground text-balance lg:text-5xl">
              {content.title}
            </h1>
            <p className="text-base text-muted-foreground max-w-md">
              {content.subtitle}
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-border/50 bg-surface-elevated/80 p-6 backdrop-blur-xl sm:p-8">
            <form onSubmit={handleSubmit} className="grid gap-5">
              {variant === 'register' && (
                <AuthInput
                  label="Full name"
                  placeholder="Nguyen Minh"
                  value={name}
                  onChange={setName}
                  error={errors.name}
                  prefixIcon={<User className="h-4 w-4" />}
                />
              )}

              <AuthInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                error={errors.email}
                prefixIcon={<Mail className="h-4 w-4" />}
              />

              <AuthInput
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={setPassword}
                error={errors.password}
                prefixIcon={<Lock className="h-4 w-4" />}
              />

              {variant === 'register' && (
                <AuthInput
                  label="Confirm password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={errors.confirmPassword}
                  prefixIcon={<Lock className="h-4 w-4" />}
                />
              )}

              {/* Login extras: Remember me + Forgot password */}
              {variant === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-border bg-surface-elevated text-primary focus:ring-primary/30 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground select-none">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Register extras: Terms */}
              {variant === 'register' && (
                <p className="text-xs text-muted-foreground">
                  By signing up, you agree to our{' '}
                  <button type="button" className="font-medium text-primary hover:underline">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button type="button" className="font-medium text-primary hover:underline">
                    Privacy Policy
                  </button>
                  .
                </p>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
                variant="gradient"
                iconRight={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
              >
                {loading ? 'Please wait...' : content.cta}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface-elevated px-3 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid gap-3">
              <SocialLoginButton provider="google" />
              <SocialLoginButton provider="github" />
            </div>

            {/* Toggle */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
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

        {/* ─── Right: Sidebar ─── */}
        <aside className="hidden w-full animate-slide-in-from-right lg:block lg:w-6/12">
          <div className="space-y-6">
            {/* Quote */}
            <Card variant="elevated" className="relative overflow-hidden p-6 border-border/50 bg-gradient-to-br from-primary/5 via-surface-elevated to-accent/5">
              <Quote className="absolute top-3 right-3 h-8 w-8 text-primary/10" />
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground/85 italic leading-relaxed">
                    "Search documents, ask questions, and capture citations in one workspace."
                  </p>
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    — AI Learning Hub
                  </p>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((item, i) => {
                const Icon = item.icon
                return (
                  <Card
                    key={item.label}
                    className="group border-border/50 p-4 text-center transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <AnimatedNumber value={item.value} />
                    <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
                      {item.label}
                    </p>
                  </Card>
                )
              })}
            </div>

            {/* Features */}
            <div className="grid gap-2.5">
              {features.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.text}
                    className="flex items-start gap-3 rounded-xl border border-border bg-surface-elevated p-3 transition-all duration-200 hover:border-primary/30 hover:bg-surface-elevated"
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
