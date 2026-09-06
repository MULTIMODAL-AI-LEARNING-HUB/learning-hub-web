interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-2">Tính năng này đang được phát triển.</p>
      </div>
    </div>
  )
}

export function StudentCourses() { return <PlaceholderPage title="Khóa học của tôi" /> }
export function StudentCourseDetail() { return <PlaceholderPage title="Chi tiết khóa học" /> }
export function StudentProfile() { return <PlaceholderPage title="Hồ sơ cá nhân" /> }

export function LecturerCourseDetail() { return <PlaceholderPage title="Quản lý khóa học" /> }
export function LecturerStudents() { return <PlaceholderPage title="Danh sách học viên" /> }
export function LecturerAnalytics() { return <PlaceholderPage title="Thống kê phân tích" /> }
export function LecturerDocuments() { return <PlaceholderPage title="Thư viện tài liệu" /> }
export function LecturerSettings() { return <PlaceholderPage title="Cài đặt hệ thống" /> }
export function LecturerProfile() { return <PlaceholderPage title="Hồ sơ cá nhân" /> }