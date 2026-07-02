import { useState, useEffect, useCallback } from 'react'
/* eslint-disable react-hooks/set-state-in-effect */
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { coursesApi, enrollmentsApi, type Course, type Enrollment, type MaterialProgress } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Progress } from '../../components/ui/Progress'
import { cn } from '../../utils/cn'

export function CourseLearning() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [progress, setProgress] = useState<Map<string, MaterialProgress>>(new Map())
  const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [courseRes, enrollRes] = await Promise.all([
        coursesApi.get(id),
        enrollmentsApi.list({ status: 'active' }).catch(() => ({ data: { items: [] } }))
      ])
      setCourse(courseRes.data)
      const userEnrollment = enrollRes.data.items.find((e: Enrollment) => e.course_id === id)
      if (userEnrollment) {
        setEnrollment(userEnrollment)
        const progressRes = await enrollmentsApi.getProgress(userEnrollment.id)
        setEnrollment(prev => prev ? { ...prev, progress_percent: progressRes.data.completion_percent } : null)
        const progressMap = new Map<string, MaterialProgress>()
        progressRes.data.materials.forEach(mp => {
          progressMap.set(mp.material_id, { ...mp } as MaterialProgress)
        })
        setProgress(progressMap)
      }
    } catch (err) {
      console.error('Failed to load course:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const materialIdFromParams = searchParams.get('material')
    if (materialIdFromParams && course?.materials) {
      setCurrentMaterialId(materialIdFromParams)
    } else if (course?.materials?.length && !currentMaterialId) {
      setCurrentMaterialId(course.materials[0].id)
    }
  }, [course, searchParams, currentMaterialId])

  const updateProgress = useCallback(async (materialId: string, data: {
    completed?: boolean
    completion_percent?: number
    last_position?: Record<string, unknown>
  }) => {
    if (!enrollment) return
    setUpdating(true)
    try {
      await enrollmentsApi.updateProgress(enrollment.id, materialId, { completion_percent: data.completion_percent, last_position: data.last_position })
      const progressRes = await enrollmentsApi.getProgress(enrollment.id)
      setEnrollment(prev => prev ? { ...prev, progress_percent: progressRes.data.completion_percent } : prev)
      if (data.completed) {
        setProgress(prev => {
          const newMap = new Map(prev)
          newMap.set(materialId, {
            id: materialId,
            enrollment_id: enrollment.id,
            material_id: materialId,
            completed: true,
            completion_percent: 100,
            last_position: null,
            completed_at: new Date().toISOString()
          } as MaterialProgress)
          return newMap
        })
      }
    } catch (err) {
      console.error('Failed to update progress:', err)
    } finally {
      setUpdating(false)
    }
  }, [enrollment])

  const currentMaterial = course?.materials?.find(m => m.id === currentMaterialId)

  const markComplete = async () => {
    if (!currentMaterialId) return
    await updateProgress(currentMaterialId, { completed: true, completion_percent: 100 })
  }

  const goToMaterial = (materialId: string) => {
    setCurrentMaterialId(materialId)
    setSearchParams({ material: materialId })
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄'
      case 'docx': return '📝'
      case 'video': return '🎬'
      case 'image': return '🖼️'
      case 'url': return '🔗'
      default: return '📎'
    }
  }

  const completedCount = progress.size
  const totalCount = course?.materials?.length || 0

  if (loading) {
    return (
      <div className="flex gap-6 h-full">
        <div className="w-64 border-r pr-4">
          <Skeleton className="h-full" />
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!course || !enrollment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Bạn chưa đăng ký khóa học này</h2>
        <Link to={`/app/courses/${id}`} className="text-indigo-600 hover:underline mt-2 block">
          Quay lại trang khóa học
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Mobile sidebar toggle */}
      <div className="flex items-center gap-2 lg:hidden mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle lessons"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <Link to={`/app/courses/${id}`} className="text-sm text-primary hover:underline">
          ← Quay lại
        </Link>
      </div>

      {/* Sidebar - desktop fixed, mobile drawer */}
      <div className={cn(
        'w-full lg:w-72 lg:border-r lg:pr-4 lg:flex-shrink-0',
        'lg:block',
        sidebarOpen ? 'block' : 'hidden lg:block'
      )}>
        <div className="mb-4">
          <Link to={`/app/courses/${id}`} className="text-sm text-primary hover:underline hidden lg:flex items-center gap-1 mb-2">
            ← Quay lại khóa học
          </Link>
          <h2 className="font-semibold line-clamp-2">{course.title}</h2>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Tiến độ</span>
              <span>{enrollment.progress_percent || 0}%</span>
            </div>
            <Progress value={enrollment.progress_percent || 0} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {completedCount}/{totalCount} bài đã hoàn thành
          </p>
        </div>
        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {course.materials?.map((material, index) => {
            const isCompleted = progress.get(material.id)?.completed
            const isActive = material.id === currentMaterialId
            return (
              <button
                key={material.id}
                onClick={() => { goToMaterial(material.id); setSidebarOpen(false) }}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors text-foreground',
                  isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5',
                    isCompleted ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  )}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium line-clamp-2', isCompleted && 'text-success')}>
                      {material.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getMaterialIcon(material.material_type)} {material.material_type.toUpperCase()}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {currentMaterial ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-semibold">{currentMaterial.title}</h2>
              <div className="flex items-center gap-2">
                {progress.get(currentMaterial.id)?.completed ? (
                  <Badge variant="success" label="Đã hoàn thành" />
                ) : (
                  <Button onClick={markComplete} disabled={updating} size="sm">
                    {updating ? 'Đang lưu...' : 'Đánh dấu hoàn thành'}
                  </Button>
                )}
              </div>
            </div>

            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {currentMaterial.material_type === 'video' && currentMaterial.file_url ? (
                <video
                  src={currentMaterial.file_url}
                  controls
                  className="w-full h-full"
                  onEnded={() => markComplete()}
                />
              ) : currentMaterial.material_type === 'image' && currentMaterial.file_url ? (
                <img src={currentMaterial.file_url} alt={currentMaterial.title ?? undefined} className="max-w-full max-h-full object-contain" />
              ) : currentMaterial.material_type === 'url' && currentMaterial.external_url ? (
                <iframe
                  src={currentMaterial.external_url}
                  className="w-full h-full"
                  title={currentMaterial.title ?? undefined}
                />
              ) : currentMaterial.file_url ? (
                <iframe
                  src={currentMaterial.file_url}
                  className="w-full h-full"
                  title={currentMaterial.title ?? undefined}
                />
              ) : (
                <div className="text-center p-8">
                  <span className="text-4xl mb-4 block">{getMaterialIcon(currentMaterial.material_type)}</span>
                  <p className="text-muted-foreground">Không thể xem trước tài liệu này</p>
                  {currentMaterial.external_url && (
                    <a
                      href={currentMaterial.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mt-2 block"
                    >
                      Mở trong tab mới
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {currentMaterialId !== course.materials?.[0]?.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const idx = course.materials?.findIndex(m => m.id === currentMaterialId) ?? -1
                    if (idx > 0 && course.materials) {
                      goToMaterial(course.materials[idx - 1].id)
                    }
                  }}
                >
                  ← Bài trước
                </Button>
              )}
              {currentMaterialId !== course.materials?.[course.materials?.length - 1]?.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const idx = course.materials?.findIndex(m => m.id === currentMaterialId) ?? -1
                    if (course.materials && idx < course.materials.length - 1) {
                      goToMaterial(course.materials[idx + 1].id)
                    }
                  }}
                >
                  Bài tiếp →
                </Button>
              )}
            </div>

            <Card padding="responsive" className="mt-6">
              <h3 className="font-semibold mb-2">Chat với AI về bài học này</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Hỏi đáp, tóm tắt, hoặc tạo quiz từ nội dung bài học
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to={`/app/chat?course_id=${id}&material_id=${currentMaterialId}`}>
                  <Button size="sm">Mở Chat AI</Button>
                </Link>
                <Link to={`/app/courses/${id}/quiz`}>
                  <Button variant="outline" size="sm">Làm Quiz</Button>
                </Link>
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chọn một bài học để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  )
}