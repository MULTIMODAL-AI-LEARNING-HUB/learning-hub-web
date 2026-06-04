/**
 * Shared utility helper mapping file types to corresponding emoji icons.
 */
export const fileIcon = (type: string): string => {
  const t = type.toLowerCase()
  if (t === 'pdf') return '📄'
  if (t === 'video' || t === 'mp4' || t === 'webm') return '🎬'
  if (t === 'audio' || t === 'mp3') return '🎧'
  return '🔗'
}
