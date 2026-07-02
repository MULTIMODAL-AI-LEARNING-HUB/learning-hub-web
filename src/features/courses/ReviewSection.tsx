import { useState, useEffect, useCallback } from 'react'
import { coursesApi, type Review } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { Star, StarHalf, User } from 'lucide-react'

interface Props {
  courseId: string
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} fill-yellow-400 text-yellow-400`} />)
    } else if (i === fullStars && hasHalf) {
      stars.push(<StarHalf key={i} className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} fill-yellow-400 text-yellow-400`} />)
    } else {
      stars.push(<Star key={i} className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground/30`} />)
    }
  }
  return <div className="flex gap-0.5">{stars}</div>
}

function InteractiveRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className="p-0.5 hover:scale-110 transition">
          <Star className={`h-6 w-6 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
        </button>
      ))}
    </div>
  )
}

export function ReviewSection({ courseId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formRating, setFormRating] = useState(5)
  const [formComment, setFormComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    try {
      const [reviewsRes, myRes] = await Promise.all([
        coursesApi.getReviews(courseId, 1, 50),
        coursesApi.getMyReview(courseId).catch(() => null),
      ])
      setReviews(reviewsRes.data.items)
      if (myRes) setMyReview(myRes.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (myReview) {
        const res = await coursesApi.updateMyReview(courseId, { rating: formRating, comment: formComment || undefined })
        setReviews(prev => prev.map(r => r.id === res.data.id ? res.data : r))
        setMyReview(res.data)
      } else {
        const res = await coursesApi.createReview(courseId, { rating: formRating, comment: formComment || undefined })
        setReviews(prev => [res.data, ...prev])
        setMyReview(res.data)
      }
      setShowForm(false)
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Reviews & Ratings</h3>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => { setShowForm(true); setFormRating(myReview?.rating || 5); setFormComment(myReview?.comment || '') }}>
            {myReview ? 'Edit Review' : 'Write Review'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <InteractiveRating value={formRating} onChange={setFormRating} />
          <textarea
            value={formComment}
            onChange={(e) => setFormComment(e.target.value)}
            placeholder="Share your thoughts about this course..."
            className="w-full min-h-[80px] rounded-lg border border-input bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitting} size="sm">
              {submitting ? 'Submitting...' : myReview ? 'Update' : 'Submit'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{review.student_name || 'Anonymous'}</span>
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                  {review.lecturer_reply && (
                    <div className="mt-2 pl-3 border-l-2 border-primary/30">
                      <p className="text-xs font-medium text-primary">Lecturer reply</p>
                      <p className="text-sm text-muted-foreground">{review.lecturer_reply}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
