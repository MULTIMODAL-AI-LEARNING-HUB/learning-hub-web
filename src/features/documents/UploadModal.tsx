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
  error?: string
}

const ALLOWED_EXTS = ['pdf', 'mp4', 'mp3', 'webm', 'wav', 'txt', 'doc', 'docx']
const MAX_SIZE_BYTES = 100 * 1024 * 1024 // 100MB — khớp giới hạn backend

function describeUploadError(err: unknown, fileName: string): string {
  const e = err as {
    response?: { status?: number; data?: { detail?: unknown } }
    message?: string
    code?: string
  }
  const detail = e?.response?.data?.detail
  const raw = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.join('; ') : ''
  if (raw) return raw
  if (e?.code === 'ERR_NETWORK' || e?.message === 'Network Error') {
    return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
  }
  if (e?.response?.status === 429) {
    return 'Bạn tải lên quá nhanh (tối đa 5 tệp/phút). Chờ một chút rồi thử lại.'
  }
  if (e?.response?.status === 413) {
    return 'Tệp quá lớn. Dung lượng tối đa là 100MB.'
  }
  return e?.message || `Không tải lên được ${fileName}.`
}

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const uploadDoc = useAppStore((s) => s.documents.uploadDocument)
  const toast = useToast()
  const [files, setFiles] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const refreshList = useAppStore((s) => s.documents.loadDocuments)

  const doUpload = useCallback(
    async (file: UploadItem, rawFile: File) => {
      try {
        await uploadDoc(rawFile, (pct) =>
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress: pct } : f))
          )
        )
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress: 100, status: 'done' } : f))
        )
        await refreshList()
      } catch (err) {
        const message = describeUploadError(err, file.name)
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'error', error: message } : f))
        )
        toast({ type: 'error', title: 'Tải lên thất bại', message: `${file.name}: ${message}` })
      }
    },
    [uploadDoc, refreshList, toast]
  )

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const rawFiles = Array.from(fileList)
    const accepted: File[] = []
    rawFiles.forEach((f) => {
      const ext = f.name.includes('.') ? f.name.split('.').pop()!.toLowerCase() : ''
      if (!ALLOWED_EXTS.includes(ext)) {
        const bad: UploadItem = {
          id: `${Date.now()}-rejected-${f.name}`,
          name: f.name,
          size: `${(f.size / 1024 / 1024).toFixed(1)}MB`,
          progress: 0,
          status: 'error',
          error: `Định dạng .${ext || '?'} chưa hỗ trợ. Chỉ nhận: ${ALLOWED_EXTS.map((e) => `.${e}`).join(', ')}.`,
        }
        setFiles((prev) => [...prev, bad])
        return
      }
      if (f.size > MAX_SIZE_BYTES) {
        const big: UploadItem = {
          id: `${Date.now()}-oversize-${f.name}`,
          name: f.name,
          size: `${(f.size / 1024 / 1024).toFixed(1)}MB`,
          progress: 0,
          status: 'error',
          error: 'Tệp quá lớn. Dung lượng tối đa là 100MB.',
        }
        setFiles((prev) => [...prev, big])
        return
      }
      accepted.push(f)
    })
    if (accepted.length === 0) return
    const newFiles: UploadItem[] = accepted.map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)}MB`,
      progress: 0,
      status: 'uploading' as const
    }))
    setFiles((prev) => [...prev, ...newFiles])
    newFiles.forEach((f, i) => doUpload(f, accepted[i]))
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
      title="Tải lên tài liệu"
      description="Kéo thả tệp hoặc bấm để chọn tệp từ thiết bị"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => { setFiles([]); onClose() }}>
            Hủy
          </Button>
          <Button
            onClick={() => inputRef.current?.click()}
            icon={<Upload className="h-4 w-4" />}
          >
            Chọn tệp từ máy
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
            {dragging ? 'Thả tệp vào đây' : 'Nhấn để chọn tệp hoặc kéo & thả vào đây'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, MP4, MP3, WebM, WAV, TXT, DOC, DOCX · tối đa 100MB
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.mp4,.mp3,.webm,.wav,.txt,.doc,.docx"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
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
                {f.status === 'uploading' ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={f.progress} variant="default" size="sm" />
                    <span className="shrink-0 text-2xs text-muted-foreground tabular-nums w-12 text-right">
                      {f.progress}%
                    </span>
                  </div>
                ) : f.status === 'done' ? (
                  <p className="mt-1 text-2xs text-success">Đã tải lên — đang xử lý AI…</p>
                ) : (
                  <p className="mt-1 text-2xs text-destructive">{f.error || 'Tải lên thất bại.'}</p>
                )}
                <p className="mt-0.5 text-2xs text-muted-foreground">{f.size}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
