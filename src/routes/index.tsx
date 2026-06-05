import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '../pages/AppShell'
import { LoginPage, RegisterPage } from '../pages/AuthPage'
import { DocumentHub } from '../features/documents/DocumentHub'
import { ChatPanel } from '../features/chat/ChatPanel'
import { QuizGenerator } from '../features/study/QuizGenerator'
import { Flashcards } from '../features/study/Flashcards'
import { EssayGrading } from '../features/study/EssayGrading'
import { AdminDashboard } from '../features/admin/AdminDashboard'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app/documents" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/app',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/app/documents" replace /> },
      { path: 'documents', element: <DocumentHub /> },
      { path: 'chat', element: <ChatPanel /> },
      { path: 'quiz', element: <QuizGenerator /> },
      { path: 'flashcards', element: <Flashcards /> },
      { path: 'essay', element: <EssayGrading /> },
      { path: 'admin', element: <AdminDashboard /> }
    ]
  }
])
