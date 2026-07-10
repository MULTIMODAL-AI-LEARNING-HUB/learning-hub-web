import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, ArrowRight, Mail, Lock, User, GraduationCap, BookOpen } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { AuthInput } from '../components/auth/AuthInput'
import { cn } from '../utils/cn'

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

function RoleToggle({
  role,
  onChange,
}: {
  role: string
  onChange: (role: string) => void
}) {
  const isStudent = role === 'student'
  return (
    <div className="relative flex rounded-xl bg-surface-elevated/60 border border-border/30 p-1 shadow-sm">
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out ${
          isStudent
            ? 'left-1 bg-primary shadow-md'
            : 'left-[calc(50%+3px)] bg-accent shadow-md'
        }`}
      />
      <button
        type="button"
        onClick={() => onChange('student')}
        className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          isStudent ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <GraduationCap className="h-4 w-4" />
        <span>Student</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('lecturer')}
        className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          !isStudent ? 'text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <BookOpen className="h-4 w-4" />
        <span>Lecturer</span>
      </button>
    </div>
  )
}

function AuthShell({ variant }: { variant: Variant }) {
  const content = copy[variant]
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const login = useAppStore((s) => s.auth.login)
  const register = useAppStore((s) => s.auth.register)

  const roleFromUrl = searchParams.get('role') || 'student'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [currentRole, setCurrentRole] = useState(roleFromUrl)

  useEffect(() => {
    setSearchParams({ role: currentRole })
  }, [currentRole, setSearchParams])

  const handleRoleChange = (role: string) => {
    setCurrentRole(role)
    setErrors({})
  }

  const isStudent = currentRole === 'student'
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
        const redirectPath =
          user?.role === 'admin'
            ? '/app/admin'
            : user?.role === 'lecturer'
            ? '/app/lecturer/dashboard'
            : '/app/student/dashboard'
        navigate(redirectPath)
      } else {
        await register(email, password, name, roleFromUrl)
        const user = useAppStore.getState().auth.user
        const redirectPath =
          user?.role === 'admin'
            ? '/app/admin'
            : user?.role === 'lecturer'
            ? '/app/lecturer/dashboard'
            : '/app/student/dashboard'
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
    <div className="relative min-h-screen gradient-mesh-auth animate-fade-in overflow-hidden font-body">
      {/* Decorative Orbs */}
      <div className="orb bg-blue-500 w-80 h-80 -top-24 -left-24" />
      <div className="orb bg-purple-500 w-96 h-96 -bottom-36 -right-24" />

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16 relative z-10">
        {/* Left: Brand + Form */}
        <section className="flex w-full flex-col gap-6 lg:w-[480px] animate-zoom-in-95">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-glow">
              <Sparkles className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-sm font-display font-extrabold text-foreground">Learning Hub</p>
              <p className="text-3xs uppercase font-bold tracking-wider text-muted-foreground">AI Study Workspace</p>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground text-balance">
              {content.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {content.subtitle}
            </p>
          </div>

          {/* Role Toggle (for register) */}
          {variant === 'register' && (
            <div className="flex flex-col gap-3">
              <RoleToggle role={currentRole} onChange={handleRoleChange} />
            </div>
          )}

          {/* Form Card */}
          <Card className="border-border/40 bg-surface-elevated/45 backdrop-blur-xl p-6 sm:p-8 shadow-lift relative">
            <form onSubmit={handleSubmit} className="grid gap-5">
              {errors.form && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive animate-shake-in" role="alert">
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
                  prefixIcon={<User className="h-4 w-4 text-muted-foreground" />}
                />
              )}

              <AuthInput
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                error={errors.email}
                prefixIcon={<Mail className="h-4 w-4 text-muted-foreground" />}
              />

              <AuthInput
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={setPassword}
                error={errors.password}
                prefixIcon={<Lock className="h-4 w-4 text-muted-foreground" />}
              />

              {variant === 'register' && (
                <AuthInput
                  label="Confirm password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={errors.confirmPassword}
                  prefixIcon={<Lock className="h-4 w-4 text-muted-foreground" />}
                />
              )}

              {/* Login extras */}
              {variant === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border bg-surface-elevated text-blue-500 focus:ring-blue-500/30 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground select-none">Keep me signed in</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Register extras */}
              {variant === 'register' && (
                <p className="text-3xs text-muted-foreground leading-relaxed">
                  By creating an account, you agree to our{' '}
                  <button type="button" className="font-bold text-blue-500 hover:underline">Terms of Service</button>
                  {' '}and{' '}
                  <button type="button" className="font-bold text-blue-500 hover:underline">Privacy Policy</button>.
                </p>
              )}

              <Button
                type="submit"
                loading={loading}
                className={cn(
                  "w-full text-white font-bold tracking-wide shadow-md",
                  isStudent ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-gradient-to-r from-violet-500 to-purple-600"
                )}
                size="lg"
                iconRight={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
              >
                {loading ? 'Authenticating...' : content.cta}
              </Button>
            </form>

            {/* Toggle Link */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>{content.alt}</span>
              <Link
                className="font-bold text-blue-500 transition hover:underline"
                to={content.linkTo + (variant === 'register' ? `?role=${roleFromUrl}` : '')}
              >
                {content.linkText}
              </Link>
            </div>
          </Card>
        </section>

        {/* Right: Decorative Panel */}
        <aside className="hidden w-full lg:block lg:w-[400px] animate-slide-in-from-right">
          <div className="space-y-6">
            {/* Role Info Card */}
            <Card className={cn(
              "p-6 border bg-surface-elevated/45 backdrop-blur-md transition-all duration-300",
              isStudent ? "border-blue-500/10 glow-student" : "border-purple-500/10 glow-lecturer"
            )}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl ring-1",
                  isStudent ? "bg-blue-500/10 text-blue-500 ring-blue-500/20" : "bg-purple-500/10 text-purple-500 ring-purple-500/20"
                )}>
                  {roleIcon}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{roleLabel} Portal</p>
                  <p className="text-3xs text-muted-foreground uppercase tracking-wider font-semibold">Workspace Benefits</p>
                </div>
              </div>
              <ul className="space-y-3.5 text-xs text-muted-foreground">
                {isStudent ? (
                  <>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>Full syllabus access & study materials catalog</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>AI prompt assistants & study guides</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>Progress analytics & metrics trackers</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span>Design course details & lesson accordion builders</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span>Grade assignments & evaluate quizzes</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span>Observe student analytics & performance ratings</span>
                    </li>
                  </>
                )}
              </ul>
            </Card>

            {/* Quote Card */}
            <Card className="p-6 border-border/40 bg-surface-elevated/45 backdrop-blur-md">
              <p className="text-xs italic text-foreground/80 leading-relaxed">
                "Education is the most powerful weapon which you can use to change the world."
              </p>
              <p className="mt-3 text-3xs font-bold uppercase tracking-wider text-muted-foreground">— Nelson Mandela</p>
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