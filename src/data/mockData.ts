import type { ChatSession, DocumentItem, Flashcard, Notification, QuizQuestion, QuotaInfo, UserProfile } from '../types'

export const userProfile: UserProfile = {
  name: 'Minh Nguyen',
  role: 'Student',
  initials: 'MN'
}

export const quota: QuotaInfo = {
  storageUsed: 2,
  storageTotal: 5,
  tokensUsed: 10000,
  tokensTotal: 50000
}

export const notifications: Notification[] = [
  {
    id: 'n1',
    title: 'Document processing complete',
    detail: 'AI_Basics.pdf is ready to chat',
    time: '2m ago'
  },
  {
    id: 'n2',
    title: 'Quiz generated',
    detail: 'Neural Networks quiz is available',
    time: '1h ago'
  }
]

export const documents: DocumentItem[] = [
  {
    id: 'd1',
    name: 'AI_Basics.pdf',
    type: 'pdf',
    status: 'ready',
    size: '2.5MB',
    pageCount: 42
  },
  {
    id: 'd2',
    name: 'ML_Overview.mp4',
    type: 'video',
    status: 'processing',
    progress: 68,
    size: '120MB'
  },
  {
    id: 'd3',
    name: 'Audio_Lecture.mp3',
    type: 'audio',
    status: 'failed',
    size: '48MB'
  }
]

export const chatSessions: ChatSession[] = [
  {
    id: 'c1',
    title: 'Backpropagation basics',
    preview: 'Explain the chain rule again...',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Machine learning khác gì deep learning?',
        timestamp: '09:42'
      },
      {
        id: 'm2',
        role: 'assistant',
        content:
          'Machine learning là tập con của AI, còn deep learning là một nhánh của machine learning sử dụng mạng nơ-ron sâu với nhiều layer để học các biểu diễn phức tạp của dữ liệu.',
        timestamp: '09:43',
        citations: [
          { id: 'c1', label: '[1] AI_Basics.pdf - Trang 12' },
          { id: 'c2', label: '[2] ML_Overview.mp4 - 01:25-01:40' }
        ]
      }
    ]
  },
  {
    id: 'c2',
    title: 'Course recap',
    preview: 'Summarize lecture 5',
    messages: []
  }
]

export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is the primary goal of machine learning?',
    options: [
      'To hard-code rules',
      'To learn patterns from data',
      'To store data efficiently',
      'To compress files'
    ],
    correctIndex: 1
  },
  {
    id: 'q2',
    question: 'Which algorithm is commonly used for classification?',
    options: ['Linear Regression', 'K-Means', 'Random Forest', 'PCA'],
    correctIndex: 2
  },
  {
    id: 'q3',
    question: 'What does "overfitting" mean?',
    options: [
      'Model performs well on all data',
      'Model memorizes training data but fails on new data',
      'Model is too simple',
      'Model trains too slowly'
    ],
    correctIndex: 1
  },
  {
    id: 'q4',
    question: 'What is a neural network?',
    options: [
      'A type of database',
      'A network of computers',
      'A computational model inspired by the brain',
      'A sorting algorithm'
    ],
    correctIndex: 2
  },
  {
    id: 'q5',
    question: 'What is the purpose of a validation set?',
    options: [
      'To train the model',
      'To test final performance',
      'To tune hyperparameters without overfitting',
      'To store unused data'
    ],
    correctIndex: 2
  }
]

export const mockFlashcards: Flashcard[] = [
  { id: 'f1', front: 'What is Machine Learning?', back: 'A subset of AI that enables systems to learn and improve from data without being explicitly programmed.' },
  { id: 'f2', front: 'What is Supervised Learning?', back: 'Learning from labeled training data to make predictions on new data.' },
  { id: 'f3', front: 'What is Overfitting?', back: 'When a model learns noise in training data and performs poorly on unseen data.' },
  { id: 'f4', front: 'What is Gradient Descent?', back: 'An optimization algorithm that iteratively adjusts parameters to minimize a loss function.' },
  { id: 'f5', front: 'What is Backpropagation?', back: 'An algorithm for training neural networks by computing gradients of the loss with respect to each weight.' },
  { id: 'f6', front: 'What is a Hyperparameter?', back: 'A parameter set before training that controls the learning process (e.g., learning rate, batch size).' },
  { id: 'f7', front: 'What is Transfer Learning?', back: 'Reusing a pre-trained model on a new but related task.' },
  { id: 'f8', front: 'What is a Confusion Matrix?', back: 'A table that describes the performance of a classification model by comparing predicted vs actual labels.' }
]
