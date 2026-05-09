# learning-hub-web

Frontend Application for the Multimodal AI Learning Hub. React-based user interface.

## Overview

This repository contains the frontend application with:
- User authentication (login/register)
- Document management (upload, list, view)
- Chat interface with streaming responses
- Study tools (quiz, flashcards, essay grading)
- Responsive design with Tailwind CSS

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| HTTP | Axios |
| Routing | React Router v6 |

## Directory Structure

```
learning-hub-web/
├── src/
│   ├── components/
│   │   ├── common/          # Button, Input, Modal
│   │   ├── layout/           # Header, Sidebar
│   │   ├── documents/        # Upload, List, Viewer
│   │   ├── chat/             # ChatPanel, Message
│   │   └── study/            # Quiz, Flashcards, Essay
│   ├── pages/
│   │   ├── Auth/             # Login, Register
│   │   ├── Dashboard/        # Main dashboard
│   │   ├── Documents/        # Document hub
│   │   └── Chat/             # Chat interface
│   ├── services/             # API calls
│   ├── stores/               # Zustand stores
│   ├── types/                # TypeScript types
│   └── utils/                # Helpers
├── public/
├── tests/
├── docs/
├── Dockerfile
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User login |
| Register | `/register` | User registration |
| Dashboard | `/` | Main dashboard |
| Documents | `/documents` | Document list & upload |
| Chat | `/chat` | Chat interface |
| Chat Session | `/chat/:id` | Specific chat |
| Study Quiz | `/study/quiz` | Quiz list & taking |
| Study Flashcards | `/study/flashcards` | Flashcard review |
| Study Essay | `/study/essay` | Essay grading |

## API Service

```typescript
// src/services/api.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Components

| Component | Description |
|-----------|-------------|
| `Header` | Top navigation bar |
| `Sidebar` | Document list, navigation |
| `DocumentUpload` | Drag & drop upload |
| `DocumentList` | List of user's documents |
| `ChatPanel` | Chat interface with messages |
| `MessageBubble` | Individual message |
| `QuizCard` | Quiz question display |
| `Flashcard` | Flip card for review |

## Related Documentation

- [Main Docs](../README.md) - System overview
- [UI Design](../5-ui/) - Wireframes and components
- [API Reference](../2-api/) - Full API documentation