# QuizX — Multi-Faculty Online Quiz Platform

QuizX is a full-featured, multi-faculty online quiz and assessment platform built with **React (Vite)**, **Tailwind CSS**, **Node.js + Express.js**, and **Supabase (PostgreSQL)**.

It empowers teachers, educators, trainers, and academic institutions to independently register, create, manage, share, and evaluate online quizzes.

---

## 🌟 Architectural Principle

> **"One Platform → Many Faculty → Many Quizzes → Many Participants"**

- **Independent Faculty Workspaces**: Every registered faculty member gets an isolated workspace. Faculty A can only access Faculty A's quizzes, questions, student attempts, and analytics.
- **Frictionless Student Access**: Students do not need to register on the platform. They join directly using a shareable Quiz Link (`/quiz/7XK29P`) or a 6-character Quiz Code (`7XK29P`).
- **Server-Enforced Timers**: Official exam duration is computed and controlled by the backend server, preventing client clock tampering.
- **Progressive Answer Auto-Saving**: Student choices are saved immediately as they answer questions, safeguarding their progress against network drops.
- **Flexible Result Visibility**: Faculty can choose to release scores immediately, release correct answers, or delay scores for formal institutional exams.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React.js (Vite) |
| **Styling & Design System** | Tailwind CSS + Lucide Icons + Custom Educational Theme |
| **Backend Framework** | Node.js + Express.js REST API |
| **Database & Auth** | Supabase (PostgreSQL + JWT Authentication) |
| **Document Parser** | `pdf-parse` & `mammoth` (PDF / DOC / DOCX MCQ Extraction) |

---

## 🗄️ Complete Supabase SQL Queries (`supabase/schema.sql`)

Run the following SQL script in your **Supabase SQL Editor** (`Dashboard -> SQL Editor -> New Query`) to set up all required database tables, indexes, constraints, and triggers:

```sql
-- QuizX Database Schema for Supabase PostgreSQL
-- Run this script in the Supabase SQL Editor to initialize all tables.

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FACULTIES TABLE
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    department VARCHAR(255),
    role VARCHAR(50) DEFAULT 'faculty',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_code VARCHAR(50) UNIQUE NOT NULL,
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    duration_minutes INT DEFAULT 30,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    max_attempts INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'live', 'completed', 'closed', 'archived'
    is_published BOOLEAN DEFAULT FALSE,
    access_code VARCHAR(50),
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_options BOOLEAN DEFAULT FALSE,
    show_score_immediately BOOLEAN DEFAULT TRUE,
    show_correct_answers BOOLEAN DEFAULT TRUE,
    required_fields JSONB DEFAULT '["name", "roll_number", "department"]'::jsonb,
    total_marks INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'mcq',
    options JSONB NOT NULL, -- Array of {id, text}
    correct_answer VARCHAR(255) NOT NULL,
    marks INT DEFAULT 1,
    order_index INT DEFAULT 0,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    participant_name VARCHAR(255) NOT NULL,
    participant_email VARCHAR(255),
    roll_number VARCHAR(100),
    department VARCHAR(255),
    year VARCHAR(50),
    college VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'submitted', 'timed_out'
    total_score NUMERIC(5,2) DEFAULT 0,
    max_score NUMERIC(5,2) DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ANSWERS TABLE
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(255),
    is_correct BOOLEAN DEFAULT FALSE,
    marks_awarded NUMERIC(5,2) DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
);

-- INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_quizzes_faculty_id ON quizzes(faculty_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_code ON quizzes(quiz_code);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON answers(attempt_id);

-- AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_faculties_updated_at ON faculties;
CREATE TRIGGER set_faculties_updated_at
    BEFORE UPDATE ON faculties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_quizzes_updated_at ON quizzes;
CREATE TRIGGER set_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 🚀 Installation & Setup Guide

### 1. Backend Setup (`/backend`)
```bash
cd backend
npm install
node server.js
```
The backend API server will run on `http://localhost:5000`.

### 2. Frontend Setup (`/frontend`)
```bash
cd frontend
npm install
npm run dev
```
The frontend Vite server will run on `http://localhost:5173`.

---

## 📡 Core API Endpoint Reference

### Faculty Authentication
- `POST /api/auth/register` — Create new faculty account
- `POST /api/auth/login` — Authenticate faculty & return JWT token
- `GET /api/auth/profile` — Fetch current faculty profile
- `PUT /api/auth/profile` — Update faculty profile & password

### Quiz Management (Faculty Auth Required)
- `GET /api/quizzes/dashboard-stats` — Fetch KPI statistics for faculty workspace
- `GET /api/quizzes` — List all quizzes owned by authenticated faculty (supports status & search filters)
- `GET /api/quizzes/:id` — Fetch quiz details & question paper
- `POST /api/quizzes` — Create new quiz (manual or imported questions)
- `PUT /api/quizzes/:id` — Update quiz settings & questions
- `POST /api/quizzes/:id/duplicate` — Duplicate existing quiz into a new draft quiz
- `PATCH /api/quizzes/:id/publish` — Toggle quiz status (`live`, `closed`, `draft`)
- `DELETE /api/quizzes/:id` — Delete quiz & associated responses

### Document Import
- `POST /api/import/upload` — Upload PDF/DOCX test paper file to extract MCQs automatically

### Student Exam Execution (Public Access)
- `GET /api/quizzes/public/code/:quizCode` — Fetch public quiz info (Without correct answers!)
- `POST /api/attempts/start` — Start quiz attempt & record official server timestamp
- `POST /api/attempts/:attemptId/save-response` — Progressive auto-save student response
- `POST /api/attempts/:attemptId/submit` — Final submission & backend auto-evaluation
- `GET /api/attempts/:attemptId/result` — Fetch student result (respecting faculty visibility rules)

### Faculty Results & Analytics
- `GET /api/results` — Fetch student submission records with filters (quiz, department, search)
- `GET /api/results/submission/:attemptId` — Detailed question-by-question response inspector
- `GET /api/results/analytics/:quizId` — Comprehensive item difficulty analysis & option distribution charts

---

## 🎯 Key Application Workflows

1. **Faculty Onboarding**: Educator signs up, receives private dashboard, and builds quizzes independently.
2. **Quiz Builder**: Manual Google Forms style builder or automated PDF/DOCX upload.
3. **Sharing**: Generates unique Quiz Link (`/quiz/7XK29P`) & Passcode (`7XK29P`), printable QR code, and WhatsApp share buttons.
4. **Student Quiz Taking**: Student enters required details, takes exam under server countdown timer with auto-saving answers.
5. **Grading & Analytics**: Automatic evaluation with question difficulty heatmaps and detailed submission breakdown.

---

© 2026 QuizX Multi-Faculty Platform. Designed for Education and Assessment.
