import type { CourseMaterial, Lesson } from '../../../services/api'

export type LearningItem =
  | { kind: 'lesson'; id: string; sectionId: string; title: string; description: string | null; lesson: Lesson }
  | { kind: 'material'; id: string; sectionId: 'materials'; title: string; description: string | null; material: CourseMaterial }

export interface LearningSection {
  id: string
  title: string
  description: string | null
  items: LearningItem[]
}

export type ContextTab = 'overview' | 'notes' | 'discussion' | 'mindmap'

export function itemKey(item: LearningItem): string {
  return `${item.kind}:${item.id}`
}

export function isVideoFile(fileName: string, fileType?: string | null): boolean {
  if (fileType && fileType.toLowerCase().startsWith('video/')) return true
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext)
}

export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds) return null
  const mins = Math.max(1, Math.round(seconds / 60))
  return `${mins} phút`
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function materialTypeLabel(type: string): string {
  if (!type) return 'Học liệu'
  const t = type.toLowerCase()
  if (t === 'video') return 'Video bài giảng'
  if (t === 'pdf') return 'Tài liệu PDF'
  if (t === 'docx') return 'Văn bản Word'
  if (t === 'image') return 'Hình ảnh'
  if (t === 'url') return 'Liên kết ngoài'
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}
