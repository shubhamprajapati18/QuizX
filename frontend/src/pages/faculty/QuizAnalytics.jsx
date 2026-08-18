import React, { useState, useEffect } from 'react';
import { FacultyLayout } from '../../components/layout/FacultyLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { PieChart, AlertTriangle, BarChart2 } from 'lucide-react';

export const QuizAnalytics = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuizId = urlParams.get('quizId') || null;

  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(initialQuizId);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuizzes() {
      try {
        const res = await api.quizzes.getAll({ status: 'all' });
        if (res.success && res.quizzes) {
          setQuizzes(res.quizzes);
          if (!selectedQuizId && res.quizzes.length > 0) {
            setSelectedQuizId(res.quizzes[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (!selectedQuizId) {
      setLoading(false);
      return;
    }
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await api.results.getAnalytics(selectedQuizId);
        if (res.success && res.analytics) {
          setAnalytics(res.analytics);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [selectedQuizId]);

  return (
    <FacultyLayout title="Quiz Analytics & Performance" activePath="/dashboard/analytics">
      {/* Quiz Selector */}
      <Card className="p-4 mb-6 border-zinc-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-zinc-900 shrink-0" />
            <span className="text-xs font-mono font-bold text-zinc-700">Select Quiz to Analyze:</span>
          </div>
          <select
            value={selectedQuizId || ''}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-zinc-300 py-1.5 px-3 bg-white focus:border-zinc-900 w-full sm:w-auto max-w-md"
          >
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>{q.title} ({q.quiz_code})</option>
            ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !analytics ? (
        <Card className="p-12 text-center text-zinc-500 border-zinc-200">
          <BarChart2 className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-zinc-800 uppercase">No Analytics Data Available</h3>
          <p className="text-xs text-zinc-500 mt-1">Select a published quiz with student attempts to view metrics.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card className="p-4 border-zinc-200">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">Participants</span>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 font-mono mt-1">
                {analytics.total_participants ?? analytics.summary?.total_attempts ?? 0}
              </div>
            </Card>
            <Card className="p-4 border-zinc-200">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">Completed</span>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 font-mono mt-1">
                {analytics.completed_attempts ?? analytics.summary?.total_attempts ?? 0}
              </div>
            </Card>
            <Card className="p-4 border-zinc-200">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">Average Score</span>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 font-mono mt-1">
                {analytics.average_score ?? analytics.summary?.average_score ?? 0} / {analytics.total_marks ?? analytics.quiz?.total_marks ?? 0}
              </div>
            </Card>
            <Card className="p-4 border-zinc-200">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">Highest Score</span>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 font-mono mt-1">
                {analytics.highest_score ?? analytics.summary?.highest_score ?? 0}
              </div>
            </Card>
            <Card className="p-4 border-zinc-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">Pass Rate</span>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 font-mono mt-1">
                {analytics.pass_percentage ?? analytics.summary?.passing_rate ?? 0}%
              </div>
            </Card>
          </div>

          {/* Pass Rate Progress Bar */}
          <Card className="p-5 sm:p-6 border-zinc-200">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 mb-2">Overall Class Pass Rate</h3>
            <Progress value={analytics.pass_percentage ?? analytics.summary?.passing_rate ?? 0} max={100} label="Students Scoring ≥ 50%" />
          </Card>

          {/* Question-Wise Item Difficulty & Accuracy Analysis */}
          <Card className="p-5 sm:p-6 border-zinc-200">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-1">Question Accuracy & Difficulty Analysis</h3>
            <p className="text-xs text-zinc-500 mb-6">Identifies hard topics where students missed questions</p>

            <div className="space-y-4 sm:space-y-6">
              {(analytics.questions || analytics.question_stats || []).map((q, idx) => {
                const acc = q.accuracy_rate ?? q.accuracy ?? 0;
                const isHard = acc < 50;
                return (
                  <div key={q.id || idx} className="p-4 sm:p-5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
                            Q{idx + 1}
                          </span>
                          {isHard && (
                            <Badge variant="danger" size="sm" className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-zinc-900" /> High Difficulty ({100 - acc}% Missed)
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">{q.question_text}</h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg sm:text-xl font-extrabold font-mono text-zinc-900">{acc}%</span>
                        <span className="block text-[9px] font-mono font-bold text-zinc-500 uppercase">Accuracy</span>
                      </div>
                    </div>

                    <Progress value={acc} max={100} />

                    {/* Option Selection Distribution */}
                    {q.option_distribution && Object.keys(q.option_distribution).length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 block mb-2">Option Choice Count:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {Object.entries(q.option_distribution).map(([optText, count], i) => (
                            <div key={i} className="p-2 rounded bg-white border border-zinc-200 flex justify-between items-center">
                              <span className="truncate max-w-[110px] font-medium text-xs">{optText}</span>
                              <span className="font-mono font-bold text-zinc-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </FacultyLayout>
  );
};
