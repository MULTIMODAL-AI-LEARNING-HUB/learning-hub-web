import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RoleRoute } from '../components/auth/ProtectedRoute'
import WelcomePage from '../pages/WelcomePage'
import { LoginPage, RegisterPage } from '../pages/AuthPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { PaymentReturn } from '../pages/PaymentReturn'
import { QuizTaking } from '../pages/QuizTaking'
import { StudentLayout } from '../layouts/StudentLayout'
import { LecturerLayout } from '../layouts/LecturerLayout'
import { StudentDashboard } from '../features/student/StudentDashboard'
import { LecturerDashboard } from '../features/lecturer/LecturerDashboard'
import { DocumentHub } from '../features/documents/DocumentHub'
import { ChatPanel } from '../features/chat/ChatPanel'
import { QuizGenerator } from '../features/study/QuizGenerator'
import { Flashcards } from '../features/study/Flashcards'
import { EssayGrading } from '../features/study/EssayGrading'
import { AdminDashboard } from '../features/admin/AdminDashboard'

// Placeholder pages for missing features
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-2">This feature is coming soon.</p>
      </div>
    </div>
  )
}

// Student Placeholder Pages
function StudentCourses() { return <PlaceholderPage title="My Courses" /> }
function StudentCourseDetail() { return <PlaceholderPage title="Course Detail" /> }
function StudentProfile() { return <PlaceholderPage title="Profile" /> }

// Lecturer Placeholder Pages
function LecturerCourses() { return <PlaceholderPage title="Manage Courses" /> }
function LecturerCourseDetail() { return <PlaceholderPage title="Course Management" /> }
function LecturerStudents() { return <PlaceholderPage title="Students" /> }
function LecturerAnalytics() { return <PlaceholderPage title="Analytics" /> }
function LecturerDocuments() { return <PlaceholderPage title="Content Library" /> }
function LecturerSettings() { return <PlaceholderPage title="Settings" /> }
function LecturerProfile() { return <PlaceholderPage title="Profile" /> }

export const router = createBrowserRouter([
  // Public Routes
  { path: '/', element: <Navigate to="/welcome" replace /> },
  { path: '/welcome', element: <WelcomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },
  { path: '/payment/return', element: <PaymentReturn /> },
  { path: '/quiz/:id', element: <QuizTaking /> },
  { path: '/unauthorized', element: <div className="flex h-screen items-center justify-center"><h1>Unauthorized</h1></div> },

  // Student Routes
  {
    path: '/app/student',
    element: (
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/app/student/dashboard" replace /> },
      { path: 'dashboard', element: <StudentDashboard /> },
      { path: 'courses', element: <StudentCourses /> },
      { path: 'courses/:id', element: <StudentCourseDetail /> },
      { path: 'documents', element: <DocumentHub /> },
      { path: 'chat', element: <ChatPanel /> },
      { path: 'quiz', element: <QuizGenerator /> },
      { path: 'flashcards', element: <Flashcards /> },
      { path: 'essay', element: <EssayGrading /> },
      { path: 'profile', element: <StudentProfile /> },
    ]
  },

  // Lecturer Routes
  {
    path: '/app/lecturer',
    element: (
      <RoleRoute allowedRoles={['lecturer']}>
        <LecturerLayout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/app/lecturer/dashboard" replace /> },
      { path: 'dashboard', element: <LecturerDashboard /> },
      { path: 'courses', element: <LecturerCourses /> },
      { path: 'courses/:id', element: <LecturerCourseDetail /> },
      { path: 'students', element: <LecturerStudents /> },
      { path: 'analytics', element: <LecturerAnalytics /> },
      { path: 'documents', element: <LecturerDocuments /> },
      { path: 'settings', element: <LecturerSettings /> },
      { path: 'profile', element: <LecturerProfile /> },
    ]
  },

  // Admin Route (keep existing for now)
  {
    path: '/app/admin',
    element: (
      <RoleRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </RoleRoute>
    )
  },

  // Catch all - redirect to welcome
  { path: '*', element: <Navigate to="/welcome" replace /> }
])