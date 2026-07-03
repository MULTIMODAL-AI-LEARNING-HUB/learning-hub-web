import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Users, Star, Edit, Eye, BarChart3, Archive, ArchiveRestore, Send } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { useLecturerCourses } from '../../hooks/useLecturerCourses'
import { categoriesApi } from '../../services/api'
import type { Course, Category } from '../../services/api'
import { CourseContentManager } from './CourseContentManager'

export function LecturerCourses() {
  const navigate = useNavigate()
  const { courses, loading, error, stats, fetchCourses, fetchStats, createCourse, updateCourse, publishCourse, archiveCourse, unarchiveCourse } = useLecturerCourses()
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'content'>('list')
  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: 0, category_id: '' })
  const [editCourse, setEditCourse] = useState({ title: '', description: '', price: 0, category_id: '', level: '', language: '', requirements: '', learning_outcomes: '', tags: '' })

  useEffect(() => {
    fetchCourses()
    fetchStats()
    categoriesApi.list().then(res => setCategories(res.data))
  }, [fetchCourses, fetchStats])

  const handleCreate = async () => {
    const created = await createCourse(newCourse)
    setShowCreateModal(false)
    setNewCourse({ title: '', description: '', price: 0, category_id: '' })
    navigate(`/app/lecturer/courses/${created.id}`)
  }

  const handleEdit = async () => {
    if (!selectedCourse) return
    await updateCourse(selectedCourse.id, editCourse)
    setShowEditModal(false)
    setSelectedCourse(null)
    fetchCourses()
  }

  const openEditModal = (course: Course) => {
    setSelectedCourse(course)
    setEditCourse({
      title: course.title,
      description: course.description,
      price: course.price,
      category_id: course.category_id,
      level: course.level || '',
      language: course.language || '',
      requirements: course.requirements || '',
      learning_outcomes: course.learning_outcomes || '',
      tags: course.tags || '',
    })
    setShowEditModal(true)
  }

  const handlePublish = async (courseId: string) => {
    await publishCourse(courseId)
    fetchCourses()
  }

  const handleArchive = async (courseId: string) => {
    await archiveCourse(courseId)
    fetchCourses()
  }

  const handleUnarchive = async (courseId: string) => {
    await unarchiveCourse(courseId)
    fetchCourses()
  }


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge variant="success" label="Published" />
      case 'draft': return <Badge variant="warning" label="Draft" />
      case 'archived': return <Badge variant="default" label="Archived" />
      default: return <Badge variant="default" label={status} />
    }
  }

  const viewCourseContent = (course: Course) => {
    setSelectedCourse(course)
    setViewMode('content')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {viewMode === 'content' && selectedCourse ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button onClick={() => setViewMode('list')} className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1">
                ← Back to Courses
              </button>
              <h1 className="text-2xl font-bold text-foreground">{selectedCourse.title}</h1>
              <div className="mt-1">{getStatusBadge(selectedCourse.status)}</div>
            </div>
            <Button variant="outline" onClick={() => openEditModal(selectedCourse)} icon={<Edit className="h-4 w-4" />} fullWidthMobile>
              Edit Details
            </Button>
          </div>
          <CourseContentManager course={selectedCourse} />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-fluid-2xl font-bold text-foreground">My Courses</h1>
              <p className="text-muted-foreground">Manage your courses and content</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="h-4 w-4" />} variant="gradient">
              Create Course
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card padding="responsive">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Courses</span>
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold mt-2 text-foreground tabular-nums">{stats.total_courses}</p>
              </Card>
              <Card padding="responsive">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Students</span>
                  <Users className="h-4 w-4 text-accent" />
                </div>
                <p className="text-2xl font-bold mt-2 text-foreground tabular-nums">{stats.total_students}</p>
              </Card>
              <Card padding="responsive">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Rating</span>
                  <Star className="h-4 w-4 text-warning" />
                </div>
                <p className="text-2xl font-bold mt-2 text-foreground tabular-nums">{stats.avg_rating.toFixed(1)}</p>
              </Card>
              <Card padding="responsive">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</span>
                  <BarChart3 className="h-4 w-4 text-success" />
                </div>
                <p className="text-2xl font-bold mt-2 text-foreground tabular-nums">${stats.total_revenue.toLocaleString()}</p>
              </Card>
            </div>
          )}

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Course</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Students</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Rating</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-muted/30 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt="" className="h-10 w-14 object-cover rounded" />
                          ) : (
                            <div className="h-10 w-14 bg-muted rounded flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{course.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{course.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(course.status)}</td>
                      <td className="px-4 py-3 text-sm">${course.price}</td>
                      <td className="px-4 py-3 text-sm">{course.enrollment_count || 0}</td>
                      <td className="px-4 py-3">
                        {course.rating_avg ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-warning fill-warning" />
                            <span className="text-sm">{course.rating_avg.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({course.rating_count})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No ratings</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />} onClick={() => viewCourseContent(course)} title="Manage Content" />
                          <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => openEditModal(course)} title="Edit" />
                          {course.status === 'draft' && (
                            <Button variant="ghost" size="sm" icon={<Send className="h-4 w-4" />} onClick={() => handlePublish(course.id)} title="Publish" />
                          )}
                          {course.status === 'published' && (
                            <Button variant="ghost" size="sm" icon={<Archive className="h-4 w-4" />} onClick={() => handleArchive(course.id)} title="Archive" />
                          )}
                          {course.status === 'archived' && (
                            <Button variant="ghost" size="sm" icon={<ArchiveRestore className="h-4 w-4" />} onClick={() => handleUnarchive(course.id)} title="Restore" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {courses.length === 0 && !loading && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">Create your first course to get started</p>
                <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="h-4 w-4" />}>
                  Create Course
                </Button>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Course">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Course Title</label>
            <Input value={newCourse.title} onChange={(v) => setNewCourse({ ...newCourse, title: v })} className="mt-1" placeholder="Enter course title" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} className="mt-1" rows={3} placeholder="Describe what students will learn" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={newCourse.category_id}
                onChange={(v) => setNewCourse({ ...newCourse, category_id: v })}
                options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                placeholder="Select category"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price ($)</label>
              <Input type="number" value={newCourse.price} onChange={(v) => setNewCourse({ ...newCourse, price: parseFloat(v) })} className="mt-1" min={0} step={0.01} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newCourse.title || !newCourse.category_id}>Create Course</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Course" size="xl">
        <div className="space-y-6 py-2">
          {/* Section 1: Basic Information */}
          <div className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Basic Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course Title</label>
                <Input value={editCourse.title} onChange={(v) => setEditCourse({ ...editCourse, title: v })} className="mt-1.5" placeholder="Enter course title" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                <Select
                  value={editCourse.category_id}
                  onChange={(v) => setEditCourse({ ...editCourse, category_id: v })}
                  options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price ($)</label>
                <Input type="number" value={editCourse.price} onChange={(v) => setEditCourse({ ...editCourse, price: parseFloat(v) })} className="mt-1.5" min={0} step={0.01} />
              </div>
            </div>
          </div>

          {/* Section 2: Metadata */}
          <div className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Classification & Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level</label>
                <Select
                  value={editCourse.level || ''}
                  onChange={(v) => setEditCourse({ ...editCourse, level: v })}
                  options={[
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                  ]}
                  placeholder="Select level"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Language</label>
                <Input value={editCourse.language} onChange={(v) => setEditCourse({ ...editCourse, language: v })} className="mt-1.5" placeholder="e.g., English, Vietnamese" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</label>
                <Input value={editCourse.tags} onChange={(v) => setEditCourse({ ...editCourse, tags: v })} className="mt-1.5" placeholder="Comma-separated tags (e.g. AI, Programming, English)" />
              </div>
            </div>
          </div>

          {/* Section 3: Rich Content */}
          <div className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Course Details & Syllabus</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                <Textarea value={editCourse.description} onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })} className="mt-1.5" rows={3} placeholder="Describe the course content..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Requirements</label>
                <Textarea value={editCourse.requirements} onChange={(e) => setEditCourse({ ...editCourse, requirements: e.target.value })} className="mt-1.5" rows={2} placeholder="What students need before taking this course..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Learning Outcomes</label>
                <Textarea value={editCourse.learning_outcomes} onChange={(e) => setEditCourse({ ...editCourse, learning_outcomes: e.target.value })} className="mt-1.5" rows={3} placeholder="What students will be able to do after completing..." />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/60 sticky bottom-0 bg-surface-elevated py-2 -mx-6 px-6 z-10">
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleEdit} variant="gradient">Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}