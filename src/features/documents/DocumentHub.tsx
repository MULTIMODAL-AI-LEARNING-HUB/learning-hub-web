import { useEffect, useState } from 'react'
import { Upload, FileText, LayoutGrid, List, ArrowUpDown, Search, ArrowLeft } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { DocumentViewer } from './DocumentViewer'
import { DocumentCard } from './DocumentCard'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDocumentStatus } from '../../hooks/useDocumentStatus'
import { cn } from '../../utils/cn'

export function DocumentHub() {
  const docs = useAppStore((s) => s.documents.items)
  const selectedId = useAppStore((s) => s.documents.selectedId)
  const openUpload = useAppStore((s) => s.ui.openUploadModal)
  const loadDocuments = useAppStore((s) => s.documents.loadDocuments)
  const removeDoc = useAppStore((s) => s.documents.remove)
  const retryDoc = useAppStore((s) => s.documents.retry)
  const selectDoc = useAppStore((s) => s.documents.select)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'status'>('name')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileViewer, setShowMobileViewer] = useState(false)

  const handleSelectDoc = (id: string) => {
    selectDoc(id)
    if (window.innerWidth < 1024) {
      setShowMobileViewer(true)
    }
  }

  useDocumentStatus()

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const selectedDoc = docs.find((d) => d.id === selectedId)
  const readyDocs = docs.filter((d) => d.status === 'ready').length

  // Helper to parse MB/KB size for sorting
  const parseSize = (sizeStr: string): number => {
    const num = parseFloat(sizeStr)
    if (isNaN(num)) return 0
    if (sizeStr.includes('GB')) return num * 1024
    if (sizeStr.includes('KB')) return num / 1024
    return num
  }

  // Sort and filter logic
  const filteredDocs = docs
    .filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'size') {
        return parseSize(b.size) - parseSize(a.size)
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status)
      }
      return 0
    })

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        subtitle="Workspace"
        title="Documents"
        description={`${docs.length} document${docs.length === 1 ? '' : 's'} · ${readyDocs} ready to study`}
        icon={<FileText />}
        actions={
          <Button onClick={openUpload} icon={<Upload className="h-4 w-4" />}>
            Upload
          </Button>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0">
        <div className="w-full shrink-0 lg:w-[360px] flex flex-col min-h-0 bg-surface-elevated/20 border border-border/40 rounded-2xl p-3 shadow-soft">
          {docs.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="No documents yet"
              description="Upload PDFs, videos, audio files, or URLs to get started with your AI study workspace."
              action={
                <Button onClick={openUpload} icon={<Upload className="h-4 w-4" />}>
                  Upload your first document
                </Button>
              }
              className="flex-1"
            />
          ) : (
            <>
              {/* Controls bar (Search, Sort, Grid/List view toggle) */}
              <div className="space-y-2.5 mb-3">
                {/* Search field */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-input bg-surface pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Sort and View Toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'status')}
                      className="bg-transparent font-semibold text-foreground outline-none cursor-pointer hover:text-primary transition"
                    >
                      <option value="name">Name</option>
                      <option value="size">Size</option>
                      <option value="status">Status</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'p-1 rounded-md transition-all',
                        viewMode === 'list'
                          ? 'bg-surface shadow-soft text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title="List View"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'p-1 rounded-md transition-all',
                        viewMode === 'grid'
                          ? 'bg-surface shadow-soft text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title="Grid View"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Document items list */}
              {filteredDocs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-muted-foreground">
                  No documents found matching "{searchQuery}"
                </div>
              ) : viewMode === 'list' ? (
                <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-2">
                  {filteredDocs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      isSelected={selectedId === doc.id}
                      onSelect={() => handleSelectDoc(doc.id)}
                      onRemove={removeDoc}
                      onRetry={retryDoc}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 grid grid-cols-2 gap-2 auto-rows-max">
                  {filteredDocs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      isSelected={selectedId === doc.id}
                      onSelect={() => handleSelectDoc(doc.id)}
                      onRemove={removeDoc}
                      onRetry={retryDoc}
                      variant="compact"
                      className="h-full"
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="hidden flex-1 lg:block min-h-0 bg-surface-elevated/30 border border-border/40 rounded-2xl p-4 shadow-soft">
          {selectedDoc ? (
            <DocumentViewer doc={selectedDoc} />
          ) : (
            <EmptyState
              icon={<FileText />}
              title="Select a document"
              description="Pick a document from the list to view its content, ask questions, and generate study materials."
              className="h-full"
            />
          )}
        </div>
      </div>

      {showMobileViewer && selectedDoc && (
        <div className="fixed inset-0 z-50 animate-fade-in lg:hidden">
          <div className="flex h-full flex-col bg-background">
            <div className="flex items-center gap-3 border-b border-border px-3 py-3 sm:px-4">
              <button
                onClick={() => setShowMobileViewer(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  DOCUMENT VIEWER
                </p>
                <p className="text-sm font-semibold text-foreground truncate">{selectedDoc.name}</p>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <DocumentViewer doc={selectedDoc} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
