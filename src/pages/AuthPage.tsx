import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, ArrowRight, Mail, Lock, User, GraduationCap, BookOpen } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAppStore } from '../stores/appStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { AuthInput } from '../components/auth/AuthInput'
import { SocialLoginButton } from '../components/auth/SocialLoginButton'
import { cn } from '../utils/cn'

type Variant = 'login' | 'register'

// ── Facebook SDK types (module-level) ──────────────────────────────────────
interface FBAuthResponse {
  accessToken: string
  userID: string
  expiresIn: number
  signedRequest: string
}
interface FBLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse?: FBAuthResponse
}
interface FacebookSDK {
  init(opts: { appId: string; cookie: boolean; xfbml: boolean; version: string }): void
  login(callback: (response: FBLoginResponse) => void, opts?: { scope: string }): void
}
interface FacebookWindow extends Window {
  FB?: FacebookSDK
}
const fbWindow = window as FacebookWindow

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
  const googleLogin = useAppStore((s) => s.auth.googleLogin)
  const facebookLogin = useAppStore((s) => s.auth.facebookLogin)

  const roleFromUrl = searchParams.get('role') || 'student'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null)
  const [currentRole, setCurrentRole] = useState(roleFromUrl)
  // Stores a Facebook access_token read from the URL hash (no setState inside effect)
  const pendingFbTokenRef = useRef<string | null>(null)

  useEffect(() => {
    setSearchParams({ role: currentRole })
  }, [currentRole, setSearchParams])

  const handleFacebookTokenLogin = useCallback(
    async (accessToken: string) => {
      setSocialLoading('facebook')
      setErrors({})
      try {
        await facebookLogin(accessToken)
        const user = useAppStore.getState().auth.user
        const redirectPath =
          user?.role === 'admin'
            ? '/app/admin'
            : user?.role === 'lecturer'
            ? '/app/lecturer/dashboard'
            : '/app/student/dashboard'
        navigate(redirectPath)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Facebook login failed'
        setErrors({ form: msg })
      } finally {
        setSocialLoading(null)
      }
    },
    [facebookLogin, navigate]
  )

  // Effect 1: Load Facebook SDK script & capture access_token from URL hash into a ref.
  // No setState is called here — storing in a ref avoids cascading renders.
  useEffect(() => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID
    if (appId && !fbWindow.FB) {
      const script = document.createElement('script')
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      script.onload = () => {
        fbWindow.FB?.init({
          appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
        })
      }
      document.body.appendChild(script)
    }

    if (window.location.hash.includes('access_token=')) {
      const params = new URLSearchParams(window.location.hash.substring(1))
      const token = params.get('access_token')
      if (token) {
        window.history.replaceState(null, '', window.location.pathname)
        pendingFbTokenRef.current = token
      }
    }
  }, [])

  // Effect 2: Process the pending FB token captured above.
  // Runs after handleFacebookTokenLogin is stable (after first render).
  useEffect(() => {
    const token = pendingFbTokenRef.current
    if (token) {
      pendingFbTokenRef.current = null
      void handleFacebookTokenLogin(token)
    }
  }, [handleFacebookTokenLogin])

  const handleRoleChange = (role: string) => {
    setCurrentRole(role)
    setErrors({})
  }

  const isStudent = currentRole === 'student'
  const roleLabel = isStudent ? 'Student' : 'Lecturer'
  const roleIcon = isStudent ? <GraduationCap className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSocialLoading('google')
      setErrors({})
      try {
        await googleLogin(tokenResponse.access_token)
        const user = useAppStore.getState().auth.user
        const redirectPath =
          user?.role === 'admin'
            ? '/app/admin'
            : user?.role === 'lecturer'
            ? '/app/lecturer/dashboard'
            : '/app/student/dashboard'
        navigate(redirectPath)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Google login failed'
        setErrors({ form: msg })
      } finally {
        setSocialLoading(null)
      }
    },
    onError: () => {
      setErrors({ form: 'Google login was cancelled or failed.' })
    }
  })

  const handleFacebookClick = () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID
    if (fbWindow.FB) {
      setSocialLoading('facebook')
      fbWindow.FB.login(
        (response) => {
          if (response.authResponse?.accessToken) {
            void handleFacebookTokenLogin(response.authResponse.accessToken)
          } else {
            setSocialLoading(null)
          }
        },
        { scope: 'email,public_profile' }
      )
    } else if (appId) {
      const redirectUri = window.location.origin + '/login'
      const fbUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=email,public_profile`
      window.location.href = fbUrl
    } else {
      setErrors({ form: 'Facebook App ID is not configured yet in .env' })
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (variant === 'register' && !name.trim()) errs.name = 'Name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email address'
    if (!password) errs.password = 'Password is required'
    else if (variant === 'register' && password.length < 12) errs.password = 'Minimum 12 characters'
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
    <div className="relative min-h-screen animate-fade-in overflow-hidden bg-background font-body">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16 relative z-10">
        {/* Left: Brand + Form */}
        <section className="flex w-full flex-col gap-6 lg:w-[480px] animate-zoom-in-95">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
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
          <Card className="border-border bg-surface-elevated p-6 sm:p-8 shadow-lift relative">
            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <SocialLoginButton
                provider="google"
                onClick={() => triggerGoogleLogin()}
                loading={socialLoading === 'google'}
                disabled={loading || socialLoading !== null}
              />
              <SocialLoginButton
                provider="facebook"
                onClick={handleFacebookClick}
                loading={socialLoading === 'facebook'}
                disabled={loading || socialLoading !== null}
              />
            </div>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative bg-surface-elevated px-3 text-3xs font-bold uppercase tracking-wider text-muted-foreground">
                Or continue with email
              </div>
            </div>

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
                  "w-full font-semibold"
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
            <Card className="p-6 border-border bg-surface-elevated shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20"
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
            <Card className="p-6 border-border bg-surface-elevated">
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
