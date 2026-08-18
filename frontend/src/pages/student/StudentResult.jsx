import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Logo } from '../../components/ui/Logo';
import { api } from '../../services/api';
import { Sparkles, CheckCircle2, Award, ArrowLeft } from 'lucide-react';

export const StudentResult = () => {
  const pathParts = window.location.pathname.split('/');
  const attemptId = pathParts[pathParts.length - 1];

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await api.attempts.getResult(attemptId);
        if (res.success) {
          setData(res);
          const showScore = res.show_score_immediately ?? res.quiz?.show_score_immediately ?? true;
          const scorePct = Number(res.result?.percentage ?? res.attempt?.percentage ?? 0);
          if (showScore && scorePct >= 50) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 }
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Skeleton className="h-96 w-full max-w-xl" />
      </div>
    );
  }

  const showScoreImmediately = data?.show_score_immediately ?? data?.quiz?.show_score_immediately ?? true;
  const showCorrectAnswers = data?.show_correct_answers ?? data?.quiz?.show_correct_answers ?? true;
  const result = data?.result || data?.attempt;
  const questionsList = result?.questions || data?.breakdown || [];

  // If score is hidden by faculty
  if (data && !showScoreImmediately) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full shadow-xs border-zinc-200">
          <div className="w-14 h-14 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 mb-2">Response Submitted!</h2>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
            Your responses have been recorded successfully. The educator will release scores after manual evaluation.
          </p>
          <a href="/">
            <Button variant="outline" className="w-full">Return Homepage</Button>
          </a>
        </Card>
      </div>
    );
  }

  const isPass = Number(result?.percentage || 0) >= 50;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="h-16 border-b border-zinc-200 bg-white px-6 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <Logo size="md" />
        </a>
        <Badge variant={isPass ? 'live' : 'draft'}>
          {isPass ? 'PASSED' : 'COMPLETED'}
        </Badge>
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 my-4 sm:my-6 space-y-6">
        {/* Score Summary Card */}
        <Card className="p-6 sm:p-8 shadow-xs text-center border-t-4 border-t-zinc-900 border-zinc-200">
          <div className="w-14 h-14 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto mb-4 font-bold">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{result?.quiz_title || data?.quiz?.title || 'Quiz Performance'}</h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">Participant: <strong className="text-zinc-900">{result?.participant_name || 'Student'}</strong> ({result?.roll_number || 'N/A'})</p>

          <div className="my-6 p-6 rounded-xl bg-zinc-900 text-white inline-block w-full max-w-sm shadow-xs">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400 block mb-1">Total Score</span>
            <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white my-1">
              {result?.total_score ?? 0} <span className="text-zinc-500 text-2xl">/ {result?.max_score ?? 0}</span>
            </div>
            <div className="text-xs font-mono font-bold text-zinc-300 mt-2">{result?.percentage ?? 0}% Percentage Score</div>
          </div>

          <div className="flex justify-center gap-4">
            <a href="/">
              <Button variant="outline" icon={ArrowLeft}>Return Home</Button>
            </a>
          </div>
        </Card>

        {/* Detailed Question Review (If Enabled by Faculty) */}
        {showCorrectAnswers && questionsList.length > 0 && (
          <Card className="p-6 sm:p-8 border-zinc-200">
            <h3 className="text-base font-extrabold text-zinc-900 mb-4">Detailed Answer Key Review</h3>
            <div className="space-y-4">
              {questionsList.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className={`p-4 rounded-lg border ${
                    q.is_correct ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                    <span className="text-zinc-600">Question #{idx + 1}</span>
                    <span className={q.is_correct ? 'text-zinc-900 font-extrabold' : 'text-zinc-600'}>
                      {q.is_correct ? `+${q.marks_awarded || q.marks || 1} Marks (Correct)` : `0 Marks (Incorrect)`}
                    </span>
                  </div>
                  <h4 className="font-bold text-zinc-900 text-xs sm:text-sm mb-3 whitespace-pre-wrap font-sans">{q.question_text}</h4>

                  <div className="space-y-2 text-xs font-medium">
                    {Array.isArray(q.options) && q.options.map((opt, optIdx) => {
                      const optText = typeof opt === 'string' ? opt : (opt.text || opt.label || String(opt));
                      const optId = typeof opt === 'object' && opt?.id ? opt.id : optText;
                      const isSelected = q.selected_option === optId || q.selected_option === optText;
                      const isCorrect = q.correct_answer === optId || q.correct_answer === optText;

                      let style = 'bg-white border-zinc-200 text-zinc-700';
                      if (isSelected && isCorrect) style = 'bg-zinc-900 border-zinc-900 font-bold text-white';
                      else if (isSelected && !isCorrect) style = 'bg-zinc-100 border-zinc-400 font-bold text-zinc-900';
                      else if (isCorrect) style = 'bg-zinc-100 border-zinc-900 font-semibold text-zinc-900';

                      return (
                        <div key={optId || optIdx} className={`p-2.5 rounded-md border flex items-center justify-between gap-3 ${style}`}>
                          <span className="whitespace-pre-wrap font-mono">{optText}</span>
                          {isSelected && <span className="font-mono text-[9px] uppercase font-bold shrink-0">Your Pick</span>}
                          {!isSelected && isCorrect && <span className="font-mono text-[9px] uppercase font-bold text-zinc-900 shrink-0">Answer Key</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
