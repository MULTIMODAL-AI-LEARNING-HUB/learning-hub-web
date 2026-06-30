interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-2">This feature is coming soon.</p>
      </div>
    </div>
  )
}

export function StudentCourses() { return <PlaceholderPage title="My Courses" /> }
export function StudentCourseDetail() { return <PlaceholderPage title="Course Detail" /> }
export function StudentProfile() { return <PlaceholderPage title="Profile" /> }

export function LecturerCourseDetail() { return <PlaceholderPage title="Course Management" /> }
export function LecturerStudents() { return <PlaceholderPage title="Students" /> }
export function LecturerAnalytics() { return <PlaceholderPage title="Analytics" /> }
export function LecturerDocuments() { return <PlaceholderPage title="Content Library" /> }
export function LecturerSettings() { return <PlaceholderPage title="Settings" /> }
export function LecturerProfile() { return <PlaceholderPage title="Profile" /> }