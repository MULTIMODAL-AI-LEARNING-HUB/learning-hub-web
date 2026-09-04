import { useState, useEffect, useCallback } from 'react'
/* eslint-disable react-hooks/set-state-in-effect */
import { Link } from 'react-router-dom'
import {
  Compass,
  Search,
  BookOpen,
  ArrowRight,
  Filter,
} from 'lucide-react'
import { coursesApi, categoriesApi, type Course, type Category } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../utils/cn'

export function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const loadCourses = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = {
        status: 'published',
        page_size: 50,
      }
      if (selectedCategory) params.category_id = selectedCategory
      if (search) params.search = search
      const res = await coursesApi.list(params)
      setCourses(res.data.items)
    } catch (err) {
      console.error('Failed to load courses:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, search])

  const loadCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.list()
      setCategories(res.data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadCourses()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  return (
    <div className="space-y-8 animate-fade-in font-body pb-12">
      {/* 1. Header & Search Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-surface-elevated via-primary/5 to-surface p-6 md:p-8 shadow-soft">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Compass className="h-3.5 w-3.5" />
            <span>Khám phá tri thức</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Kho tàng khóa học chất lượng cao
          </h1>

          <p className="text-sm md:text-base text-muted-foreground">
            Tìm kiếm và ghi danh vào các khóa học chuyên sâu từ các giảng viên hàng đầu, tích hợp trợ lý học tập AI thông minh.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="pt-2">
            <div className="relative flex items-center max-w-xl">
              <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên khóa học, giảng viên, chủ đề..."
                className="w-full h-11 pl-10 pr-24 rounded-2xl border border-border bg-background text-sm placeholder:text-muted-foreground/70 focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 shadow-xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 hover:bg-primary/90 transition-all"
              >
                <span>Tìm kiếm</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Danh mục</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-4 py-2 rounded-xl whitespace-nowrap text-xs font-semibold transition-all duration-200',
              !selectedCategory
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
            )}
          >
            Tất cả khóa học
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-xl whitespace-nowrap text-xs font-semibold transition-all duration-200 flex items-center gap-1.5',
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
              )}
            >
              {cat.icon && <span>{cat.icon}</span>}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/70 bg-surface-elevated overflow-hidden p-4 space-y-3">
              <Skeleton className="h-44 w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
                <div className="pt-2 flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border/80 bg-surface-elevated/40 p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Không tìm thấy khóa học nào</h3>
            <p className="text-xs text-muted-foreground">
              Thử tìm kiếm với từ khóa khác hoặc bấm chọn danh mục &quot;Tất cả khóa học&quot;.
            </p>
          </div>
          {(selectedCategory || search) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory(null)
                setSearch('')
              }}
              className="rounded-xl"
            >
              Xóa bộ lọc tìm kiếm
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/app/student/courses/${course.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-border/70 bg-surface-elevated overflow-hidden hover:border-primary/40 hover:shadow-soft hover:-translate-y-1 transition-all duration-200"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-cyan-500/10 overflow-hidden">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="h-10 w-10 text-primary/40" />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {course.category && (
                      <span className="px-2 py-0.5 rounded-md bg-background/90 backdrop-blur-xs text-3xs font-bold text-foreground border border-border/40 shadow-2xs">
                        {course.category.name}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-3xs font-bold shadow-2xs backdrop-blur-xs',
                        course.price === 0
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-primary/90 text-white'
                      )}
                    >
                      {course.price === 0 ? 'Miễn phí' : `${formatPrice(course.price)}đ`}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {course.title}
                  </h3>

                  {course.description && (
                    <p className="text-2xs text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-2xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="h-5 w-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-3xs font-bold">
                      {course.lecturer?.full_name?.[0] || 'G'}
                    </div>
                    <span className="truncate">{course.lecturer?.full_name || 'Giảng viên'}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Xem</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}