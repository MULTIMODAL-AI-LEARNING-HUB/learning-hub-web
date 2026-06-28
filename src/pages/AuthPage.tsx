import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, ArrowRight, Mail, Lock, User, GraduationCap, BookOpen } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { AuthInput } from '../components/auth/AuthInput'

type Variant = 'login' | 'register'

const copy = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to continue your learning journey.',
    cta: 'Sign in',
    alt: "Don't have an account?",
    linkText: 'Create one',
    linkTo: '/register',
  },
  register: {
    title: 'Create your account',
    subtitle: 'Join our AI-powered learning platform.',
    cta: 'Create account',
    alt: 'Already have an account?',
    linkText: 'Sign in',
    linkTo: '/login',
  }
}

function AuthShell({ variant }: { variant: Variant }) {
  const content = copy[variant]
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAppStore((s) => s.auth.login)
  const register = useAppStore((s) => s.auth.register)

  const roleFromUrl = searchParams.get('role') || 'student'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const isStudent = roleFromUrl === 'student'
  const roleLabel = isStudent ? 'Student' : 'Lecturer'
  const roleIcon = isStudent ? <GraduationCap className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />

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
        const user = useAppStore.getState().auth.user
        const redirectPath = user?.role === 'lecturer' ? '/app/lecturer/dashboard' : '/app/student/dashboard'
        navigate(redirectPath)
      } else {
        await register(email, password, name)
        const user = useAppStore.getState().auth.user
        const redirectPath = user?.role === 'lecturer' ? '/app/lecturer/dashboard' : '/app/student/dashboard'
        navigate(redirectPath)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setErrors({ form: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen gradient-mesh-auth animate-fade-in">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        {/* Left: Brand + Form */}
        <section className="flex w-full flex-col gap-8 lg:w-[480px] animate-zoom-in-95">
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
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground text-balance lg:text-4xl">
              {content.title}
            </h1>
            <p className="text-base text-muted-foreground">
              {content.subtitle}
            </p>
          </div>

          {/* Role Badge (for register) */}
          {variant === 'register' && (
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              isStudent ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
            }`}>
              {roleIcon}
              <span>Registering as {roleLabel}</span>
            </div>
          )}

          {/* Form Card */}
          <Card className="border-border/50 bg-surface-elevated/80 p-6 backdrop-blur-xl sm:p-8">
            <form onSubmit={handleSubmit} className="grid gap-5">
              {errors.form && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive animate-shake-in" role="alert">
                  {errors.form}
                </div>
              )}

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

              {/* Login extras */}
              {variant === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border bg-surface-elevated text-primary focus:ring-primary/30 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground select-none">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Register extras */}
              {variant === 'register' && (
                <p className="text-xs text-muted-foreground">
                  By signing up, you agree to our{' '}
                  <button type="button" className="font-medium text-primary hover:underline">Terms</button>
                  {' '}and{' '}
                  <button type="button" className="font-medium text-primary hover:underline">Privacy Policy</button>.
                </p>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
                variant={variant === 'register' ? (isStudent ? 'primary' : 'gradient') : 'gradient'}
                iconRight={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
              >
                {loading ? 'Please wait...' : content.cta}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{content.alt}</span>
              <Link
                className="font-semibold text-primary transition hover:underline"
                to={content.linkTo + (variant === 'register' ? `?role=${roleFromUrl}` : '')}
              >
                {content.linkText}
              </Link>
            </div>
          </Card>
        </section>

        {/* Right: Decorative Panel */}
        <aside className="hidden w-full animate-slide-in-from-right lg:block lg:w-[400px]">
          <div className="space-y-6">
            {/* Role Info Card */}
            <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 via-surface-elevated to-accent/5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isStudent ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                  {roleIcon}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{roleLabel} Account</p>
                  <p className="text-xs text-muted-foreground">AI-powered learning tools</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {isStudent ? (
                  <>
                    <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Access to all courses</li>
                    <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI-powered study tools</li>
                    <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Track your progress</li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /> Create & manage courses</li>
                    <li className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /> Monitor student progress</li>
                    <li className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /> AI-assisted grading</li>
                  </>
                )}
              </ul>
            </Card>

            {/* Quote Card */}
            <Card className="p-6 border-border/50 bg-surface-elevated/60">
              <p className="text-sm italic text-foreground/80 leading-relaxed">
                "Education is the most powerful weapon which you can use to change the world."
              </p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">— Nelson Mandela</p>
            </Card>
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