import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, ArrowRight, Mail, Lock, User, GraduationCap } from 'lucide-react'
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
    title: 'Chào mừng trở lại',
    subtitle: 'Đăng nhập để tiếp tục hành trình học tập của bạn.',
    cta: 'Đăng nhập',
    alt: 'Chưa có tài khoản?',
    linkText: 'Tạo tài khoản',
    linkTo: '/register',
  },
  register: {
    title: 'Tạo tài khoản mới',
    subtitle: 'Tham gia nền tảng học tập thông minh cùng AI.',
    cta: 'Tạo tài khoản',
    alt: 'Đã có tài khoản?',
    linkText: 'Đăng nhập',
    linkTo: '/login',
  }
}

// Kept for visual compatibility with older route snapshots; lecturer signup is disabled server-side.
function AuthShell({ variant }: { variant: Variant }) {
  const content = copy[variant]
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAppStore((s) => s.auth.login)
  const register = useAppStore((s) => s.auth.register)
  const googleLogin = useAppStore((s) => s.auth.googleLogin)
  const facebookLogin = useAppStore((s) => s.auth.facebookLogin)

  const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname
  // Lecturer accounts are provisioned by an administrator; public signup is student-only.
  const roleFromUrl = 'student'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null)
  // Stores a Facebook access_token read from the URL hash (no setState inside effect)
  const pendingFbTokenRef = useRef<string | null>(null)
  const isStudent = true
  const roleLabel = 'Học viên'
  const roleIcon = <GraduationCap className="h-5 w-5" />

  const getRedirectPath = useCallback((user: { role?: string } | null) => {
    if (fromPath && !fromPath.includes('/login') && !fromPath.includes('/register') && !fromPath.includes('/welcome')) {
      return fromPath
    }
    return user?.role === 'admin'
      ? '/app/admin'
      : user?.role === 'lecturer'
      ? '/app/lecturer/dashboard'
      : '/app/student/dashboard'
  }, [fromPath])

  const handleFacebookTokenLogin = useCallback(
    async (accessToken: string) => {
      setSocialLoading('facebook')
      setErrors({})
      try {
        await facebookLogin(accessToken)
        const user = useAppStore.getState().auth.user
        navigate(getRedirectPath(user))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Đăng nhập Facebook thất bại'
        setErrors({ form: msg })
      } finally {
        setSocialLoading(null)
      }
    },
    [facebookLogin, navigate, getRedirectPath]
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

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSocialLoading('google')
      setErrors({})
      try {
        await googleLogin(tokenResponse.access_token)
        const user = useAppStore.getState().auth.user
        navigate(getRedirectPath(user))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Đăng nhập Google thất bại'
        setErrors({ form: msg })
      } finally {
        setSocialLoading(null)
      }
    },
    onError: () => {
      setErrors({ form: 'Đăng nhập Google đã bị hủy hoặc thất bại.' })
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
      setErrors({ form: 'Chưa cấu hình Facebook App ID trong .env' })
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (variant === 'register' && !name.trim()) errs.name = 'Vui lòng nhập họ và tên'
    if (!email.trim()) errs.email = 'Vui lòng nhập địa chỉ email'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Địa chỉ email không hợp lệ'
    if (!password) errs.password = 'Vui lòng nhập mật khẩu'
    else if (variant === 'register' && password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự'
    if (variant === 'register' && password !== confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận không khớp'
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
        await login(email, password, rememberMe)
        const user = useAppStore.getState().auth.user
        navigate(getRedirectPath(user))
      } else {
        await register(email, password, name, roleFromUrl)
        const user = useAppStore.getState().auth.user
        navigate(getRedirectPath(user))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra, vui lòng thử lại'
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
              <p className="text-3xs uppercase font-bold tracking-wider text-muted-foreground">Không gian học tập AI</p>
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
                Hoặc tiếp tục với email
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
                  name="full_name"
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={setName}
                  error={errors.name}
                  prefixIcon={<User className="h-4 w-4 text-muted-foreground" />}
                />
              )}

              <AuthInput
                name="email"
                label="Địa chỉ email"
                type="email"
                placeholder="ban@example.com"
                value={email}
                onChange={setEmail}
                error={errors.email}
                prefixIcon={<Mail className="h-4 w-4 text-muted-foreground" />}
              />

              <AuthInput
                name="password"
                label="Mật khẩu"
                type="password"
                placeholder="Tối thiểu 8 ký tự"
                value={password}
                onChange={setPassword}
                error={errors.password}
                prefixIcon={<Lock className="h-4 w-4 text-muted-foreground" />}
              />

              {variant === 'register' && (
                <AuthInput
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
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
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-border bg-surface-elevated text-blue-500 focus:ring-blue-500/30 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground select-none">Duy trì đăng nhập</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              {/* Register extras */}
              {variant === 'register' && (
                <p className="text-3xs text-muted-foreground leading-relaxed">
                  Bằng việc tạo tài khoản, bạn đồng ý với{' '}
                  <button type="button" className="font-bold text-blue-500 hover:underline">Điều khoản dịch vụ</button>
                  {' '}và{' '}
                  <button type="button" className="font-bold text-blue-500 hover:underline">Chính sách bảo mật</button>.
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
                {loading ? 'Đang xác thực...' : content.cta}
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
                  <p className="font-bold text-foreground text-sm">Cổng thông tin {roleLabel}</p>
                  <p className="text-3xs text-muted-foreground uppercase tracking-wider font-semibold">Đặc quyền học tập</p>
                </div>
              </div>
              <ul className="space-y-3.5 text-xs text-muted-foreground">
                {isStudent ? (
                  <>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>Truy cập đầy đủ giáo trình & tài liệu học tập</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>Trợ lý AI hỗ trợ giải đáp & định hướng học tập</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>Thống kê tiến độ & theo dõi kết quả rèn luyện</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span>Thiết kế bài giảng & quản lý giáo trình linh hoạt</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span>Chấm điểm bài tập & đánh giá trắc nghiệm tự động</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span>Theo dõi dữ liệu học viên & đánh giá khóa học</span>
                    </li>
                  </>
                )}
              </ul>
            </Card>

            {/* Quote Card */}
            <Card className="p-6 border-border bg-surface-elevated">
              <p className="text-xs italic text-foreground/80 leading-relaxed">
                "Giáo dục là vũ khí mạnh nhất mà bạn có thể dùng để thay đổi thế giới."
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
