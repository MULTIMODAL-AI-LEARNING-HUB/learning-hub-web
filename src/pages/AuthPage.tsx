import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  GraduationCap,
  Briefcase,
  Building2,
  BookOpen,
  Link2,
  ShieldCheck,
} from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAppStore } from '../stores/appStore'
import { Button } from '../components/ui/Button'
import { AuthInput } from '../components/auth/AuthInput'
import { SocialLoginButton } from '../components/auth/SocialLoginButton'
import { PasswordStrength } from '../components/auth/PasswordStrength'
import { AuthLayout } from '../components/auth/AuthLayout'
import { cn } from '../utils/cn'

type Variant = 'login' | 'register'
type Role = 'student' | 'lecturer'

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

const lecturerBlurb =
  'Tài khoản Giảng viên dùng để mở lớp, đăng giáo trình và theo dõi học viên. Vui lòng dùng email công việc để được tin tưởng hơn.'

function AuthShell({ variant }: { variant: Variant }) {
  const content = {
    login: {
      alt: 'Chưa có tài khoản?',
      linkText: 'Tạo tài khoản',
    },
    register: {
      alt: 'Đã có tài khoản?',
      linkText: 'Đăng nhập',
    },
  }[variant]
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const login = useAppStore((s) => s.auth.login)
  const register = useAppStore((s) => s.auth.register)
  const googleLogin = useAppStore((s) => s.auth.googleLogin)
  const facebookLogin = useAppStore((s) => s.auth.facebookLogin)

  const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null)
  // Lecturer onboarding step (register only): 1 = tài khoản, 2 = hồ sơ giảng dạy
  const [lecturerStep, setLecturerStep] = useState(1)
  const [organization, setOrganization] = useState('')
  const [subject, setSubject] = useState('')
  const [bio, setBio] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  // Stores a Facebook access_token read from the URL hash (no setState inside effect)
  const pendingFbTokenRef = useRef<string | null>(null)

  const selectedRole: Role = searchParams.get('role') === 'lecturer' ? 'lecturer' : 'student'

  const handleSelectRole = (role: Role) => {
    setLecturerStep(1)
    setErrors({})
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('role', role)
      return next
    })
  }

  const isRegister = variant === 'register'
  const isStudent = selectedRole === 'student'
  const isLecturerRegister = isRegister && !isStudent

  const getRedirectPath = useCallback(
    (user: { role?: string } | null) => {
      if (
        fromPath &&
        !fromPath.includes('/login') &&
        !fromPath.includes('/register') &&
        !fromPath.includes('/welcome')
      ) {
        return fromPath
      }
      return user?.role === 'admin'
        ? '/app/admin'
        : user?.role === 'lecturer'
          ? '/app/lecturer/dashboard'
          : '/app/student/dashboard'
    },
    [fromPath]
  )

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
    },
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

  const validateAccount = () => {
    const errs: Record<string, string> = {}
    if (isRegister && !name.trim()) errs.name = 'Vui lòng nhập họ và tên'
    if (!email.trim()) errs.email = 'Vui lòng nhập địa chỉ email'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Địa chỉ email chưa đúng định dạng'
    if (!password) errs.password = 'Vui lòng nhập mật khẩu'
    else if (isRegister && password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự'
    if (isRegister && password !== confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận chưa khớp'
    }
    return errs
  }

  const validateLecturerProfile = () => {
    const errs: Record<string, string> = {}
    if (!organization.trim()) errs.organization = 'Vui lòng nhập trường hoặc tổ chức công tác'
    if (!subject.trim()) errs.subject = 'Vui lòng nhập môn giảng dạy chính'
    if (bio.trim() && bio.trim().length < 20)
      errs.bio = 'Giới thiệu nên có ít nhất 20 ký tự để học viên hiểu rõ bạn'
    if (portfolioUrl.trim() && !/^https?:\/\/.+\..+/.test(portfolioUrl.trim()))
      errs.portfolioUrl = 'Đường dẫn phải bắt đầu bằng http:// hoặc https://'
    return errs
  }

  const persistLecturerProfile = (registeredEmail: string) => {
    try {
      const key = `lecturer_profile:${registeredEmail.toLowerCase()}`
      window.localStorage.setItem(
        key,
        JSON.stringify({
          organization: organization.trim(),
          subject: subject.trim(),
          bio: bio.trim(),
          portfolioUrl: portfolioUrl.trim(),
          completedAt: new Date().toISOString(),
        })
      )
    } catch {
      // localStorage có thể bị chặn — hồ sơ vẫn đăng ký thành công, bỏ qua lặng lẽ.
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Lecturer register bước 1: kiểm tra tài khoản rồi mới sang hồ sơ giảng dạy.
    if (isLecturerRegister && lecturerStep === 1) {
      const errs = validateAccount()
      setErrors(errs)
      if (Object.keys(errs).length > 0) return
      setLecturerStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const errs =
      isLecturerRegister && lecturerStep === 2
        ? { ...validateAccount(), ...validateLecturerProfile() }
        : validateAccount()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      if (variant === 'login') {
        await login(email, password, rememberMe)
        const user = useAppStore.getState().auth.user
        navigate(getRedirectPath(user))
      } else {
        await register(email, password, name, selectedRole)
        if (isLecturerRegister) persistLecturerProfile(email)
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

  const header = !isRegister
    ? isStudent
      ? {
          title: 'Chào mừng trở lại',
          subtitle: 'Đăng nhập để tiếp tục hành trình học tập của bạn.',
        }
      : {
          title: 'Chào mừng trở lại',
          subtitle: 'Đăng nhập để quản lý lớp học và đồng hành cùng học viên.',
        }
    : isStudent
      ? {
          title: 'Tạo tài khoản Học viên',
          subtitle: 'Học cùng AI tutor, luyện đề mỗi ngày và theo dõi tiến độ rõ ràng.',
        }
      : lecturerStep === 1
        ? {
            title: 'Trở thành Giảng viên',
            subtitle: 'Tạo tài khoản để thiết kế khóa học và quản lý lớp học của bạn.',
          }
        : {
            title: 'Hồ sơ giảng dạy',
            subtitle: 'Hồ sơ rõ ràng giúp học viên tin tưởng và mở lớp nhanh hơn.',
          }

  const ctaLabel = !isRegister
    ? 'Đăng nhập'
    : isStudent
      ? 'Tạo tài khoản Học viên'
      : lecturerStep === 1
        ? 'Tiếp tục'
        : 'Hoàn tất đăng ký'

  return (
    <AuthLayout role={selectedRole}>
      {/* Header */}
      <div className="space-y-2">
        {isLecturerRegister && (
          <ol
            className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground"
            aria-label="Tiến trình đăng ký giảng viên"
          >
            <li aria-current={lecturerStep === 1 ? 'step' : undefined}>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
                  lecturerStep === 1
                    ? 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                    : 'border-border text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                    lecturerStep === 1
                      ? 'bg-purple-600 text-white'
                      : lecturerStep > 1
                        ? 'bg-success text-white'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {lecturerStep > 1 ? '✓' : '1'}
                </span>
                Tài khoản
              </span>
            </li>
            <li aria-hidden="true" className="h-px w-6 bg-border" />
            <li aria-current={lecturerStep === 2 ? 'step' : undefined}>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
                  lecturerStep === 2
                    ? 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                    : 'border-border text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                    lecturerStep === 2 ? 'bg-purple-600 text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  2
                </span>
                Hồ sơ giảng dạy
              </span>
            </li>
          </ol>
        )}
        <h1 className="font-display text-[clamp(1.625rem,1.35rem+1.25vw,2.125rem)] font-bold leading-tight tracking-tight text-foreground">
          {header.title}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{header.subtitle}</p>
      </div>

      {/* Role segmented control (register only) */}
      {isRegister && (
        <div className="mt-6">
          <div
            role="tablist"
            aria-label="Chọn vai trò tài khoản"
            className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/60 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isStudent}
              onClick={() => handleSelectRole('student')}
              className={cn(
                'flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isStudent
                  ? 'bg-surface-elevated text-foreground shadow-soft ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <GraduationCap
                className={cn('h-[18px] w-[18px]', isStudent ? 'text-blue-600' : 'text-muted-foreground')}
                aria-hidden="true"
              />
              <span>
                Học viên
                <span className="block text-xs font-normal text-muted-foreground">Học & luyện tập</span>
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isStudent}
              onClick={() => handleSelectRole('lecturer')}
              className={cn(
                'flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                !isStudent
                  ? 'bg-surface-elevated text-foreground shadow-soft ring-1 ring-purple-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Briefcase
                className={cn('h-[18px] w-[18px]', !isStudent ? 'text-purple-600' : 'text-muted-foreground')}
                aria-hidden="true"
              />
              <span>
                Giảng viên
                <span className="block text-xs font-normal text-muted-foreground">Dạy & quản lý lớp</span>
              </span>
            </button>
          </div>
          {!isStudent && lecturerStep === 1 && (
            <p className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-3 py-2 text-[13px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" aria-hidden="true" />
              <span>{lecturerBlurb}</span>
            </p>
          )}
        </div>
      )}

      {/* Social login */}
      <div className="mt-6 grid grid-cols-1 gap-2.5 xs:grid-cols-2">
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

      <div className="relative my-5 flex items-center justify-center" aria-hidden="true">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <span className="relative bg-background px-3 text-xs font-medium text-muted-foreground">
          Hoặc tiếp tục với email
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        {errors.form && (
          <div
            className="rounded-xl border border-destructive/25 bg-destructive/[0.07] px-3.5 py-2.5 text-sm font-medium text-destructive"
            role="alert"
          >
            {errors.form}
          </div>
        )}

        {/* Bước hồ sơ giảng dạy (register lecturer, bước 2) */}
        {isLecturerRegister && lecturerStep === 2 ? (
          <>
            <AuthInput
              name="organization"
              label="Trường / Tổ chức công tác"
              placeholder="VD: Đại học Bách khoa Hà Nội"
              value={organization}
              onChange={setOrganization}
              error={errors.organization}
              required
              autoComplete="organization"
              prefixIcon={<Building2 className="h-4 w-4" aria-hidden="true" />}
            />
            <AuthInput
              name="subject"
              label="Môn giảng dạy chính"
              placeholder="VD: Toán cao cấp, Lập trình Python"
              value={subject}
              onChange={setSubject}
              error={errors.subject}
              required
              autoComplete="off"
              prefixIcon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
            />
            <div className="grid w-full gap-1.5">
              <label htmlFor="lecturer-bio" className="text-sm font-semibold text-foreground">
                Giới thiệu ngắn
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(không bắt buộc)</span>
              </label>
              <textarea
                id="lecturer-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Kinh nghiệm giảng dạy, thành tựu nghiên cứu, phong cách dạy học…"
                aria-invalid={Boolean(errors.bio)}
                aria-describedby={errors.bio ? 'lecturer-bio-error' : 'lecturer-bio-hint'}
                className={cn(
                  'w-full rounded-xl border border-input bg-surface-elevated px-3.5 py-2.5 text-[15px] text-foreground',
                  'placeholder:text-muted-foreground/60 transition-all duration-200',
                  'hover:border-foreground/25',
                  'focus:border-purple-500 focus:outline-none focus:ring-[3px] focus:ring-purple-500/20',
                  errors.bio && 'border-destructive/60 focus:border-destructive focus:ring-destructive/15'
                )}
              />
              {errors.bio ? (
                <p id="lecturer-bio-error" role="alert" className="text-[13px] font-medium text-destructive">
                  {errors.bio}
                </p>
              ) : (
                <p id="lecturer-bio-hint" className="text-[13px] text-muted-foreground">
                  {bio.trim().length}/500 ký tự — tối thiểu 20 ký tự nếu có viết.
                </p>
              )}
            </div>
            <AuthInput
              name="portfolioUrl"
              label="Website / Hồ sơ cá nhân"
              type="url"
              placeholder="https://…"
              value={portfolioUrl}
              onChange={setPortfolioUrl}
              error={errors.portfolioUrl}
              hint="Không bắt buộc — link Google Scholar, LinkedIn hoặc trang cá nhân."
              autoComplete="url"
              prefixIcon={<Link2 className="h-4 w-4" aria-hidden="true" />}
            />
          </>
        ) : (
          <>
            {isRegister && (
              <AuthInput
                name="full_name"
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={setName}
                error={errors.name}
                required
                autoComplete="name"
                prefixIcon={<User className="h-4 w-4" aria-hidden="true" />}
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
              required
              autoComplete="email"
              prefixIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
            />

            <div className="grid gap-2">
              <AuthInput
                name="password"
                label="Mật khẩu"
                type="password"
                placeholder={isRegister ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu của bạn'}
                value={password}
                onChange={setPassword}
                error={errors.password}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                prefixIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
              />
              {isRegister && <PasswordStrength password={password} />}
            </div>

            {isRegister && (
              <AuthInput
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
                prefixIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
              />
            )}
          </>
        )}

        {/* Login extras */}
        {!isRegister && (
          <div className="flex items-center justify-between">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-border bg-surface-elevated accent-primary"
              />
              <span className="select-none text-sm text-muted-foreground">Duy trì đăng nhập</span>
            </label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="min-h-[44px] px-1 text-sm font-semibold text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Quên mật khẩu?
            </button>
          </div>
        )}

        {/* Register extras */}
        {isRegister && (!isLecturerRegister || lecturerStep === 2) && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Bằng việc tạo tài khoản, bạn đồng ý với{' '}
            <button type="button" className="font-semibold text-primary hover:underline">
              Điều khoản dịch vụ
            </button>{' '}
            và{' '}
            <button type="button" className="font-semibold text-primary hover:underline">
              Chính sách bảo mật
            </button>
            .
          </p>
        )}

        <div className={cn('grid gap-2.5', isLecturerRegister && lecturerStep === 2 && 'grid-cols-[auto_1fr]')}>
          {isLecturerRegister && lecturerStep === 2 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setLecturerStep(1)
                setErrors({})
              }}
              icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
              aria-label="Quay lại bước tài khoản"
            >
              Quay lại
            </Button>
          )}
          <Button
            type="submit"
            loading={loading}
            size="lg"
            fullWidth
            className={cn(
              'font-semibold',
              !isStudent && 'bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500'
            )}
            iconRight={!loading ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : undefined}
          >
            {loading ? 'Đang xác thực…' : ctaLabel}
          </Button>
        </div>
      </form>

      {/* Toggle link — giữ ?role= để không rớt vai trò khi chuyển trang */}
      <div className="mt-6 flex min-h-[44px] items-center justify-center gap-1.5 text-sm text-muted-foreground">
        <span>{content.alt}</span>
        <Link
          className="font-semibold text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          to={isRegister ? `/login?role=${selectedRole}` : `/register?role=${selectedRole}`}
        >
          {content.linkText}
        </Link>
      </div>
    </AuthLayout>
  )
}

export function LoginPage() {
  return <AuthShell variant="login" />
}

export function RegisterPage() {
  return <AuthShell variant="register" />
}
