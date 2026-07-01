/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import { quizzesApi } from '../services/api'
import type { Quiz, Question, QuizAttempt } from '../services/api'
import { useAppStore } from '../stores/appStore'

export function useQuiz(lessonId: string) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toasts = useAppStore((s) => s.toasts)

  const fetchQuiz = useCallback(async () => {
    if (!lessonId) return
    setLoading(true)
    setError(null)
    try {
      const res = await quizzesApi.get(lessonId)
      setQuiz(res.data)
      if (res.data.questions) {
        setQuestions(res.data.questions)
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Failed to fetch quiz')
      }
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  const createQuiz = useCallback(async (data: {
    title: string
    description?: string
    passing_score?: number
    duration_mins?: number
    max_attempts?: number
  }) => {
    try {
      const res = await quizzesApi.create(lessonId, data)
      setQuiz(res.data)
      toasts.add({ type: 'success', title: 'Quiz created' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to create quiz' })
      throw err
    }
  }, [lessonId, toasts])

  const updateQuiz = useCallback(async (data: {
    title?: string
    description?: string
    passing_score?: number
    duration_mins?: number
    max_attempts?: number
    is_active?: boolean
  }) => {
    try {
      const res = await quizzesApi.update(lessonId, data)
      setQuiz(res.data)
      toasts.add({ type: 'success', title: 'Quiz updated' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to update quiz' })
      throw err
    }
  }, [lessonId, toasts])

  const deleteQuiz = useCallback(async () => {
    if (!quiz) return
    try {
      await quizzesApi.delete(quiz.id)
      setQuiz(null)
      setQuestions([])
      toasts.add({ type: 'success', title: 'Quiz deleted' })
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to delete quiz' })
      throw err
    }
  }, [quiz, toasts])

  const addQuestion = useCallback(async (data: {
    question_text: string
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK'
    points?: number
    explanation?: string
    order_index?: number
    answers: { answer_text: string; is_correct: boolean }[]
  }) => {
    if (!quiz) return
    try {
      const res = await quizzesApi.addQuestion(quiz.id, data)
      setQuestions(prev => [...prev, res.data])
      toasts.add({ type: 'success', title: 'Question added' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to add question' })
      throw err
    }
  }, [quiz, toasts])

  const updateQuestion = useCallback(async (questionId: string, data: {
    question_text?: string
    type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK'
    points?: number
    explanation?: string
  }) => {
    try {
      const res = await quizzesApi.updateQuestion(questionId, data)
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...res.data } : q))
      toasts.add({ type: 'success', title: 'Question updated' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to update question' })
      throw err
    }
  }, [toasts])

  const deleteQuestion = useCallback(async (questionId: string) => {
    if (!quiz) return
    try {
      await quizzesApi.deleteQuestion(questionId)
      setQuestions(prev => prev.filter(q => q.id !== questionId))
      toasts.add({ type: 'success', title: 'Question deleted' })
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to delete question' })
      throw err
    }
  }, [quiz, toasts])

  const updateAnswers = useCallback(async (questionId: string, answers: { id?: string; answer_text: string; is_correct: boolean }[]) => {
    try {
      const res = await quizzesApi.updateAnswers(questionId, answers)
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answers: res.data } : q))
      toasts.add({ type: 'success', title: 'Answers updated' })
      return res.data
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to update answers' })
      throw err
    }
  }, [toasts])

  const reorderQuestions = useCallback(async (questionIds: string[]) => {
    if (!quiz) return
    try {
      await quizzesApi.reorderQuestions(quiz.id, questionIds)
    } catch (err: any) {
      toasts.add({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to reorder questions' })
      throw err
    }
  }, [quiz, toasts])

  return {
    quiz,
    questions,
    loading,
    error,
    fetchQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    updateAnswers,
    reorderQuestions,
  }
}

export function useQuizAttempts(quizId: string) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAttempts = useCallback(async () => {
    if (!quizId) return
    setLoading(true)
    try {
      const res = await quizzesApi.getAttempts(quizId)
      setAttempts(res.data)
    } catch (err) {
      console.error('Failed to fetch attempts:', err)
    } finally {
      setLoading(false)
    }
  }, [quizId])

  return { attempts, loading, fetchAttempts }
}