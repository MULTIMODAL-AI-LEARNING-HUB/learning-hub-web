/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Textarea'
import { coursesApi, type Course } from '../../services/api'
import { useAppStore } from '../../stores/appStore'

interface EditCourseDetailsModalProps {
  course: Course
  open: boolean
  onClose: () => void
  onSaved: (course: Course) => void
}

export function EditCourseDetailsModal({ course, open, onClose, onSaved }: EditCourseDetailsModalProps) {
  const toasts = useAppStore((state) => state.toasts)
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description)
  const [price, setPrice] = useState(String(course.price ?? 0))
  const [level, setLevel] = useState(course.level || '')
  const [language, setLanguage] = useState(course.language || '')
  const [requirements, setRequirements] = useState(course.requirements || '')
  const [learningOutcomes, setLearningOutcomes] = useState(course.learning_outcomes || '')
  const [tags, setTags] = useState(course.tags || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(course.title)
    setDescription(course.description)
    setPrice(String(course.price ?? 0))
    setLevel(course.level || '')
    setLanguage(course.language || '')
    setRequirements(course.requirements || '')
    setLearningOutcomes(course.learning_outcomes || '')
    setTags(course.tags || '')
  }, [course, open])

  const save = async () => {
    if (!title.trim()) {
      toasts.add({ type: 'error', title: 'Title is required' })
      return
    }

    const parsedPrice = Number(price)
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toasts.add({ type: 'error', title: 'Invalid price' })
      return
    }

    setSaving(true)
    try {
      const res = await coursesApi.update(course.id, {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        level: level.trim(),
        language: language.trim(),
        requirements: requirements.trim() || null,
        learning_outcomes: learningOutcomes.trim() || null,
        tags: tags.trim() || null,
      })
      onSaved(res.data)
      toasts.add({ type: 'success', title: 'Course details updated' })
      onClose()
    } catch {
      toasts.add({ type: 'error', title: 'Unable to update course' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit course details"
      description="Update the course information students see before and after enrolling."
      size="3xl"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>Save changes</Button>
        </>
      )}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input value={title} onChange={setTitle} className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Price</label>
            <Input type="number" value={price} onChange={setPrice} className="mt-2" min={0} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Level</label>
            <Input value={level} onChange={setLevel} className="mt-2" placeholder="Beginner, intermediate..." />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Language</label>
            <Input value={language} onChange={setLanguage} className="mt-2" placeholder="English" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Tags</label>
            <Input value={tags} onChange={setTags} className="mt-2" placeholder="Comma-separated tags" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Description</label>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-28" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Requirements</label>
          <Textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Learning outcomes</label>
          <Textarea value={learningOutcomes} onChange={(event) => setLearningOutcomes(event.target.value)} className="mt-2" />
        </div>
      </div>
    </Modal>
  )
}
