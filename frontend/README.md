# QuizX Frontend Application (Vite + React)

This directory contains the user interface and client-side web application for **QuizX**, built with **React 18**, **Vite 6**, **Tailwind CSS**, and **Supabase JS Client**.

---

## 🛠 Installed Packages & Technical Role

| Package Name | Version | Role in QuizX |
| :--- | :--- | :--- |
| `react` | `^18.3.1` | Core UI library for component state, hooks, and virtual DOM rendering. |
| `react-dom` | `^18.3.1` | Web DOM renderer for React. |
| `react-router-dom` | `^6.28.1` | Single Page Application (SPA) routing (`/dashboard`, `/quiz/:quizCode`, `/quiz/result/:attemptId`). |
| `@supabase/supabase-js` | `^2.48.1` | Supabase database client for direct PostgreSQL operations, real-time sync, and queries. |
| `bcryptjs` | `^2.4.3` | Password hashing algorithm for faculty auth validation. |
| `lucide-react` | `^0.469.0` | Vector icon suite powering dashboard and exam UI elements. |
| `canvas-confetti` | `^1.9.4` | Physics particle confetti burst on student exam pass. |
| `qrcode.react` | `^4.2.0` | Dynamic SVG QR code generator for student exam links. |
| `mammoth` | `^1.8.0` | Client-side Word (`.docx`) document parser converting text/tables to structured questions. |
| `pdfjs-dist` | `^3.11.174` | Mozilla PDF.js parser for client-side PDF document line extraction. |
| `vite` | `^6.0.5` | Next-generation build tool & dev server with Fast Refresh. |
| `tailwindcss` | `^3.4.17` | Utility-first CSS styling engine. |

---

## 📁 Directory Architecture

```
frontend/src/
├── assets/             # Static brand assets and logo components
├── components/
│   ├── layout/         # Sidebar, FacultyHeader, PublicNavbar, FacultyLayout
│   └── ui/             # Reusable UI library (Card, Button, Badge, Modal, Tabs, Input, Progress, Skeleton)
├── context/
│   └── AuthContext.jsx # Global faculty authentication & session manager
├── pages/
│   ├── LandingPage.jsx         # Public homepage with code entry modal
│   ├── auth/                   # Faculty Login & Register pages
│   ├── faculty/                # Dashboard Overview, My Quizzes, Quiz Builder, Preview, Share, Results, Analytics, Profile
│   └── student/                # Student Landing, Exam Workspace (Take), Exam Results
├── services/
│   ├── api.js          # Centralized API service object interfacing with Supabase
│   └── supabase.js     # Supabase client instantiation
└── utils/
    └── documentParser.js # Intelligent PDF/DOCX question paper extraction parser
```

---

## ⚡ Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

---

© 2026 QuizX Frontend Workspace.
