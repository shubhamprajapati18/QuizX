import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import { LandingPage } from './pages/LandingPage';
import { FacultyLogin } from './pages/auth/FacultyLogin';
import { FacultyRegister } from './pages/auth/FacultyRegister';
import { DashboardHome } from './pages/faculty/DashboardHome';
import { MyQuizzes } from './pages/faculty/MyQuizzes';
import { CreateQuiz } from './pages/faculty/CreateQuiz';
import { QuizPreview } from './pages/faculty/QuizPreview';
import { QuizShare } from './pages/faculty/QuizShare';
import { ResultsList } from './pages/faculty/ResultsList';
import { SubmissionDetail } from './pages/faculty/SubmissionDetail';
import { QuizAnalytics } from './pages/faculty/QuizAnalytics';
import { ProfileSettings } from './pages/faculty/ProfileSettings';
import { StudentQuizLanding } from './pages/student/StudentQuizLanding';
import { StudentQuizTake } from './pages/student/StudentQuizTake';
import { StudentResult } from './pages/student/StudentResult';

import { Loader } from './components/ui/Loader';

// Protected Route Component for Faculty Workspace
const ProtectedFacultyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader.Page message="Authenticating Workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Auth Route Component (redirects to /dashboard if logged in)
const PublicAuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader.Page message="Initializing QuizX..." />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Faculty Auth */}
          <Route path="/login" element={<PublicAuthRoute><FacultyLogin /></PublicAuthRoute>} />
          <Route path="/register" element={<PublicAuthRoute><FacultyRegister /></PublicAuthRoute>} />

          {/* Protected Faculty Workspace */}
          <Route path="/dashboard" element={<ProtectedFacultyRoute><DashboardHome /></ProtectedFacultyRoute>} />
          <Route path="/dashboard/quizzes" element={<ProtectedFacultyRoute><MyQuizzes /></ProtectedFacultyRoute>} />
          <Route path="/dashboard/create" element={<ProtectedFacultyRoute><CreateQuiz /></ProtectedFacultyRoute>} />
          <Route path="/dashboard/preview/:id" element={<ProtectedFacultyRoute><QuizPreview /></ProtectedFacultyRoute>} />
          <Route path="/dashboard/share/:id" element={<ProtectedFacultyRoute><QuizShare /></ProtectedFacultyRoute>} />
          <Route path="/dashboard/results" element={<ProtectedFacultyRoute><ResultsList /></ProtectedFacultyRoute>} />
          <Route path="/dashboard/submission/:attemptId" element={<ProtectedFacultyRoute><SubmissionDetail /></ProtectedFacultyRoute>} />
          <Route path="/dashboard/analytics" element={<ProtectedFacultyRoute><QuizAnalytics /></ProtectedFacultyRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedFacultyRoute><ProfileSettings /></ProtectedFacultyRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedFacultyRoute><ProfileSettings /></ProtectedFacultyRoute>} />

          {/* Student Access & Quiz Execution */}
          <Route path="/quiz/:quizCode" element={<StudentQuizLanding />} />
          <Route path="/quiz/take/:attemptId" element={<StudentQuizTake />} />
          <Route path="/quiz/result/:attemptId" element={<StudentResult />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
