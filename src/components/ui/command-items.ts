import { useNavigate } from 'react-router-dom'
import { FileText, MessageSquare, Layers, PenLine, Settings, BookOpen, type LucideIcon } from 'lucide-react'

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  group: string
  shortcut?: string
  action: () => void
}

export function useDefaultCommandItems(): CommandItem[] {
  const navigate = useNavigate()
  return [
    {
      id: 'nav-documents',
      label: 'Documents',
      description: 'Upload and manage your knowledge sources',
      icon: FileText,
      group: 'Navigation',
      shortcut: 'G D',
      action: () => navigate('/app/documents')
    },
    {
      id: 'nav-chat',
      label: 'AI Chat',
      description: 'Ask questions about your documents',
      icon: MessageSquare,
      group: 'Navigation',
      shortcut: 'G C',
      action: () => navigate('/app/chat')
    },
    {
      id: 'nav-quiz',
      label: 'Quiz Generator',
      description: 'Generate practice questions',
      icon: BookOpen,
      group: 'Study Tools',
      action: () => navigate('/app/quiz')
    },
    {
      id: 'nav-flashcards',
      label: 'Flashcards',
      description: 'Spaced repetition learning',
      icon: Layers,
      group: 'Study Tools',
      action: () => navigate('/app/flashcards')
    },
    {
      id: 'nav-essay',
      label: 'Essay Grading',
      description: 'Get AI feedback on your writing',
      icon: PenLine,
      group: 'Study Tools',
      action: () => navigate('/app/essay')
    },
    {
      id: 'nav-admin',
      label: 'Admin Panel',
      description: 'Manage users and system health',
      icon: Settings,
      group: 'Navigation',
      action: () => navigate('/app/admin')
    }
  ]
}
