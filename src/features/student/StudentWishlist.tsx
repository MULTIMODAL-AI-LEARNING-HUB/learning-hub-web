import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Trash2, BookOpen, ArrowRight, Compass } from 'lucide-react'
import { wishlistApi, type WishlistItem } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../utils/cn'

export function StudentWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    wishlistApi
      .list()
      .then((res) => {
        if (!cancelled) setItems(res.data)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const removeItem = async (courseId: string) => {
    try {
      await wishlistApi.remove(courseId)
      setItems((prev) => prev.filter((i) => i.course_id !== courseId))
    } catch {
      // ignore
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return ''
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in font-body">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/70 bg-surface-elevated p-4 space-y-3">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in font-body pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20 shadow-xs">
            <Heart className="h-5 w-5 fill-rose-500/20 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                Khóa học đã lưu
              </h1>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                {items.length} khóa
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Danh sách khóa học bạn quan tâm để dành học trong tương lai
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/student/browse')}
            iconRight={<Compass className="h-4 w-4" />}
            className="rounded-xl border-border/70 text-xs"
          >
            Khám phá thêm
          </Button>
        )}
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border/80 bg-surface-elevated/40 p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <Heart className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Danh sách yêu thích đang trống</h3>
            <p className="text-xs text-muted-foreground">
              Hãy lưu lại những khóa học bạn ấn tượng để dễ dàng tìm lại và đăng ký học bất cứ lúc nào.
            </p>
          </div>
          <Button
            onClick={() => navigate('/app/student/browse')}
            iconRight={<Compass className="h-4 w-4" />}
            className="rounded-xl px-5"
          >
            Khám phá khóa học ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-surface-elevated overflow-hidden hover:border-primary/40 hover:shadow-soft hover:-translate-y-1 transition-all duration-200"
            >
              <div>
                {/* Thumbnail */}
                <Link to={`/app/student/courses/${item.course_id}`}>
                  <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-cyan-500/10 overflow-hidden">
                    {item.course_thumbnail ? (
                      <img
                        src={item.course_thumbnail}
                        alt={item.course_title || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <BookOpen className="h-10 w-10 text-primary/40" />
                      </div>
                    )}

                    <div className="absolute bottom-2.5 left-2.5">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md text-3xs font-bold shadow-2xs backdrop-blur-xs',
                          item.course_price === 0
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-primary/90 text-white'
                        )}
                      >
                        {item.course_price === 0 ? 'Miễn phí' : `${formatPrice(item.course_price)}đ`}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4 space-y-1.5">
                  <Link
                    to={`/app/student/courses/${item.course_id}`}
                    className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug block"
                  >
                    {item.course_title || 'Khóa học'}
                  </Link>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <Link
                    to={`/app/student/courses/${item.course_id}`}
                    className="inline-flex items-center gap-1 text-2xs font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    <span>Xem khóa học</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>

                  <button
                    onClick={() => removeItem(item.course_id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Xóa khỏi danh sách lưu"
                    aria-label="Xóa khỏi danh sách lưu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
