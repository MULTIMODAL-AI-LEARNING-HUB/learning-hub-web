import type { StateCreator } from 'zustand'
import type { AppState, StudySlice } from '../types'

export const createStudySlice: StateCreator<AppState, [['zustand/devtools', never]], [], StudySlice> = (set) => ({
  study: {
    activeTool: null,
    setActiveTool: (tool) => set((state) => ({
      study: { ...state.study, activeTool: tool }
    }), false, 'study/setActiveTool'),
    quizQuestions: [],
    setQuizQuestions: (q) => set((state) => ({
      study: { ...state.study, quizQuestions: q }
    }), false, 'study/setQuizQuestions'),
    flashcards: [],
    setFlashcards: (f) => set((state) => ({
      study: { ...state.study, flashcards: f }
    }), false, 'study/setFlashcards')
  }
})
