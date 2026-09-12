import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Copy,
  Download,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'
import { useToast } from '../../components/ui/useToast'
import { cn } from '../../utils/cn'

interface InteractiveMindmapProps {
  markdown: string
  title?: string
  className?: string
  onRegenerate?: () => void
  isRegenerating?: boolean
}

const transformer = new Transformer()

export function InteractiveMindmap({
  markdown,
  title = 'Sơ đồ tư duy',
  className,
  onRegenerate,
  isRegenerating = false,
}: InteractiveMindmapProps) {
  const toast = useToast()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const markmapInstanceRef = useRef<Markmap | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!svgRef.current || !markdown) return

    try {
      const { root } = transformer.transform(markdown)

      if (!markmapInstanceRef.current) {
        // Create new markmap instance with nice pedagogical styling
        markmapInstanceRef.current = Markmap.create(
          svgRef.current,
          {
            autoFit: true,
            duration: 300,
            spacingHorizontal: 80,
            spacingVertical: 12,
            paddingX: 16,
          },
          root
        )
      } else {
        // Update existing instance
        markmapInstanceRef.current.setData(root)
        markmapInstanceRef.current.fit()
      }
    } catch (err) {
      console.error('Failed to render markmap:', err)
    }
  }, [markdown])

  const handleZoomIn = () => {
    markmapInstanceRef.current?.rescale(1.25)
  }

  const handleZoomOut = () => {
    markmapInstanceRef.current?.rescale(0.8)
  }

  const handleFit = () => {
    markmapInstanceRef.current?.fit()
  }

  const handleExportSvg = () => {
    if (!svgRef.current) return
    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current)
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.replace(/[^a-zA-Z0-9_À-ɏḀ-ỿ]+/g, '_')}_mindmap.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({ type: 'success', title: 'Đã tải xuống sơ đồ tư duy (SVG)' })
    } catch (err) {
      console.error('Failed to export mindmap SVG:', err)
      toast({ type: 'error', title: 'Không thể xuất file SVG' })
    }
  }

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    toast({ type: 'success', title: 'Đã sao chép cấu trúc Markdown' })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs',
        className
      )}
    >
      {/* Mindmap Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-bold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {title}
          </span>
          <span className="hidden sm:inline-block text-2xs text-muted-foreground">
            · Nhấp chuột vào nút để mở/thu gọn nhánh
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="Phóng to"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFit}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="Vừa vặn màn hình"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-border/80 mx-0.5" />

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex h-7 items-center gap-1 px-2 rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-colors text-2xs font-medium cursor-pointer"
            title="Sao chép Markdown"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            <span className="hidden md:inline">Sao chép</span>
          </button>

          <button
            type="button"
            onClick={handleExportSvg}
            className="flex h-7 items-center gap-1 px-2 rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-colors text-2xs font-medium cursor-pointer"
            title="Tải ảnh SVG"
          >
            <Download className="h-3 w-3 text-primary" />
            <span className="hidden md:inline">Tải SVG</span>
          </button>

          {onRegenerate && (
            <button
              type="button"
              disabled={isRegenerating}
              onClick={onRegenerate}
              className="flex h-7 items-center gap-1 px-2 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-2xs font-semibold cursor-pointer disabled:opacity-50"
              title="Làm mới sơ đồ bằng AI"
            >
              <RefreshCw className={cn('h-3 w-3', isRegenerating && 'animate-spin')} />
              <span className="hidden sm:inline">Làm mới AI</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 min-h-[400px] w-full bg-background/50">
        <svg
          ref={svgRef}
          className="h-full w-full min-h-[400px] touch-none cursor-grab active:cursor-grabbing select-none"
        />
      </div>
    </div>
  )
}
