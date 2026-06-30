import type { StateCreator } from 'zustand'
import type { AppState, DocumentsSlice, AxiosErrorLike } from '../types'
import type { DocumentItem } from '../../types'
import { documentsApi } from '../../services/api'

export const createDocumentsSlice: StateCreator<AppState, [['zustand/devtools', never]], [], DocumentsSlice> = (set, get) => ({
  documents: {
    items: [] as DocumentItem[],
    selectedId: null,
    select: (id) => set((state) => ({
      documents: { ...state.documents, selectedId: id }
    }), false, 'documents/select'),
    add: (doc) => set((state) => ({
      documents: { ...state.documents, items: [...state.documents.items, doc] }
    }), false, 'documents/add'),
    remove: (id) => set((state) => {
      documentsApi.delete(id).catch(() => {})
      return {
        documents: {
          ...state.documents,
          items: state.documents.items.filter((d) => d.id !== id),
          selectedId: state.documents.selectedId === id ? null : state.documents.selectedId
        }
      }
    }, false, 'documents/remove'),
    retry: (id) => set((state) => ({
      documents: {
        ...state.documents,
        items: state.documents.items.map((d) =>
          d.id === id ? { ...d, status: 'processing' as const, progress: 0 } : d
        )
      }
    }), false, 'documents/retry'),
    updateProgress: (id, progress, status = 'processing') => set((state) => ({
      documents: {
        ...state.documents,
        items: state.documents.items.map((d) =>
          d.id === id ? { ...d, progress, status } : d
        )
      }
    }), false, 'documents/updateProgress'),
    loadDocuments: async () => {
      try {
        const res = await documentsApi.list()
        const items: DocumentItem[] = res.data.items.map((d) => ({
          id: d.id,
          name: d.file_name,
          type: d.file_type as 'pdf' | 'video' | 'audio' | 'url',
          status: d.status as 'processing' | 'ready' | 'failed',
          size: d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
          pageCount: (d.metadata as Record<string, unknown>)?.page_count as number | undefined,
          progress: d.status === 'processing' ? 50 : undefined,
        }))
        set((state) => ({
          documents: { ...state.documents, items }
        }), false, 'documents/loadDocuments')
      } catch {
        // Fallback to initial mock docs if API fails
      }
    },
    uploadDocument: async (file: File) => {
      try {
        const res = await documentsApi.upload(file)
        const data = res.data as { id: string; file_name: string; file_type?: string }
        const newDoc: DocumentItem = {
          id: data.id,
          name: data.file_name,
          type: (data.file_type as 'pdf') || 'pdf',
          status: 'processing',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          progress: 0,
        }
        get().documents.add(newDoc)
        get().toasts.add({ type: 'success', title: 'Upload started', message: file.name })
      } catch (err) {
        const apiErr = err as AxiosErrorLike
        const msg = apiErr.response?.data?.detail || apiErr.message || file.name
        get().toasts.add({ type: 'error', title: 'Upload failed', message: msg })
        throw err
      }
    }
  }
})
