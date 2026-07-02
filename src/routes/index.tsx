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
import { AdminLayout } from '../layouts/AdminLayout'
import { StudentDashboard } from '../features/student/StudentDashboard'
import { LecturerDashboard } from '../features/lecturer/LecturerDashboard'
import { LecturerCourses } from '../features/lecturer/LecturerCourses'
import { LecturerCourseDetail } from '../features/lecturer/LecturerCourseDetail'
import { DocumentHub } from '../features/documents/DocumentHub'
import { ChatPanel } from '../features/chat/ChatPanel'
import { QuizGenerator } from '../features/study/QuizGenerator'
import { Flashcards } from '../features/study/Flashcards'
import { EssayGrading } from '../features/study/EssayGrading'
import { AdminDashboard } from '../features/admin/AdminDashboard'
import { AdminUsers } from '../features/admin/AdminUsers'
import { AdminCourses } from '../features/admin/AdminCourses'
import { AdminCategories } from '../features/admin/AdminCategories'
import { AdminSettings } from '../features/admin/AdminSettings'
import {
  PlaceholderPage,
  StudentProfile,
} from '../pages/PlaceholderPage'
import { MyCourses as StudentCourses } from '../features/courses/MyCourses'
import { CourseDetail as StudentCourseDetail } from '../features/courses/CourseDetail'
import { CourseCatalog } from '../features/courses/CourseCatalog'
import { CourseLearning } from '../features/courses/CourseLearning'
import { StudentWishlist } from '../features/student/StudentWishlist'
import { LecturerStudents } from '../features/lecturer/LecturerStudents'
import { LecturerAnalytics } from '../features/lecturer/LecturerAnalytics'
import { LecturerDocuments } from '../features/lecturer/LecturerDocuments'
import { LecturerSettings } from '../features/lecturer/LecturerSettings'
import { LecturerProfile } from '../features/lecturer/LecturerProfile'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/welcome" replace /> },
  { path: '/welcome', element: <WelcomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },
  { path: '/payment/return', element: <PaymentReturn /> },
  { path: '/quiz/:id', element: <QuizTaking /> },
  { path: '/unauthorized', element: <PlaceholderPage title="Unauthorized" /> },

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
      { path: 'courses/:id/learn', element: <CourseLearning /> },
      { path: 'browse', element: <CourseCatalog /> },
      { path: 'wishlist', element: <StudentWishlist /> },
      { path: 'documents', element: <DocumentHub /> },
      { path: 'chat', element: <ChatPanel /> },
      { path: 'quiz', element: <QuizGenerator /> },
      { path: 'flashcards', element: <Flashcards /> },
      { path: 'essay', element: <EssayGrading /> },
      { path: 'profile', element: <StudentProfile /> },
    ]
  },

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

  {
    path: '/app/admin',
    element: (
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'courses', element: <AdminCourses /> },
      { path: 'categories', element: <AdminCategories /> },
      { path: 'settings', element: <AdminSettings /> },
    ]
  },

  { path: '*', element: <Navigate to="/welcome" replace /> }
])