import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, GraduationCap, BookOpen, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react'
import { cn } from '../../utils/cn'

export type AuthRole = 'student' | 'lecturer'

interface AuthLayoutProps {
  role: AuthRole
  children: ReactNode
}

export function AuthLayout({ role, children }: AuthLayoutProps) {
  const isStudent = role === 'student'

  const roleMeta = isStudent
    ? {
        roleName: 'Học viên',
        roleTag: 'Student Workspace',
        icon: GraduationCap,
        badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        gradientBg: 'from-blue-600 via-indigo-600 to-slate-900',
        accentBorder: 'border-blue-500/30',
        glowRing: 'ring-blue-500/20',
        headline: 'Học tập thông minh cùng Trợ lý AI thế hệ mới.',
        subhead: 'Tối ưu hoá thời gian nghiên cứu, tạo flashcard tự động và nắm vững kiến thức chuyên sâu.',
        perks: [
          {
            title: 'Hỏi đáp đa tài liệu',
            desc: 'Tra cứu tức thì qua PDF, bài giảng video, audio và văn bản giáo trình.'
          },
          {
            title: 'Học chủ động & ghi nhớ sâu',
            desc: 'Tự động tạo bộ đề trắc nghiệm và flashcard tương tác từ bài học.'
          },
          {
            title: 'Chấm luận khách quan',
            desc: 'AI phân tích luận điểm, chỉ ra thiếu sót và đề xuất cách cải thiện.'
          }
        ],
        quote: {
          content: 'Đầu tư vào tri thức mang lại lợi nhuận cao nhất cho tương lai.',
          author: 'Benjamin Franklin'
        }
      }
    : {
        roleName: 'Giảng viên',
        roleTag: 'Faculty & Educator',
        icon: BookOpen,
        badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        gradientBg: 'from-purple-700 via-violet-800 to-slate-950',
        accentBorder: 'border-purple-500/30',
        glowRing: 'ring-purple-500/20',
        headline: 'Thiết kế bài giảng xuất sắc, dẫn dắt thế hệ tương lai.',
        subhead: 'Nền tảng trợ giảng AI giúp số hóa học liệu, tự động hóa chấm thi và thấu hiểu tiến độ học viên.',
        perks: [
          {
            title: 'Tự động hóa giáo trình',
            desc: 'Chuyển đổi tài liệu nghiên cứu thành bài học đa phương tiện chỉ trong vài phút.'
          },
          {
            title: 'Trợ lý chấm thi thông minh',
            desc: 'Rút ngắn 70% thời gian chấm bài tập và luận văn với nhận xét chuẩn học thuật.'
          },
          {
            title: 'Phân tích & Quản lý lớp học',
            desc: 'Theo dõi chi tiết sự tiến bộ và lỗ hổng kiến thức của từng học viên.'
          }
        ],
        quote: {
          content: 'Người thầy giỏi giải thích. Người thầy vĩ đại truyền cảm hứng.',
          author: 'William Arthur Ward'
        }
      }

  const RoleIcon = roleMeta.icon

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col lg:flex-row antialiased">
      {/* ─────────────────────────────────────────────────────────────
          LEFT EDITORIAL PANEL (Desktop 5/12, Sticky/Fixed feel)
          ───────────────────────────────────────────────────────────── */}
      <aside className="relative hidden lg:flex lg:w-5/12 xl:w-[45%] flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-border bg-surface-deep text-foreground">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-grid)" />
          </svg>
        </div>

        {/* Ambient Gradient Glow */}
        <div
          className={cn(
            'absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 dark:opacity-30',
            isStudent ? 'bg-blue-500' : 'bg-purple-600'
          )}
        />
        <div
          className={cn(
            'absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15 dark:opacity-25',
            isStudent ? 'bg-indigo-500' : 'bg-pink-600'
          )}
        />

        {/* Top Header: Brand */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/welcome"
            className="group flex items-center gap-3 transition-opacity hover:opacity-90"
            title="Quay về trang chủ"
          >
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-soft transition-transform duration-200 group-hover:scale-105',
                isStudent
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                  : 'bg-gradient-to-br from-purple-600 to-violet-700 shadow-purple-600/20'
              )}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold tracking-tight text-foreground">
                  Learning Hub
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  AI
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Không gian học tập đa phương thức</p>
            </div>
          </Link>

          <Link
            to="/welcome"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </Link>
        </div>

        {/* Center: Editorial Narrative & Value Props */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          {/* Role badge */}
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md shadow-sm transition-colors duration-200"
            style={{ borderColor: isStudent ? 'rgba(59,130,246,0.25)' : 'rgba(147,51,234,0.25)' }}>
            <RoleIcon className={cn('h-3.5 w-3.5', isStudent ? 'text-blue-500' : 'text-purple-500')} />
            <span className={isStudent ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}>
              {roleMeta.roleTag}
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-2xl xl:text-3xl font-bold tracking-tight text-foreground leading-snug">
              {roleMeta.headline}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {roleMeta.subhead}
            </p>
          </div>

          {/* Value props list */}
          <div className="space-y-3.5 pt-2">
            {roleMeta.perks.map((perk, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl p-3 border border-border/60 bg-surface-elevated/40 backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-surface-elevated/80"
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    isStudent
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">{perk.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Quote & Trust signal */}
        <div className="relative z-10 pt-6 border-t border-border/60 space-y-4">
          <blockquote className="text-xs italic text-foreground/80 leading-relaxed">
            &ldquo;{roleMeta.quote.content}&rdquo;
          </blockquote>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">— {roleMeta.quote.author}</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Bảo mật 256-bit SSL
            </span>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT CONTENT PANEL (Mobile & Desktop Form Host)
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-12 overflow-y-auto">
        {/* Mobile Header (Hidden on lg+) */}
        <div className="lg:hidden flex items-center justify-between pb-6 mb-2 border-b border-border/60">
          <Link to="/welcome" className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-soft',
                isStudent ? 'bg-blue-600' : 'bg-purple-600'
              )}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground font-display leading-none">Learning Hub</p>
              <p className="text-xs text-muted-foreground mt-0.5">AI Learning Platform</p>
            </div>
          </Link>

          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
              roleMeta.badgeBg
            )}
          >
            <RoleIcon className="h-3 w-3" />
            <span>{roleMeta.roleName}</span>
          </div>
        </div>

        {/* Centered Form Wrapper */}
        <div className="w-full max-w-[460px] mx-auto my-auto py-6 sm:py-10">
          {children}
        </div>

        {/* Global Footer Notes */}
        <footer className="w-full max-w-[460px] mx-auto pt-6 text-center text-xs text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs">
            <Link to="/welcome" className="hover:text-foreground transition-colors">
              Giới thiệu
            </Link>
            <span>•</span>
            <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Điều khoản sử dụng được cập nhật cho phiên bản 2026.') }} className="hover:text-foreground transition-colors">
              Điều khoản
            </a>
            <span>•</span>
            <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Chính sách bảo mật: Dữ liệu cá nhân được mã hóa và không chia sẻ cho bên thứ ba.') }} className="hover:text-foreground transition-colors">
              Bảo mật
            </a>
            <span>•</span>
            <a href="mailto:support@learninghubs.tech" className="hover:text-foreground transition-colors">
              Hỗ trợ
            </a>
          </div>
          <p className="text-xs text-muted-foreground/80">
            © 2026 Learning Hub. Đột phá không gian học tập cùng AI.
          </p>
        </footer>
      </main>
    </div>
  )
}
