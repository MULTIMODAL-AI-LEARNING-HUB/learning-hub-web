import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { wishlistApi, type WishlistItem } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { Heart, Trash2 } from 'lucide-react'

export function StudentWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadWishlist = useCallback(async () => {
    setLoading(true)
    try {
      const res = await wishlistApi.list()
      setItems(res.data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  const removeItem = async (courseId: string) => {
    try {
      await wishlistApi.remove(courseId)
      setItems(prev => prev.filter(i => i.course_id !== courseId))
    } catch {
      // ignore
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return ''
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Heart className="h-6 w-6 text-destructive" />
        <div>
          <h1 className="text-fluid-2xl font-bold text-foreground">Wishlist</h1>
          <p className="text-muted-foreground text-sm">Courses you've saved for later</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground mb-4">Save courses you're interested in</p>
          <Link to="/app/student/browse">
            <Button>Browse Courses</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group">
              <Link to={`/app/student/courses/${item.course_id}`}>
                <div className="aspect-video bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                  {item.course_thumbnail ? (
                    <img src={item.course_thumbnail} alt={item.course_title || ''} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">📚</span>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/app/student/courses/${item.course_id}`} className="font-semibold text-foreground hover:text-primary line-clamp-1 block mb-2">
                  {item.course_title || 'Course'}
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">
                    {item.course_price === 0 ? 'Free' : `${formatPrice(item.course_price)}đ`}
                  </span>
                  <button
                    onClick={() => removeItem(item.course_id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition opacity-0 group-hover:opacity-100"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
