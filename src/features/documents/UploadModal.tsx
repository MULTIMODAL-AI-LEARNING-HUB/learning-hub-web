import { useState, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import { documentsApi } from '../../services/api'

interface UploadItem {
  id: string
  name: string
  size: string
  progress: number
  status: 'uploading' | 'done' | 'error'
}

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const uploadDoc = useAppStore((s) => s.documents.uploadDocument)
  const [files, setFiles] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)

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
      }
    },
    [uploadDoc]
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
    <Modal open={open} title="Upload Documents" onClose={onClose} size="md">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.multiple = true
          input.accept = '.pdf,.mp4,.mp3,.wav,.doc,.docx'
          input.onchange = (e) => addFiles((e.target as HTMLInputElement).files)
          input.click()
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition ${
          dragging
            ? 'border-accent bg-accentSoft'
            : 'border-border bg-surface hover:border-accent/50'
        }`}
      >
        <span className="text-3xl">📁</span>
        <p className="text-sm font-medium text-ink">
          {dragging ? 'Drop files here' : 'Click to browse or drag & drop'}
        </p>
        <p className="text-xs text-inkMute">PDF, MP4, MP3, DOC up to 100MB</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 grid gap-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
              <span className="text-lg">
                {f.status === 'done' ? '✓' : f.status === 'error' ? '✕' : '📄'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={f.progress} variant={f.status === 'done' ? 'accent' : 'default'} />
                  <span className="text-xs text-inkMute">{f.size}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
