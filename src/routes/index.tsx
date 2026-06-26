import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '../pages/AppShell'
import { LoginPage, RegisterPage } from '../pages/AuthPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { PaymentReturn } from '../pages/PaymentReturn'
import { QuizTaking } from '../pages/QuizTaking'
import { DocumentHub } from '../features/documents/DocumentHub'
import { ChatPanel } from '../features/chat/ChatPanel'
import { QuizGenerator } from '../features/study/QuizGenerator'
import { Flashcards } from '../features/study/Flashcards'
import { EssayGrading } from '../features/study/EssayGrading'
import { AdminDashboard } from '../features/admin/AdminDashboard'
import { HomePage } from '../features/dashboard/HomePage'
import { CourseCatalog } from '../features/courses/CourseCatalog'
import { CourseDetail } from '../features/courses/CourseDetail'
import { CourseLearning } from '../features/courses/CourseLearning'
import { CourseManage } from '../features/courses/CourseManage'
import { MyCourses } from '../features/courses/MyCourses'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app/home" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },
  { path: '/payment/return', element: <PaymentReturn /> },
  { path: '/quiz/:id', element: <QuizTaking /> },
  {
    path: '/app',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/app/home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'courses', element: <CourseCatalog /> },
      { path: 'courses/my', element: <MyCourses /> },
      { path: 'courses/manage', element: <CourseManage /> },
      { path: 'courses/:id', element: <CourseDetail /> },
      { path: 'courses/:id/learn', element: <CourseLearning /> },
      { path: 'courses/:id/quiz', element: <QuizTaking /> },
      { path: 'documents', element: <DocumentHub /> },
      { path: 'chat', element: <ChatPanel /> },
      { path: 'quiz', element: <QuizGenerator /> },
      { path: 'flashcards', element: <Flashcards /> },
      { path: 'essay', element: <EssayGrading /> },
      { path: 'admin', element: <AdminDashboard /> }
    ]
  }
])
