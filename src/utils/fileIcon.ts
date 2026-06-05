import { FileText, Film, Music, Link2, type LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  pdf: FileText,
  video: Film,
  audio: Music,
  url: Link2,
  mp4: Film,
  webm: Film,
  mp3: Music,
  wav: Music,
  doc: FileText,
  docx: FileText
}

export function fileIcon(type: string): LucideIcon {
  return iconMap[type.toLowerCase()] ?? FileText
}

export function fileIconEmoji(type: string): string {
  const t = type.toLowerCase()
  if (t === 'pdf') return '📄'
  if (t === 'video' || t === 'mp4' || t === 'webm') return '🎬'
  if (t === 'audio' || t === 'mp3') return '🎧'
  return '🔗'
}
