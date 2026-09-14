/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DiscussionPanel } from '../courses/DiscussionPanel'
import { discussionsApi } from '../../services/api'

vi.mock('../../services/api', () => ({
  discussionsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upvote: vi.fn(),
    pin: vi.fn(),
    markAsAnswer: vi.fn(),
  },
}))

describe('DiscussionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly when API returns a plain array (reproducing backend response without crashing)', async () => {
    vi.mocked(discussionsApi.list).mockResolvedValue({
      data: [
        {
          id: 'd1',
          lesson_id: 'lesson-1',
          user_id: 'u1',
          user_name: 'Nguyen Van A',
          user_avatar: null,
          parent_id: null,
          content: 'Thảo luận về RAG Architecture',
          is_pinned: false,
          is_answer: false,
          upvotes: 3,
          reply_count: 1,
          created_at: '2026-09-14T10:00:00Z',
          updated_at: '2026-09-14T10:00:00Z',
          replies: [
            {
              id: 'r1',
              lesson_id: 'lesson-1',
              user_id: 'u2',
              user_name: 'Tran Van B',
              user_avatar: null,
              parent_id: 'd1',
              content: 'Đồng ý với quan điểm này',
              is_pinned: false,
              is_answer: false,
              upvotes: 1,
              reply_count: 0,
              created_at: '2026-09-14T10:05:00Z',
              updated_at: '2026-09-14T10:05:00Z',
              replies: [],
            },
          ],
        },
      ],
    } as any)

    render(<DiscussionPanel lessonId="lesson-1" />)

    await waitFor(() => {
      expect(screen.getByText('Thảo luận về RAG Architecture')).toBeInTheDocument()
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
      expect(screen.getByText('1 phản hồi')).toBeInTheDocument()
    })
  })

  it('renders empty message when API returns an empty array [] without throwing undefined length error', async () => {
    vi.mocked(discussionsApi.list).mockResolvedValue({
      data: [],
    } as any)

    render(<DiscussionPanel lessonId="lesson-1" />)

    await waitFor(() => {
      expect(screen.getByText('Chưa có thảo luận nào. Hãy là người đầu tiên đặt câu hỏi!')).toBeInTheDocument()
    })
  })

  it('handles { items: [], total: 0 } format gracefully', async () => {
    vi.mocked(discussionsApi.list).mockResolvedValue({
      data: { items: [], total: 0 },
    } as any)

    render(<DiscussionPanel lessonId="lesson-1" />)

    await waitFor(() => {
      expect(screen.getByText('Chưa có thảo luận nào. Hãy là người đầu tiên đặt câu hỏi!')).toBeInTheDocument()
    })
  })

  it('handles API error without crashing the component', async () => {
    vi.mocked(discussionsApi.list).mockRejectedValue(new Error('Network error'))

    render(<DiscussionPanel lessonId="lesson-1" />)

    await waitFor(() => {
      expect(screen.getByText('Chưa có thảo luận nào. Hãy là người đầu tiên đặt câu hỏi!')).toBeInTheDocument()
    })
  })
})
