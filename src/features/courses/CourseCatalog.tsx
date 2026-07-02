import { useState, useEffect, useCallback } from 'react'
/* eslint-disable react-hooks/set-state-in-effect */
import { Link } from 'react-router-dom'
import { coursesApi, categoriesApi, type Course, type Category } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Input } from '../../components/ui/Input'

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

  const handleSearch = () => {
    loadCourses()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  const CourseCard = ({ course }: { course: Course }) => (
    <Link to={`/app/student/courses/${course.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 rounded-t-lg flex items-center justify-center">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover rounded-t-lg" />
          ) : (
            <span className="text-4xl">📚</span>
          )}
        </div>
        <div className="p-4">
<div className="flex items-center gap-2 mb-2">
              {course.category && (
                <Badge variant="primary" label={course.category.name} />
              )}
              {course.price === 0 && (
                <Badge variant="success" label="Miễn phí" />
              )}
            </div>
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">{course.title}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium">
                {course.lecturer?.full_name?.[0] || 'L'}
              </div>
              <span className="text-sm text-gray-600">{course.lecturer?.full_name || 'Giảng viên'}</span>
            </div>
            <span className="text-sm font-medium text-indigo-600">
              {course.price === 0 ? 'Miễn phí' : `${formatPrice(course.price)}đ`}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {course.enrollment_count} học viên • {course.materials?.length || 0} bài học
          </div>
        </div>
      </Card>
    </Link>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-fluid-2xl font-bold text-foreground">Khóa học</h1>
          <p className="text-gray-600">Khám phá các khóa học chất lượng từ giảng viên</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Tìm kiếm khóa học..."
            value={search}
            onChange={(value) => setSearch(value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full md:w-64"
          />
          <Button onClick={handleSearch}>Tìm kiếm</Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
            !selectedCategory
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {cat.icon && <span className="mr-1">{cat.icon}</span>}
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📚</span>
          <h3 className="text-lg font-medium mb-2">Không tìm thấy khóa học</h3>
          <p className="text-gray-600">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}