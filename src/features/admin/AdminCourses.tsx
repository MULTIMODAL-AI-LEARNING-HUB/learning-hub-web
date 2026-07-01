import { useEffect, useState, useCallback } from 'react'
import { Search, RefreshCw, ChevronLeft, ChevronRight, Trash2, BookOpen } from 'lucide-react'
import { adminApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/useToast'

interface AdminCourse {
  id: string
  lecturer_id: string
  category_id: string | null
  title: string
  description: string | null
  thumbnail_url: string | null
  price_vnd: number
  status: string
  level: string
  language: string
  created_at: string | null
  updated_at: string | null
  lecturer_name: string | null
  category_name: string | null
  enrollment_count: number
}

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'default' | 'primary' | 'info'> = {
  published: 'success',
  draft: 'warning',
  archived: 'default',
  rejected: 'info',
}

export function AdminCourses() {
  const toast = useToast()
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [page, setPage] = useState(1)
  const [totalCourses, setTotalCourses] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const pageSize = 15

  const [deletingCourse, setDeletingCourse] = useState<AdminCourse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCourses = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await adminApi.listAllCourses({
        page: p,
        page_size: pageSize,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      })
      setCourses(res.data.items)
      setTotalCourses(res.data.total)
    } catch {
      toast({ type: 'error', title: 'Failed to load courses' })
    } finally {
      setLoading(false)
    }
  }, [toast, searchQuery, statusFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourses(page)
  }, [page, fetchCourses])

  const totalPages = Math.max(1, Math.ceil(totalCourses / pageSize))

  const handleDelete = async () => {
    if (!deletingCourse) return
    setDeleting(true)
    try {
      await adminApi.deleteCourse(deletingCourse.id)
      toast({ type: 'success', title: 'Course deleted successfully' })
      setDeletingCourse(null)
      fetchCourses(page)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      toast({ type: 'error', title: err?.response?.data?.detail || 'Failed to delete course' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-fluid-2xl font-bold text-foreground">Course Management</h1>
        <p className="text-muted-foreground text-sm">Overview of all courses on the platform. Delete any course as needed.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={setSearchQuery}
            prefixIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => fetchCourses(page)} loading={loading}>Refresh</Button>
        </div>
      </div>

      {/* Courses table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-5">Course</th>
                <th className="py-2.5 px-5">Lecturer</th>
                <th className="py-2.5 px-5">Category</th>
                <th className="py-2.5 px-5">Status</th>
                <th className="py-2.5 px-5">Price</th>
                <th className="py-2.5 px-5">Students</th>
                <th className="py-2.5 px-5">Created</th>
                <th className="py-2.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-3 px-5"><Skeleton width={j === 0 ? 160 : 60} height={12} /></td>
                    ))}
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">No courses found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                    <td className="py-3 px-5">
                      <p className="font-medium text-foreground truncate max-w-[200px]">{c.title}</p>
                    </td>
                    <td className="py-3 px-5 text-muted-foreground text-xs">{c.lecturer_name || '—'}</td>
                    <td className="py-3 px-5 text-muted-foreground text-xs">{c.category_name || '—'}</td>
                    <td className="py-3 px-5">
                      <Badge variant={STATUS_COLORS[c.status] || 'default'} label={c.status} />
                    </td>
                    <td className="py-3 px-5 text-sm tabular-nums">
                      {c.price_vnd === 0 ? <span className="text-success">Free</span> : `${c.price_vnd.toLocaleString()} VND`}
                    </td>
                    <td className="py-3 px-5 text-sm tabular-nums text-center">{c.enrollment_count}</td>
                    <td className="py-3 px-5 text-xs text-muted-foreground tabular-nums">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => setDeletingCourse(c)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">{totalCourses} courses total</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<ChevronLeft className="h-3.5 w-3.5" />} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>Prev</Button>
            <Button variant="outline" size="sm" iconRight={<ChevronRight className="h-3.5 w-3.5" />} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>Next</Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirm */}
      <Modal open={!!deletingCourse} onClose={() => setDeletingCourse(null)} title="Delete Course" size="sm">
        {deletingCourse && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{deletingCourse.title}"</span>? All enrollments and content will also be removed.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setDeletingCourse(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} icon={<Trash2 className="h-4 w-4" />}>Delete Course</Button>
        </div>
      </Modal>
    </div>
  )
}