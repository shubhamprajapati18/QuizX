import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { Logo } from '../../components/ui/Logo';
import { api } from '../../services/api';
import { KeyRound, ArrowRight, Lock, Home } from 'lucide-react';

export const StudentQuizLanding = () => {
  const pathParts = window.location.pathname.split('/');
  const quizCode = pathParts[pathParts.length - 1];

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const [studentInfo, setStudentInfo] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: '',
    year: '',
    college: '',
    accessCode: ''
  });

  useEffect(() => {
    async function loadPublicQuiz() {
      try {
        const res = await api.quizzes.getByCodePublic(quizCode);
        if (res.success && res.quiz) {
          setQuiz(res.quiz);
        } else {
          setError('Quiz not found or code is invalid.');
        }
      } catch (err) {
        setError(err.message || 'Unable to load quiz details.');
      } finally {
        setLoading(false);
      }
    }
    loadPublicQuiz();
  }, [quizCode]);

  const handleChange = (e) => {
    setStudentInfo({ ...studentInfo, [e.target.name]: e.target.value });
  };

  const handleStartQuiz = async (e) => {
    e.preventDefault();
    setError('');

    if (!studentInfo.name.trim()) {
      setError('Please provide your Full Name.');
      return;
    }

    if (quiz.has_access_code && !studentInfo.accessCode.trim()) {
      setError('Quiz Access Passcode is required.');
      return;
    }

    setStarting(true);
    try {
      const res = await api.attempts.start({
        quizId: quiz.id,
        accessCode: studentInfo.accessCode,
        name: studentInfo.name,
        email: studentInfo.email,
        rollNumber: studentInfo.rollNumber,
        department: studentInfo.department,
        year: studentInfo.year,
        college: studentInfo.college
      });

      if (res.success && res.attempt) {
        localStorage.setItem(`attempt_cache_${res.attempt.id}`, JSON.stringify({
          attempt: res.attempt,
          questions: res.questions
        }));
        window.location.href = `/quiz/take/${res.attempt.id}`;
      } else {
        setError(res.message || 'Failed to start quiz attempt.');
      }
    } catch (err) {
      setError(err.message || 'Failed to start quiz attempt.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Skeleton className="h-96 w-full max-w-xl" />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full border-zinc-200">
          <Alert type="error" className="mb-4">{error}</Alert>
          <a href="/">
            <Button variant="outline">Return Home</Button>
          </a>
        </Card>
      </div>
    );
  }

  const now = Date.now();
  const isEnded = quiz?.end_time && new Date(quiz.end_time).getTime() < now;
  const isNotStartedYet = quiz?.start_time && (new Date(quiz.start_time).getTime() - now > 120000);
  const isStatusClosed = quiz?.status === 'closed' || quiz?.status === 'archived' || quiz?.status === 'draft' || !quiz?.is_published;

  const isClosed = isStatusClosed || isEnded;
  const isNotAccepting = isClosed || isNotStartedYet;

  if (quiz && isNotAccepting) {
    const statusMessage = isNotStartedYet
      ? `This quiz has not started yet. It is scheduled to open at ${new Date(quiz.start_time).toLocaleString()}.`
      : 'This quiz has been closed or is not accepting responses at this time.';

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
        {/* Distraction-Free Header */}
        <header className="h-16 border-b border-zinc-200 bg-white px-4 sm:px-6 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <Logo size="md" />
          </a>
          <Badge variant="draft" className="font-mono flex items-center gap-1">
            <Lock className="w-3 h-3" /> {isNotStartedYet ? 'SCHEDULED' : 'QUIZ CLOSED'}
          </Badge>
        </header>

        {/* Closed Quiz Details View */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4 sm:my-8">
          <div className="w-full max-w-xl space-y-6">
            <Card className="p-6 sm:p-8 shadow-xs border-zinc-200">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center mx-auto mb-3 text-zinc-700">
                  <Lock className="w-6 h-6" />
                </div>
                <Badge variant="draft" className="mb-2 font-mono">CODE: {quiz.quiz_code}</Badge>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{quiz.title}</h1>
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                  Educator: <strong className="text-zinc-900">{quiz.creator_name}</strong> • {quiz.institution}
                </p>
              </div>

              {/* Status Alert */}
              <Alert type="warning" className="mb-6 flex items-start gap-2">
                <div>
                  <strong className="block font-bold text-xs uppercase tracking-wider mb-0.5">
                    {isNotStartedYet ? 'Quiz Not Started' : 'Quiz Closed'}
                  </strong>
                  <span>{statusMessage}</span>
                </div>
              </Alert>

              {/* Quiz Meta Matrix */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-center mb-6 font-mono">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Questions</span>
                  <span className="text-base sm:text-lg font-extrabold text-zinc-900">{quiz.question_count}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Duration</span>
                  <span className="text-base sm:text-lg font-extrabold text-zinc-900">{quiz.duration_minutes}m</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Marks</span>
                  <span className="text-base sm:text-lg font-extrabold text-zinc-900">{quiz.total_marks}</span>
                </div>
              </div>

              {/* Timing Information */}
              {(quiz.start_time || quiz.end_time) && (
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 mb-6 text-xs text-zinc-600 font-mono space-y-1">
                  {quiz.start_time && (
                    <div className="flex justify-between">
                      <span className="font-bold text-zinc-700">Start Time:</span>
                      <span>{new Date(quiz.start_time).toLocaleString()}</span>
                    </div>
                  )}
                  {quiz.end_time && (
                    <div className="flex justify-between">
                      <span className="font-bold text-zinc-700">End Time:</span>
                      <span>{new Date(quiz.end_time).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {quiz.description && (
                <div className="p-4 rounded-lg bg-zinc-100 border border-zinc-300 mb-6 text-xs text-zinc-800 leading-relaxed font-mono">
                  <strong className="block mb-1 text-zinc-900 font-bold uppercase">Quiz Description:</strong>
                  <p className="whitespace-pre-line">{quiz.description}</p>
                </div>
              )}

              {quiz.instructions && (
                <div className="p-4 rounded-lg bg-zinc-100 border border-zinc-300 mb-6 text-xs text-zinc-800 leading-relaxed font-mono">
                  <strong className="block mb-1 text-zinc-900 font-bold uppercase">Exam Instructions:</strong>
                  <p className="whitespace-pre-line">{quiz.instructions}</p>
                </div>
              )}

              <div className="pt-2">
                <a href="/">
                  <Button variant="outline" className="w-full py-3 text-sm font-bold" icon={Home}>
                    Return to Homepage
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const reqFields = quiz.required_fields || ['name', 'roll_number', 'department'];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      {/* Distraction-Free Header */}
      <header className="h-16 border-b border-zinc-200 bg-white px-4 sm:px-6 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <Logo size="md" />
        </a>
        <Badge variant="live">EXAM MODE ACTIVE</Badge>
      </header>

      {/* Main Form Box */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4 sm:my-8">
        <div className="w-full max-w-xl space-y-6">
          {/* Quiz Meta Card */}
          <Card className="p-6 sm:p-8 shadow-xs border-zinc-200">
            <div className="text-center mb-6">
              <Badge variant="draft" className="mb-2 font-mono">CODE: {quiz.quiz_code}</Badge>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{quiz.title}</h1>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                Educator: <strong className="text-zinc-900">{quiz.creator_name}</strong> • {quiz.institution}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-center mb-6 font-mono">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Questions</span>
                <span className="text-base sm:text-lg font-extrabold text-zinc-900">{quiz.question_count}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Duration</span>
                <span className="text-base sm:text-lg font-extrabold text-zinc-900">{quiz.duration_minutes}m</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Marks</span>
                <span className="text-base sm:text-lg font-extrabold text-zinc-900">{quiz.total_marks}</span>
              </div>
            </div>

            {quiz.instructions && (
              <div className="p-4 rounded-lg bg-zinc-100 border border-zinc-300 mb-6 text-xs text-zinc-800 leading-relaxed font-mono">
                <strong className="block mb-1 text-zinc-900 font-bold uppercase">Exam Instructions:</strong>
                <p className="whitespace-pre-line">{quiz.instructions}</p>
              </div>
            )}

            {error && <Alert type="error" className="mb-4">{error}</Alert>}

            {/* Participant Details Form */}
            <form onSubmit={handleStartQuiz} className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-100 pb-2">
                Participant Information
              </h3>

              <Input
                label="Full Name *"
                name="name"
                placeholder="e.g. Rahul Sharma"
                value={studentInfo.name}
                onChange={handleChange}
                required
              />

              {reqFields.includes('roll_number') && (
                <Input
                  label="Roll / Student ID Number *"
                  name="rollNumber"
                  placeholder="e.g. 2026-CSE-101"
                  value={studentInfo.rollNumber}
                  onChange={handleChange}
                  required
                />
              )}

              {reqFields.includes('department') && (
                <Input
                  label="Department / Branch *"
                  name="department"
                  placeholder="e.g. Computer Science & Engineering"
                  value={studentInfo.department}
                  onChange={handleChange}
                  required
                />
              )}

              {reqFields.includes('year') && (
                <Input
                  label="Year / Semester"
                  name="year"
                  placeholder="e.g. 3rd Year / Semester 6"
                  value={studentInfo.year}
                  onChange={handleChange}
                />
              )}

              {reqFields.includes('college') && (
                <Input
                  label="College / Institute"
                  name="college"
                  placeholder="e.g. Oxford Institute of Technology"
                  value={studentInfo.college}
                  onChange={handleChange}
                />
              )}

              {reqFields.includes('email') && (
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="student@example.com"
                  value={studentInfo.email}
                  onChange={handleChange}
                />
              )}

              {quiz.has_access_code && (
                <Input
                  label="Quiz Access Passcode *"
                  name="accessCode"
                  placeholder="Enter passcode given by educator"
                  value={studentInfo.accessCode}
                  onChange={handleChange}
                  icon={KeyRound}
                  required
                />
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-base font-bold shadow-xs"
                isLoading={starting}
                icon={ArrowRight}
              >
                Start Quiz Now
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

