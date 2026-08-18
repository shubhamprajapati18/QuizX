# QuizX — Multi-Faculty Online Quiz & Exam Assessment Platform

*Live Project* [QuizX](https://quizxbit.netlify.app/)

**QuizX** is an enterprise-grade, multi-faculty online quiz and assessment platform engineered with **React.js (Vite)**, **Tailwind CSS**, **Supabase (PostgreSQL)**, and **Node.js/Express**.

It provides an end-to-end ecosystem for educators, universities, trainers, and academic departments to create, manage, distribute, evaluate, and analyze online multiple-choice examinations seamlessly.

---

## 📋 Table of Contents
1. [Architectural Principle](#-architectural-principle)
2. [Technology Stack & Packages Breakdown](#-technology-stack--packages-breakdown)
   - [Frontend Dependencies](#frontend-dependencies)
   - [Frontend Developer Tools](#frontend-developer-tools)
   - [Backend Dependencies](#backend-dependencies)
3. [System Architecture & Core Workflows](#-system-architecture--core-workflows)
   - [1. Multi-Faculty Isolation & Auth Workflow](#1-multi-faculty-isolation--auth-workflow)
   - [2. Intelligent Question Paper Import & Parsing Pipeline](#2-intelligent-question-paper-import--parsing-pipeline)
   - [3. Quiz Creation & Access Control Engine](#3-quiz-creation--access-control-engine)
   - [4. Student Exam Workspace & Anti-Cheating Timer](#4-student-exam-workspace--anti-cheating-timer)
   - [5. Evaluation Engine & Results Release](#5-evaluation-engine--results-release)
   - [6. Item Analysis & Faculty Analytics](#6-item-analysis--faculty-analytics)
4. [Database Schema & Entity Relationship Model](#-database-schema--entity-relationship-model)
5. [Installation & Project Setup](#-installation--project-setup)
6. [API Endpoint Reference](#-api-endpoint-reference)

---

## 🌟 Architectural Principle

```
+-----------------------------------------------------------------------+
|                             QUIZX SYSTEM                              |
+-----------------------------------------------------------------------+
       |                                                 |
       v                                                 v
+-----------------------+                       +-----------------------+
|  FACULTY WORKSPACE A  |                       |  FACULTY WORKSPACE B  |
|  (Isolated Session)   |                       |  (Isolated Session)   |
+-----------------------+                       +-----------------------+
       |                                                 |
       +-------------------+                             +-------------------+
       |                   |                             |                   |
       v                   v                             v                   v
+--------------+   +--------------+               +--------------+   +--------------+
| Quiz Code 1  |   | Quiz Code 2  |               | Quiz Code 3  |   | Quiz Code 4  |
+--------------+   +--------------+               +--------------+   +--------------+
       |                   |                             |                   |
       v                   v                             v                   v
[ Students Join ]  [ Students Join ]             [ Students Join ]  [ Students Join ]
 (No Signup Reqd)   (No Signup Reqd)              (No Signup Reqd)   (No Signup Reqd)
```

- **Isolated Multi-Faculty Workspaces**: Every faculty member receives an isolated workspace. Faculty accounts can only query, edit, and analyze quizzes, attempts, and analytics belonging to their `faculty_id`.
- **Frictionless Student Access**: Students do not need account registration or login. They access exams directly using a 6-character Quiz Code (e.g. `7XK29P`) or direct URL (`/quiz/7XK29P`).
- **Server-Enforced Countdown Timers**: Exam deadlines are calculated on the server using `start_time` and `duration_minutes` (`startTime + allowedDurationMs`), rendering server-synced countdown timers impervious to client machine clock manipulation.
- **Progressive Answer Auto-Save & Offline Sync**: Student answers are auto-saved in real time (`api.attempts.saveResponse`). If internet connectivity drops, answers queue locally in `localStorage` and sync automatically upon reconnection.
- **Configurable Score Release Controls**: Faculty can configure whether scores and correct answer keys are released immediately after submission or withheld for formal grading.

---

## 🛠️ Technology Stack & Packages Breakdown

### Frontend Dependencies (`frontend/package.json`)

| Package | Version | Purpose & Technicality |
| :--- | :--- | :--- |
| **`react`** | `^18.3.1` | Core UI library powering component-driven rendering, state hooks (`useState`, `useEffect`, `useCallback`), and virtual DOM updates. |
| **`react-dom`** | `^18.3.1` | React DOM renderer providing browser-specific rendering bindings. |
| **`react-router-dom`** | `^6.28.1` | Client-side routing system supporting SPA page navigation (`BrowserRouter`, `Routes`, `Route`, `Navigate`). |
| **`@supabase/supabase-js`** | `^2.48.1` | Official JavaScript client SDK for Supabase PostgreSQL database operations, parameterized queries, and authentication. |
| **`bcryptjs`** | `^2.4.3` | Optimized JavaScript implementation of the Blowfish password hashing algorithm used for secure password hashing and verification. |
| **`lucide-react`** | `^0.469.0` | Comprehensive icon system providing UI icons (`BookOpen`, `Users`, `CheckCircle2`, `BarChart3`, `Clock`, `Lock`, `Globe`, `Upload`, etc.). |
| **`canvas-confetti`** | `^1.9.4` | Physics-based particle animation library that fires celebratory confetti bursts when a student passes an exam. |
| **`qrcode.react`** | `^4.2.0` | SVG-based QR code generator that creates printable and scannable QR codes for direct quiz URL access. |
| **`mammoth`** | `^1.8.0` | Document conversion engine that parses Word (`.docx`/`.doc`) files into HTML/structured text while preserving lists, tables, and option formatting. |
| **`pdfjs-dist`** | `^3.11.174` | Mozilla PDF.js parser library used for client-side PDF document text extraction and Y-coordinate line grouping. |

### Frontend Developer Tools

| Package | Version | Purpose & Technicality |
| :--- | :--- | :--- |
| **`vite`** | `^6.0.5` | Next-generation frontend build tool providing lightning-fast Hot Module Replacement (HMR) and optimized Rollup production bundling. |
| **`@vitejs/plugin-react`** | `^4.3.4` | Vite plugin enabling React Fast Refresh and Babel JSX transformations. |
| **`tailwindcss`** | `^3.4.17` | Utility-first CSS framework providing responsive design classes, dark mode tokens, and custom layout utilities. |
| **`postcss`** | `^8.4.49` | Tool for transforming CSS with JavaScript plugins. |
| **`autoprefixer`** | `^10.4.20` | PostCSS plugin that automatically parses CSS and adds vendor prefixes for browser compatibility. |

### Backend Dependencies (`frontend/backend/package.json`)

| Package | Version | Purpose & Technicality |
| :--- | :--- | :--- |
| **`express`** | `^4.21.2` | Fast, unopinionated Node.js web framework handling RESTful API routes. |
| **`cors`** | `^2.8.5` | Express middleware enabling Cross-Origin Resource Sharing for API requests. |
| **`dotenv`** | `^16.4.7` | Loads environment variables from `.env` files into Node `process.env`. |
| **`jsonwebtoken`** | `^9.0.2` | Implements JSON Web Signature (JWS) standard for signing and verifying JWT authentication tokens. |
| **`multer`** | `^1.4.5-lts.1` | Middleware for handling `multipart/form-data`, used for processing document file uploads. |
| **`pdf-parse`** | `^1.1.1` | Node.js PDF text parsing utility. |

---

## ⚙️ System Architecture & Core Workflows

### 1. Multi-Faculty Isolation & Auth Workflow
- **Registration**: Faculty registers with Name, Email, Password, Institution, and Department. The password is hashed using `bcryptjs` before storage in `faculties`.
- **Session Context (`AuthContext`)**: On initial load, `AuthProvider` validates `quizx_faculty_token` via `api.auth.getProfile()`. If valid, user state is populated.
- **Route Guard (`ProtectedFacultyRoute`)**: Protected dashboard routes (`/dashboard/*`) verify `isAuthenticated`. If unauthenticated, users are redirected to `/login`.

### 2. Intelligent Question Paper Import & Parsing Pipeline
- **File Upload (`QuizImport.jsx`)**: Faculty uploads a PDF, DOC, or DOCX question paper file.
- **Document Text Extraction (`utils/documentParser.js`)**:
  - For **PDF**: `pdfjs-dist` extracts text items and groups them into lines based on vertical Y-coordinate proximity (`Math.abs(yA - yB) > 4`).
  - For **DOCX**: `mammoth.convertToHtml` converts Word documents into formatted HTML, followed by `convertMammothHtmlToText` which translates list structures (`<ol>`, `<ul>`, `<li>`) into structured option text (`A)`, `B)`, `C)`).
- **Regex Question Extractor (`parseQuestionsFromText`)**:
  - Matches question headers: `/^(?:(?:Q(?:uestion)?\.?\s*(\d+))|(\d{1,3})[\.\)\:\-])\s*(.*)/i`
  - Matches option headers: `/^(?:Option\s*)?[\(\[]?([A-Da-d1-5])[\.\)\]\-]\s*(.*)/i`
  - Matches inline answer keys (`Answer: B`, `*A)`) or global answer keys at the bottom of the document.
- **Import Session**: Extracted questions populate the `QuizBuilder` workspace for faculty review and editing before publishing.

### 3. Quiz Creation & Access Control Engine
- **Step 1: Question Builder**: Faculty configures questions, option texts, correct answers, individual question marks, and explanations.
- **Step 2: Quiz Parameters & Timing Window**:
  - `duration_minutes`: Exam duration limit (default 30 mins).
  - `start_time` & `end_time`: Scheduled window when the exam accepts student entries.
  - `access_code`: Optional passcode required to unlock the exam.
  - `shuffle_questions` & `shuffle_options`: Toggles for question and option order randomization.
  - `show_score_immediately`: Toggle for instant score display post-submission.
  - `show_correct_answers`: Toggle for exposing answer keys on student result page.

### 4. Student Exam Workspace & Anti-Cheating Timer
- **Student Entry (`StudentQuizLanding.jsx`)**: Student enters Quiz Code (`/quiz/:quizCode`), inputs required identification fields (Name, Roll Number, Department), and optional access passcode.
- **Server Countdown Timer (`StudentQuizTake.jsx`)**:
  - Calculates remaining seconds: `Math.max(0, Math.floor((startTime + allowedDurationMs - Date.now()) / 1000))`.
  - Timer counts down every second. If `timeLeftSeconds <= 0`, auto-submission (`handleFinalSubmit(true)`) triggers immediately.
- **Progressive Auto-Save & Offline Resiliency**:
  - Every option selection invokes `api.attempts.saveResponse`.
  - If offline (`!navigator.onLine`), responses store in `localStorage` under `pending_sync_${attemptId}` and automatically flush to Supabase when network connectivity restores.

### 5. Evaluation Engine & Results Release
- **Auto-Grading (`api.attempts.submit`)**:
  - Server queries official question answer keys (`questions.correct_answer`) and student responses (`answers.selected_option`).
  - Calculates `total_score`, `max_score`, and `percentage`.
  - Updates attempt status to `'submitted'` or `'timed_out'`.
- **Result Release (`StudentResult.jsx`)**:
  - If `show_score_immediately` is `true`, displays score badge, percentage, celebratory particle confetti (for pass >= 50%), and itemized answer breakdown (if `show_correct_answers` is `true`).
  - If `show_score_immediately` is `false`, displays confirmation message indicating scores will be released following faculty review.

### 6. Item Analysis & Faculty Analytics
- **Analytics Dashboard (`QuizAnalytics.jsx`)**:
  - Computes class KPI summary: Total Participants, Completed Attempts, Average Score, Highest Score, and Class Pass Percentage.
  - **Item Accuracy & Difficulty Heatmap**: Calculates question accuracy rates (`accuracy_rate = (correctAnswers / totalAnswered) * 100`). Questions with accuracy < 50% are flagged with a **High Difficulty** warning.
  - **Option Choice Distribution**: Visualizes option selection counts for every choice to highlight common student distractors.

---

## 🗄️ Database Schema & Entity Relationship Model

Run this SQL script in your **Supabase SQL Editor** to initialize all database tables, indexes, and triggers:

```sql
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
    status VARCHAR(50) DEFAULT 'draft',
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
    options JSONB NOT NULL,
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
    status VARCHAR(50) DEFAULT 'in_progress',
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

-- HIGH PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_quizzes_faculty_id ON quizzes(faculty_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_code ON quizzes(quiz_code);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON answers(attempt_id);
```

---

## 🚀 Installation & Project Setup

### Prerequisites
- Node.js `v18.0.0` or higher
- Supabase Project URL & Anon Key

### 1. Environment Configuration (`frontend/.env`)
Create a `.env` file inside `frontend/` directory:
```env
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Frontend Development Server Setup
```bash
cd frontend
npm install
npm run dev
```
The application will launch on `http://localhost:5173`.

### 3. Production Build & Bundle Inspection
```bash
npm run build
npm run preview
```

---

## 📡 API Endpoint Reference

### Faculty Authentication (`api.auth`)
- `POST /api/auth/register` — Register a new faculty account.
- `POST /api/auth/login` — Authenticate faculty and return session credentials.
- `GET /api/auth/profile` — Fetch profile information of current logged-in faculty.
- `PUT /api/auth/profile` — Update faculty profile details or change password.

### Faculty Quiz Management (`api.quizzes`)
- `GET /api/quizzes/dashboard-stats` — Fetch overall KPI metrics for faculty overview.
- `GET /api/quizzes` — Retrieve all quizzes created by faculty (with optional `status` & `search` filters).
- `GET /api/quizzes/:id` — Fetch quiz detail and associated question paper.
- `POST /api/quizzes` — Create new quiz draft or publish live.
- `PUT /api/quizzes/:id` — Update quiz settings and question payload.
- `POST /api/quizzes/:id/duplicate` — Duplicate an existing quiz into a new draft.
- `PATCH /api/quizzes/:id/publish` — Toggle quiz status (`live`, `closed`, `draft`).
- `DELETE /api/quizzes/:id` — Permanently delete a quiz and associated student attempts.

### Document Import (`api.import`)
- `uploadDocument(file)` — Parses uploaded PDF, DOC, or DOCX files and returns structured questions.

### Student Exam Execution (`api.attempts`)
- `getByCodePublic(quizCode)` — Public fetch for quiz title, instructions, and duration (without answer key!).
- `start(payload)` — Start quiz attempt, record start timestamp, and compute remaining timer duration.
- `getActive(attemptId)` — Restore active exam session upon page refresh.
- `saveResponse(attemptId, response)` — Progressive auto-save for question choices.
- `syncBatch(attemptId, batch)` — Flush queued offline responses.
- `submit(attemptId)` — Final submission and server-side auto-grading.
- `getResult(attemptId)` — Retrieve student exam results respecting faculty score release policies.

### Faculty Evaluation & Item Analytics (`api.results`)
- `getAll(filters)` — Retrieve all student submissions across faculty quizzes.
- `getSubmissionDetail(attemptId)` — Inspect individual student submission breakdown.
- `getAnalytics(quizId)` — Fetch class pass rates, question accuracy percentages, and choice distribution counts.

---

© 2026 QuizX Multi-Faculty Platform. Engineered for Assessment and Evaluation.
