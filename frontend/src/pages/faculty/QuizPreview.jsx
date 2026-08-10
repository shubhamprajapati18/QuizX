import React, { useState, useEffect } from 'react';
import { FacultyLayout } from '../../components/layout/FacultyLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { Eye, ArrowLeft, Globe, AlertTriangle } from 'lucide-react';

export const QuizPreview = () => {
  const pathParts = window.location.pathname.split('/');
  const quizId = pathParts[pathParts.length - 1];

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await api.quizzes.getById(quizId);
        if (res.success && res.quiz) {
          setQuiz(res.quiz);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [quizId]);

  const handlePublish = async () => {
    try {
      const res = await api.quizzes.togglePublish(quizId, { status: 'live', is_published: true });
      if (res.success) {
        window.location.href = `/dashboard/share/${quizId}`;
      }
    } catch (err) {
      alert('Failed to publish quiz.');
    }
  };

  if (loading) {
    return (
      <FacultyLayout title="Quiz Student Preview">
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
      </FacultyLayout>
    );
  }

  if (!quiz) {
    return (
      <FacultyLayout title="Quiz Preview">
        <Card className="p-8 text-center max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-zinc-900 mx-auto mb-2" />
          <h3 className="font-bold text-zinc-800">Quiz Not Found</h3>
          <Button variant="outline" className="mt-4" onClick={() => (window.location.href = '/dashboard/quizzes')}>
            Back to Quizzes
          </Button>
        </Card>
      </FacultyLayout>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentQIndex];

  return (
    <FacultyLayout title={`Preview: ${quiz.title}`} activePath="/dashboard/quizzes">
      {/* Faculty Preview Notice Banner */}
      <div className="mb-6 p-4 rounded-xl bg-zinc-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-white shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">
            Faculty Preview Mode — Viewing exam exact student view layout.
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a href={`/dashboard/create?id=${quiz.id}`} className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" icon={ArrowLeft} className="w-full sm:w-auto bg-white text-zinc-900 hover:bg-zinc-100">
              Back to Editor
            </Button>
          </a>
          <Button variant="primary" size="sm" icon={Globe} onClick={handlePublish} className="w-full sm:w-auto bg-white text-zinc-900 hover:bg-zinc-100 font-bold border-white">
            Publish Live Now
          </Button>
        </div>
      </div>

      {/* Student View Mockup Container */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-card border border-zinc-200 overflow-hidden">
        {/* Exam Header */}
        <div className="bg-zinc-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="live" size="sm" className="mb-2 bg-white text-zinc-900">FACULTY PREVIEW</Badge>
            <h2 className="text-lg sm:text-xl font-bold">{quiz.title}</h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">{quiz.questions.length} Questions • Marks: {quiz.total_marks}</p>
          </div>
          <div className="bg-zinc-800 px-4 py-2 rounded-lg text-center border border-zinc-700 font-mono">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Duration</span>
            <span className="text-lg sm:text-xl font-bold text-white">{quiz.duration_minutes}:00</span>
          </div>
        </div>

        {/* Exam Question Card */}
        {questions.length > 0 && currentQ ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between text-xs font-mono font-semibold text-zinc-500 border-b border-zinc-100 pb-3">
              <span>Question {currentQIndex + 1} of {questions.length}</span>
              <span className="text-zinc-900 font-bold">{currentQ.marks} Marks</span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-relaxed">
              {currentQ.question_text}
            </h3>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                const isCorrectKey = currentQ.correct_answer === opt.id || currentQ.correct_answer === opt.text;

                return (
                  <div
                    key={opt.id || idx}
                    onClick={() => setSelectedAnswers({ ...selectedAnswers, [currentQ.id]: opt.id })}
                    className={`p-4 rounded-lg border text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                      isSelected ? 'border-zinc-900 bg-zinc-100 text-zinc-900 font-bold shadow-xs' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded text-xs font-mono font-bold flex items-center justify-center ${
                        isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt.text}</span>
                    </div>

                    {isCorrectKey && (
                      <Badge variant="live" size="sm">Answer Key</Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Question Nav Controls */}
            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(currentQIndex - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-zinc-500 font-mono">Question {currentQIndex + 1}/{questions.length}</span>
              <Button
                variant="primary"
                disabled={currentQIndex === questions.length - 1}
                onClick={() => setCurrentQIndex(currentQIndex + 1)}
              >
                Next Question
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-500">No questions added yet.</div>
        )}
      </div>
    </FacultyLayout>
  );
};
