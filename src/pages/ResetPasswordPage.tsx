import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Sparkles, ArrowLeft, Lock, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { AuthInput } from '../components/auth/AuthInput'

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const resetPassword = useAppStore((s) => s.auth.resetPassword)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) { setError('Vui lòng nhập mật khẩu'); return }
    if (password.length < 8) { setError('Mật khẩu tối thiểu 8 ký tự'); return }
    if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }
    if (!token) { setError('Liên kết đặt lại không hợp lệ'); return }

    setError('')
    setLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="relative min-h-screen gradient-mesh-auth animate-fade-in">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-8 px-6">
          <Card className="w-full border-border/50 bg-surface-elevated/80 p-8 backdrop-blur-xl text-center animate-zoom-in-95">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">Liên kết không hợp lệ</h2>
            <p className="text-sm text-muted-foreground mb-6">Liên kết này không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.</p>
            <Link to="/forgot-password">
              <Button variant="gradient">Yêu cầu liên kết mới</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen gradient-mesh-auth animate-fade-in">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-20">
        <section className="flex w-full flex-col gap-8 lg:w-5/12 animate-zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
              <Sparkles className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-foreground">Learning Hub</p>
              <p className="text-2xs text-muted-foreground">Không gian học tập AI</p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground text-balance lg:text-5xl">
              Thiết lập mật khẩu mới
            </h1>
            <p className="text-base text-muted-foreground max-w-md">
              Mật khẩu mới của bạn phải có ít nhất 8 ký tự.
            </p>
          </div>

          <Card className="border-border/50 bg-surface-elevated/80 p-6 backdrop-blur-xl sm:p-8">
            {success ? (
              <div className="flex flex-col items-center text-center py-6 animate-zoom-in-95">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
                  <ShieldCheck className="h-8 w-8 text-success" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-2">Đặt lại mật khẩu thành công!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng về trang đăng nhập...
                </p>
                <Link to="/login">
                  <Button variant="gradient">Đến trang đăng nhập</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5">
                <AuthInput
                  label="Mật khẩu mới"
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={password}
                  onChange={setPassword}
                  error={error}
                  prefixIcon={<Lock className="h-4 w-4" />}
                />

                <AuthInput
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={error ? ' ' : undefined}
                  prefixIcon={<Lock className="h-4 w-4" />}
                />

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="lg"
                  variant="gradient"
                  iconRight={!loading ? <ShieldCheck className="h-4 w-4" /> : undefined}
                >
                  {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <Link className="font-semibold text-primary transition hover:underline" to="/login">
                    Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </section>

        <aside className="hidden w-full animate-slide-in-from-right lg:block lg:w-6/12">
          <div className="space-y-6">
            <Card className="relative overflow-hidden p-8 border-border/50 bg-gradient-to-br from-primary/5 via-surface-elevated to-accent/5 text-center">
              <ShieldCheck className="mx-auto h-16 w-16 text-success/20 mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">Yêu cầu mật khẩu</h3>
              <ul className="text-sm text-muted-foreground text-left space-y-2 max-w-xs mx-auto">
                <li className="flex items-center gap-2"><span className="text-success">✓</span> Tối thiểu 8 ký tự</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> Sử dụng mật khẩu riêng biệt</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> Không dùng lại mật khẩu cũ</li>
              </ul>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}
