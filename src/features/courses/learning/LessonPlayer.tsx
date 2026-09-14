import { useMemo, useState } from 'react'
import { Clock, PlayCircle, ShieldCheck, Video } from 'lucide-react'
import { api, withAuthToken, type CourseMaterial, type Lesson } from '../../../services/api'
import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useAppStore } from '../../../stores/appStore'
import {
  formatDuration,
  isVideoFile,
  type LearningItem,
} from './types'
import { VideoWatermark } from './VideoWatermark'

interface LessonPlayerProps {
  item: LearningItem
  onVideoEnded?: () => void
}

export function LessonPlayer({ item, onVideoEnded }: LessonPlayerProps) {
  if (item.kind === 'material') {
    return <MaterialPlayer key={item.material.id} material={item.material} onVideoEnded={onVideoEnded} />
  }

  return <VideoPlayer key={item.lesson.id} lesson={item.lesson} onVideoEnded={onVideoEnded} />
}

function VideoPlayer({ lesson, onVideoEnded }: { lesson: Lesson; onVideoEnded?: () => void }) {
  const attachments = lesson.attachments || []
  const videoAttachment = attachments.find((a) => isVideoFile(a.file_name, a.file_type))
  const videoSourceUrl = lesson.video_url || videoAttachment?.file_url || null
  const hasVideo = Boolean(videoSourceUrl)

  const authToken = useAppStore((s) => s.auth.token)
  const [streamFailed, setStreamFailed] = useState(false)

  const isExternalEmbed = Boolean(
    videoSourceUrl &&
      (videoSourceUrl.includes('youtube.com') ||
        videoSourceUrl.includes('youtu.be') ||
        videoSourceUrl.includes('vimeo.com'))
  )

  const streamUrl = useMemo(() => {
    if (!hasVideo || isExternalEmbed) return null
    try {
      const raw = api.getUri({
        url: `/sections/${lesson.section_id}/lessons/${lesson.id}/stream`,
      })
      return withAuthToken(raw, authToken) ?? null
    } catch {
      return null
    }
  }, [hasVideo, isExternalEmbed, lesson.section_id, lesson.id, authToken])

  const resolvedFallbackUrl = videoSourceUrl
    ? isExternalEmbed
      ? videoSourceUrl
      : withAuthToken(videoSourceUrl, authToken) || videoSourceUrl
    : null

  const activeVideoUrl = (!streamFailed && streamUrl) ? streamUrl : (resolvedFallbackUrl || streamUrl)

  if (!hasVideo) {
    // If lesson does not have a video, don't render an empty video player card
    return null
  }

  return (
    <Card padding="none" className="overflow-hidden border border-border/80 shadow-sm bg-black">
      {/* Video Container */}
      <div className="aspect-video w-full flex items-center justify-center overflow-hidden relative">
        {isExternalEmbed ? (
          <iframe
            src={videoSourceUrl!}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : activeVideoUrl ? (
          <>
            <video
              key={activeVideoUrl}
              src={activeVideoUrl}
              controls
              // Anti-download: hide native download button, block right-click save
              controlsList="nodownload noremoteplayback noplaybackrate"
              disablePictureInPicture
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
              onEnded={onVideoEnded}
              onContextMenu={(e) => e.preventDefault()}
              onError={() => {
                if (!streamFailed && streamUrl && activeVideoUrl === streamUrl) {
                  setStreamFailed(true)
                }
              }}
            >
              Trình duyệt của bạn không hỗ trợ phát video HTML5.
            </video>
            {/* Learner-specific watermark — deters screen-record redistribution */}
            <VideoWatermark />
          </>
        ) : (
          <EmptyState
            compact
            icon={<PlayCircle className="text-muted-foreground" />}
            title="Không thể tải video"
            description="Đường dẫn phát video không hợp lệ hoặc đang bảo trì."
          />
        )}
      </div>

      {/* Video metadata bar (download link removed — stream-only viewing) */}
      <div className="flex items-center justify-between bg-card/90 px-4 py-2 text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center gap-2 min-w-0">
          <Video className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-medium text-foreground truncate">{lesson.title}</span>
          {lesson.video_duration && (
            <span className="flex items-center gap-1 text-[11px] shrink-0 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(lesson.video_duration)}
            </span>
          )}
        </div>

        <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
          <ShieldCheck className="h-3 w-3 text-success" />
          Chỉ xem trực tiếp
        </span>
      </div>
    </Card>
  )
}

function MaterialPlayer({ material, onVideoEnded }: { material: CourseMaterial; onVideoEnded?: () => void }) {
  return (
    <Card padding="none" className="overflow-hidden border border-border/80 shadow-sm">
      <div className="flex aspect-video items-center justify-center bg-muted/40 relative overflow-hidden">
        {material.material_type === 'video' && material.file_url ? (
          <>
            <video
              src={material.file_url}
              controls
              controlsList="nodownload noremoteplayback noplaybackrate"
              disablePictureInPicture
              playsInline
              onContextMenu={(e) => e.preventDefault()}
              className="h-full w-full object-contain bg-black"
              onEnded={onVideoEnded}
            />
            <VideoWatermark />
          </>
        ) : material.material_type === 'image' && material.file_url ? (
          <img
            src={material.file_url}
            alt={material.title ?? undefined}
            className="max-h-full max-w-full object-contain select-none pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : material.material_type === 'url' && material.external_url ? (
          <iframe
            src={material.external_url}
            className="h-full w-full"
            title={material.title ?? undefined}
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-scripts"
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : material.file_url ? (
          <iframe
            src={material.file_url}
            className="h-full w-full"
            title={material.title ?? undefined}
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-scripts"
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <EmptyState
            compact
            title="Không thể xem trước"
            description="Học liệu chưa sẵn sàng để hiển thị trực tiếp."
          />
        )}
      </div>

      {(material.external_url || material.file_url) && (
        <div className="border-t border-border px-4 py-2.5 flex justify-between items-center bg-card text-xs text-muted-foreground">
          <span className="truncate">{material.file_name || material.title}</span>
          <span className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> Chỉ xem trực tiếp
          </span>
        </div>
      )}
    </Card>
  )
}
