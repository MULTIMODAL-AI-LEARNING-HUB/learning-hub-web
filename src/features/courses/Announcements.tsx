import { useState, useEffect, useCallback } from 'react'
import { announcementsApi, type Announcement } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Megaphone, User } from 'lucide-react'

interface Props {
  courseId: string
}

export function Announcements({ courseId }: Props) {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await announcementsApi.list(courseId)
      setItems(res.data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-accent" />
        Announcements
      </h3>
      {items.map((item) => (
        <Card key={item.id} className="p-4 border-l-4 border-l-accent">
          <div className="flex items-start gap-3">
            <Megaphone className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground">{item.title}</h4>
                <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{item.content}</p>
              {item.lecturer_name && (
                <p className="text-xs text-muted-foreground/70 mt-2 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.lecturer_name}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
