/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Headphones,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { audioApi, withAuthToken, type AudioSummaryResponse } from '../../services/api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { cn } from '../../utils/cn'

interface LessonAudioPlayerProps {
  lessonId: string
  lessonTitle: string
  className?: string
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2]

function formatSeconds(secs: number): string {
  if (isNaN(secs) || secs < 0) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LessonAudioPlayer({ lessonId, lessonTitle, className }: LessonAudioPlayerProps) {
  const [data, setData] = useState<AudioSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voice, setVoice] = useState<'female' | 'male'>('female')

  // Audio playback state
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Reset playback when lessonId changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setData(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setError(null)
  }, [lessonId])

  // Sync playback rate to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  const fetchAudioSummary = useCallback(
    async (forceRegenerate: boolean = false, selectedVoice: 'female' | 'male' = voice) => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await audioApi.getLessonAudioSummary(lessonId, selectedVoice, forceRegenerate)
        setData(res.data)
        // Reset current audio playback
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          setIsPlaying(false)
        }
      } catch (err: unknown) {
        console.error('Failed to fetch audio summary:', err)
        setError('Không thể tạo âm thanh tóm tắt bài học. Vui lòng thử lại sau.')
      } finally {
        setIsLoading(false)
      }
    },
    [lessonId, voice]
  )

  const handleTogglePlay = () => {
    if (!data) {
      fetchAudioSummary()
      return
    }
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error('Audio play error:', e))
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = parseFloat(e.target.value)
    setCurrentTime(nextTime)
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const cyclePlaybackRate = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length
    setPlaybackRate(SPEED_OPTIONS[nextIndex])
  }

  const handleChangeVoice = (newVoice: 'female' | 'male') => {
    setVoice(newVoice)
    fetchAudioSummary(true, newVoice)
  }

  const audioSrc = data ? withAuthToken(data.audio_url) : undefined

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/80 bg-linear-to-r from-primary/5 via-background to-primary/10 p-4 transition-all shadow-xs',
        className
      )}
    >
      {/* Hidden native HTML5 audio element */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime)
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration)
            }
          }}
          onEnded={() => {
            setIsPlaying(false)
            setCurrentTime(0)
          }}
          onError={() => {
            setError('Lỗi khi tải luồng âm thanh.')
            setIsPlaying(false)
          }}
        />
      )}

      {/* Main Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all shadow-xs',
              isPlaying
                ? 'bg-primary text-primary-foreground animate-pulse'
                : 'bg-primary/10 text-primary border border-primary/20'
            )}
          >
            <Headphones className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI Podcast Summary
              </span>
              {data?.is_cached && (
                <Badge variant="success" label="Đã lưu đệm" />
              )}
            </div>
            <p className="truncate text-sm font-semibold text-foreground" title={lessonTitle}>
              Tóm tắt bài học: {lessonTitle}
            </p>
          </div>
        </div>

        {/* Right CTA / Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!data && !isLoading && (
            <Button
              onClick={() => fetchAudioSummary(false)}
              variant="primary"
              size="sm"
              icon={<Play className="h-3.5 w-3.5 fill-current" />}
            >
              Nghe tóm tắt bài học
            </Button>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-primary font-medium px-3 py-1.5 rounded-lg bg-primary/10">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tạo giọng đọc AI...
            </div>
          )}

          {data && !isLoading && (
            <div className="flex items-center gap-1.5">
              {/* Voice toggle */}
              <div className="flex items-center rounded-lg border border-border/70 bg-background/80 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleChangeVoice('female')}
                  className={cn(
                    'rounded-md px-2 py-1 font-medium transition-colors',
                    voice === 'female'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Giọng nữ (Hoài My - Neural)"
                >
                  Nữ
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeVoice('male')}
                  className={cn(
                    'rounded-md px-2 py-1 font-medium transition-colors',
                    voice === 'male'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Giọng nam (Nam Minh - Neural)"
                >
                  Nam
                </button>
              </div>

              {/* Speed toggle */}
              <button
                type="button"
                onClick={cyclePlaybackRate}
                className="rounded-lg border border-border/70 bg-background/80 px-2 py-1 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                title="Tốc độ phát âm thanh"
              >
                {playbackRate}x
              </button>

              {/* Mute button */}
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-lg border border-border/70 bg-background/80 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5 text-destructive" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>

              {/* Regenerate */}
              <button
                type="button"
                onClick={() => fetchAudioSummary(true)}
                className="rounded-lg border border-border/70 bg-background/80 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Tạo lại tóm tắt âm thanh"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              {/* Play / Pause main button */}
              <Button
                onClick={handleTogglePlay}
                variant="primary"
                size="sm"
                icon={
                  isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )
                }
              >
                {isPlaying ? 'Tạm dừng' : 'Phát'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Seekbar (only when audio is loaded) */}
      {data && (
        <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-2.5">
          <span className="text-xs font-medium tabular-nums text-muted-foreground min-w-9">
            {formatSeconds(currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Tiến độ âm thanh"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-border accent-primary focus:outline-hidden"
          />

          <span className="text-xs font-medium tabular-nums text-muted-foreground min-w-9 text-right">
            {formatSeconds(duration)}
          </span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-2 text-xs text-destructive flex items-center justify-between bg-destructive/10 px-3 py-1.5 rounded-lg">
          <span>{error}</span>
          <button
            onClick={() => fetchAudioSummary(true)}
            className="underline font-semibold ml-2 hover:opacity-80"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  )
}
