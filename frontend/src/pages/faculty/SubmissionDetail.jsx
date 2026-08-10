import React, { useState, useEffect } from 'react';
import { FacultyLayout } from '../../components/layout/FacultyLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const SubmissionDetail = () => {
  const pathParts = window.location.pathname.split('/');
  const attemptId = pathParts[pathParts.length - 1];

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubmission() {
      try {
        const res = await api.results.getSubmissionDetail(attemptId);
        if (res.success && res.submission) {
          setSub(res.submission);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSubmission();
  }, [attemptId]);

  if (loading) {
    return (
      <FacultyLayout title="Submission Inspection">
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
      </FacultyLayout>
    );
  }

  if (!sub) {
    return (
      <FacultyLayout title="Submission Inspection">
        <Card className="p-8 text-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-zinc-900 mx-auto mb-2" />
          <h3 className="font-bold text-zinc-800">Submission Not Found</h3>
          <a href="/dashboard/results">
            <Button variant="outline" className="mt-4">Back to Results</Button>
          </a>
        </Card>
      </FacultyLayout>
    );
  }

  const isPass = Number(sub.percentage || 0) >= 50;

  return (
    <FacultyLayout title={`Submission: ${sub.participant_name}`} activePath="/dashboard/results">
      <div className="mb-4">
        <a href="/dashboard/results">
          <Button variant="outline" size="sm" icon={ArrowLeft}>Back to Results</Button>
        </a>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Student & Score Header Banner */}
        <Card className="p-6 bg-white shadow-xs border-l-4 border-l-zinc-900 border-zinc-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <Badge variant="live" className="mb-2">{sub.quiz_title}</Badge>
              <h2 className="text-2xl font-black text-zinc-900">{sub.participant_name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-medium text-zinc-500 mt-2">
                <span>Roll #: <strong className="text-zinc-900">{sub.roll_number || 'N/A'}</strong></span>
                <span>Dept: <strong className="text-zinc-900">{sub.department || 'N/A'}</strong></span>
                <span>Year: <strong className="text-zinc-900">{sub.year || 'N/A'}</strong></span>
              </div>
            </div>

            <div className="bg-zinc-900 text-white p-5 rounded-xl text-center shrink-0 min-w-[180px]">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400 block mb-1">Evaluation Score</span>
              <div className="text-3xl font-extrabold font-mono text-white">
                {sub.total_score} <span className="text-zinc-500 text-lg">/ {sub.max_score}</span>
              </div>
              <Badge variant="live" className="mt-2 text-xs font-mono font-bold bg-white text-zinc-900">
                {sub.percentage}% ({isPass ? 'PASS' : 'FAIL'})
              </Badge>
            </div>
          </div>
        </Card>

        {/* Question-Wise Inspection Breakdown */}
        <h3 className="text-base font-extrabold text-zinc-900 pt-2">Question-Wise Response Breakdown</h3>

        <div className="space-y-4">
          {sub.questions.map((q, idx) => {
            const isCorrect = q.is_correct;
            const isAnswered = q.selected_option !== null && q.selected_option !== '';

            return (
              <Card
                key={q.id || idx}
                className={`p-5 sm:p-6 border-l-4 ${
                  !isAnswered
                    ? 'border-l-zinc-300'
                    : isCorrect
                    ? 'border-l-zinc-900 bg-zinc-50/40'
                    : 'border-l-zinc-400 bg-white'
                } border-zinc-200`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
                      Q{idx + 1}
                    </span>
                    <Badge variant={!isAnswered ? 'draft' : isCorrect ? 'live' : 'danger'}>
                      {!isAnswered ? 'UNANSWERED' : isCorrect ? 'CORRECT' : 'INCORRECT'}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-700">
                    Awarded: {q.marks_awarded} / {q.marks} Marks
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-zinc-900 mb-4">{q.question_text}</h4>

                <div className="space-y-2 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = q.selected_option === opt.id || q.selected_option === opt.text;
                    const isCorrectOpt = q.correct_answer === opt.id || q.correct_answer === opt.text;

                    let optStyle = 'border-zinc-200 bg-white text-zinc-700';
                    if (isSelected && isCorrectOpt) {
                      optStyle = 'border-zinc-900 bg-zinc-900 text-white font-bold';
                    } else if (isSelected && !isCorrectOpt) {
                      optStyle = 'border-zinc-400 bg-zinc-100 text-zinc-900 font-bold';
                    } else if (isCorrectOpt) {
                      optStyle = 'border-zinc-900 bg-zinc-100 text-zinc-900 font-semibold';
                    }

                    return (
                      <div key={opt.id || optIdx} className={`p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between ${optStyle}`}>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded text-xs font-mono font-bold bg-zinc-200 text-zinc-900 flex items-center justify-center">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200 text-zinc-900">
                            Student Pick
                          </span>
                        )}
                        {!isSelected && isCorrectOpt && (
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-900">
                            Answer Key
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="p-3 rounded bg-zinc-100 text-xs text-zinc-700 border border-zinc-300 font-mono">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </FacultyLayout>
  );
};
