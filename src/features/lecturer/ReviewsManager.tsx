import { useState, useEffect } from 'react'
import { Star, MessageCircle, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { Card } from '../../components/ui/Card'
import { useReviews } from '../../hooks/useReviews'

interface ReviewsManagerProps {
  courseId: string
}

export function ReviewsManager({ courseId }: ReviewsManagerProps) {
  const { reviews, total, loading, fetchReviews, replyToReview } = useReviews(courseId)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return
    await replyToReview(reviewId, replyText)
    setReplyText('')
    setReplyingTo(null)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-warning fill-warning' : 'text-muted'}`}
      />
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Star className="h-5 w-5" />
          Course Reviews ({total})
        </h2>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {review.student_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.student_name || 'Student'}</span>
                      <div className="flex items-center">{renderStars(review.rating)}</div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(review.created_at).toLocaleDateString()}
                      {review.course_title && ` • ${review.course_title}`}
                    </p>
                    {review.comment && (
                      <p className="text-sm mt-2">{review.comment}</p>
                    )}
                  </div>
                </div>
              </div>

              {review.lecturer_reply ? (
                <div className="mt-4 ml-13 pl-4 border-l-2 border-primary/30 bg-primary/5 p-3 rounded-r-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <CheckCircle className="h-4 w-4" />
                    Your Reply
                  </div>
                  <p className="text-sm mt-1">{review.lecturer_reply}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {review.replied_at && new Date(review.replied_at).toLocaleDateString()}
                  </p>
                </div>
              ) : replyingTo === review.id ? (
                <div className="mt-4 ml-13 space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => handleReply(review.id)} disabled={!replyText.trim()}>
                      Post Reply
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 ml-13">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<MessageCircle className="h-4 w-4" />}
                    onClick={() => setReplyingTo(review.id)}
                  >
                    Reply to Review
                  </Button>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
            <p className="text-muted-foreground">Students haven't reviewed this course yet</p>
          </div>
        )}
      </div>
    </div>
  )
}