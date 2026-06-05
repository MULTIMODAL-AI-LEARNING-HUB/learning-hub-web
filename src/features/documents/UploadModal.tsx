import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import { useToast } from '../../components/ui/useToast'
import { cn } from '../../utils/cn'

interface UploadItem {
  id: string
  name: string
  size: string
  progress: number
  status: 'uploading' | 'done' | 'error'
}

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const uploadDoc = useAppStore((s) => s.documents.uploadDocument)
  const toast = useToast()
  const [files, setFiles] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const doUpload = useCallback(
    async (file: UploadItem, rawFile: File) => {
      try {
        await uploadDoc(rawFile)
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress: 100, status: 'done' } : f))
        )
      } catch {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'error' } : f))
        )
        toast({ type: 'error', title: 'Upload failed', message: file.name })
      }
    },
    [uploadDoc, toast]
  )

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const rawFiles = Array.from(fileList)
    const newFiles: UploadItem[] = rawFiles.map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)}MB`,
      progress: 0,
      status: 'uploading' as const
    }))
    setFiles((prev) => [...prev, ...newFiles])
    newFiles.forEach((f, i) => doUpload(f, rawFiles[i]))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setFiles([])
        onClose()
      }}
      title="Upload Documents"
      description="Drag and drop files or click to browse"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => { setFiles([]); onClose() }}>
            Cancel
          </Button>
          <Button
            onClick={() => inputRef.current?.click()}
            icon={<Upload className="h-4 w-4" />}
          >
            Browse Files
          </Button>
        </>
      }
    >
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition',
          dragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50'
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {dragging ? 'Drop files here' : 'Click to browse or drag & drop'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, MP4, MP3, WAV, DOC, DOCX · up to 100MB
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.mp4,.mp3,.wav,.doc,.docx"
        onChange={(e) => addFiles(e.target.files)}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="mt-4 grid gap-2 max-h-64 overflow-y-auto scrollbar-thin">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface-elevated p-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                {f.status === 'done' ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : f.status === 'error' ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{f.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress
                    value={f.progress}
                    variant={f.status === 'done' ? 'success' : f.status === 'error' ? 'destructive' : 'default'}
                    size="sm"
                  />
                  <span className="shrink-0 text-2xs text-muted-foreground tabular-nums w-12 text-right">
                    {f.size}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
