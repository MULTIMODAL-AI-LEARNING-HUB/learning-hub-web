import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { coursesApi, enrollmentsApi, type Course, type Enrollment, type MaterialProgress } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Progress } from '../../components/ui/Progress'
import { useAppStore } from '../../stores/appStore'

export function CourseLearning() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [progress, setProgress] = useState<Map<string, MaterialProgress>>(new Map())
  const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { auth } = useAppStore()

  const loadData = async () => {
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
        setEnrollment(prev => prev ? { ...prev, progress_percent: progressRes.data.progress_percent } : null)
        const materialIds = progressRes.data.completed_materials || []
        const progressMap = new Map<string, MaterialProgress>()
        materialIds.forEach(mid => {
          progressMap.set(mid, { id: mid, enrollment_id: userEnrollment.id, material_id: mid, completed: true, progress_percent: 100 } as MaterialProgress)
        })
        setProgress(progressMap)
      }
    } catch (err) {
      console.error('Failed to load course:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useEffect(() => {
    const materialId = searchParams.get('material')
    if (materialId && course?.materials) {
      setCurrentMaterialId(materialId)
    } else if (course?.materials?.length && !currentMaterialId) {
      setCurrentMaterialId(course.materials[0].id)
    }
  }, [course, searchParams])

  const updateProgress = useCallback(async (materialId: string, data: {
    completed?: boolean
    progress_percent?: number
    last_position_seconds?: number
    last_position_percent?: number
  }) => {
    if (!enrollment) return
    setUpdating(true)
    try {
      await enrollmentsApi.updateProgress(enrollment.id, materialId, data)
      const progressRes = await enrollmentsApi.getProgress(enrollment.id)
      setEnrollment(prev => prev ? { ...prev, progress_percent: progressRes.data.progress_percent } : prev)
      if (data.completed) {
        setProgress(prev => {
          const newMap = new Map(prev)
          newMap.set(materialId, {
            id: materialId,
            enrollment_id: enrollment.id,
            material_id: materialId,
            completed: true,
            progress_percent: 100,
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
    await updateProgress(currentMaterialId, { completed: true, progress_percent: 100 })
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
    <div className="flex gap-6 h-full">
      <div className="w-72 border-r pr-4 flex-shrink-0">
        <div className="mb-4">
          <Link to={`/app/courses/${id}`} className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mb-2">
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
          <p className="text-xs text-gray-500 mt-1">
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
                onClick={() => goToMaterial(material.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                    isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium line-clamp-2 ${isCompleted ? 'text-green-600' : ''}`}>
                      {material.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getMaterialIcon(material.material_type)} {material.material_type.toUpperCase()}
                      {material.is_preview && ' • Xem trước'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentMaterial ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{currentMaterial.title}</h2>
              <div className="flex items-center gap-2">
                {progress.get(currentMaterial.id)?.completed ? (
                  <Badge variant="success">Đã hoàn thành</Badge>
                ) : (
                  <Button onClick={markComplete} disabled={updating}>
                    {updating ? 'Đang lưu...' : 'Đánh dấu hoàn thành'}
                  </Button>
                )}
              </div>
            </div>

            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {currentMaterial.material_type === 'video' && currentMaterial.file_url ? (
                <video
                  src={currentMaterial.file_url}
                  controls
                  className="w-full h-full"
                  onEnded={() => markComplete()}
                />
              ) : currentMaterial.material_type === 'image' && currentMaterial.file_url ? (
                <img src={currentMaterial.file_url} alt={currentMaterial.title} className="max-w-full max-h-full object-contain" />
              ) : currentMaterial.material_type === 'url' && currentMaterial.external_url ? (
                <iframe
                  src={currentMaterial.external_url}
                  className="w-full h-full"
                  title={currentMaterial.title}
                />
              ) : currentMaterial.file_url ? (
                <iframe
                  src={currentMaterial.file_url}
                  className="w-full h-full"
                  title={currentMaterial.title}
                />
              ) : (
                <div className="text-center p-8">
                  <span className="text-4xl mb-4 block">{getMaterialIcon(currentMaterial.material_type)}</span>
                  <p>Không thể xem trước tài liệu này</p>
                  {currentMaterial.external_url && (
                    <a
                      href={currentMaterial.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline mt-2 block"
                    >
                      Mở trong tab mới
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {currentMaterialId !== course.materials?.[0]?.id && (
                <Button
                  variant="outline"
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

            <Card className="p-4 mt-6">
              <h3 className="font-semibold mb-2">Chat với AI về bài học này</h3>
              <p className="text-sm text-gray-600 mb-3">
                Hỏi đáp, tóm tắt, hoặc tạo quiz từ nội dung bài học
              </p>
              <div className="flex gap-2">
                <Button as={Link} to={`/app/chat?course_id=${id}&material_id=${currentMaterialId}`}>
                  Mở Chat AI
                </Button>
                <Button as={Link} to={`/app/courses/${id}/quiz`} variant="outline">
                  Làm Quiz
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Chọn một bài học để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  )
}