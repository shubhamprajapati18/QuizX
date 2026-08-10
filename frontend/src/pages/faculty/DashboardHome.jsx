import React, { useState, useEffect } from 'react';
import { FacultyLayout } from '../../components/layout/FacultyLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Zap,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  Upload,
  BarChart2,
  Copy,
  Clock,
  ArrowRight
} from 'lucide-react';

export const DashboardHome = () => {
  const { faculty } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsRes, quizzesRes] = await Promise.all([
          api.quizzes.getDashboardStats(),
          api.quizzes.getAll({ status: 'all' })
        ]);

        if (statsRes.success) {
          setStats(statsRes.stats);
          setRecentSubmissions(statsRes.recentSubmissions || []);
        }

        if (quizzesRes.success) {
          setQuizzes(quizzesRes.quizzes || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleCopyLink = (code) => {
    const url = `${window.location.origin}/quiz/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const activeQuizzes = quizzes.filter(q => q.status === 'live');

  return (
    <FacultyLayout title="Faculty Overview" activePath="/dashboard">
      {/* Welcome Banner */}
      <div className="mb-6 p-5 sm:p-6 rounded-xl bg-zinc-900 text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Badge variant="live" className="mb-2 bg-white text-zinc-900 border-white">
            Workspace Active
          </Badge>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {faculty?.name || 'Educator'} - {faculty?.institution || 'Academic Institute'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-xl">
            Welcome back, {faculty?.name || 'Educator'}. Manage quizzes, import test papers, share exam passcodes, and review student evaluations.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <a href="/dashboard/create" className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" icon={Plus} className="w-full sm:w-auto font-bold bg-white text-zinc-900 hover:bg-zinc-100">
              Create New Quiz
            </Button>
          </a>
        </div>
      </div>

      {/* Monochrome KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Quizzes', value: stats?.totalQuizzes, icon: BookOpen },
          { label: 'Active Exams', value: stats?.activeQuizzes, icon: Zap },
          { label: 'Participants', value: stats?.totalParticipants, icon: Users },
          { label: 'Submissions', value: stats?.totalSubmissions, icon: CheckCircle2 },
          { label: 'Avg Score', value: stats ? `${stats.avgScorePercentage}%` : '0%', icon: TrendingUp }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="p-4 border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-zinc-500">{kpi.label}</span>
                <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-7 w-14 mt-2" />
              ) : (
                <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-2 font-mono">{kpi.value ?? 0}</div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Active Quizzes & Quick Launcher */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Quizzes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Active & Live Quizzes</CardTitle>
                <CardDescription>Currently accepting student responses</CardDescription>
              </div>
              <a href="/dashboard/quizzes?status=live">
                <Button variant="ghost" size="sm">View All</Button>
              </a>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : activeQuizzes.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
                  <Zap className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-zinc-800 uppercase">No live quizzes running right now</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1 mb-4">
                    Publish an existing quiz draft or create a new one to generate a student pass link.
                  </p>
                  <a href="/dashboard/create">
                    <Button variant="primary" size="sm" icon={Plus}>Create Quiz</Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeQuizzes.map((quiz) => (
                    <div key={quiz.id} className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="live" size="sm">LIVE</Badge>
                          <span className="text-xs font-mono font-bold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-300">
                            Code: {quiz.quiz_code}
                          </span>
                        </div>
                        <h4 className="font-bold text-zinc-900 text-sm sm:text-base">{quiz.title}</h4>
                        <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {quiz.duration_minutes}m</span>
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {quiz.participant_count || 0} participants</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Copy}
                          onClick={() => handleCopyLink(quiz.quiz_code)}
                        >
                          {copiedCode === quiz.quiz_code ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <a href={`/dashboard/results?quizId=${quiz.id}`}>
                          <Button variant="primary" size="sm" icon={BarChart2}>
                            Results
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card hoverEffect onClick={() => (window.location.href = '/dashboard/create?method=manual')} className="p-4 border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 font-bold">
                  +
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Create Manually</h4>
                  <p className="text-xs text-zinc-500">Google Forms style builder</p>
                </div>
              </div>
            </Card>

            <Card hoverEffect onClick={() => (window.location.href = '/dashboard/create?method=import')} className="p-4 border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-300 flex items-center justify-center shrink-0 font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Import PDF / DOCX</h4>
                  <p className="text-xs text-zinc-500">Auto-parse test papers</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Side Column: Recent Submissions Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Submissions</CardTitle>
              <a href="/dashboard/results">
                <Button variant="ghost" size="sm" icon={ArrowRight}>All</Button>
              </a>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recentSubmissions.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 text-xs">
                  No submissions recorded yet. Share a live quiz code to receive responses!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentSubmissions.map((sub) => (
                    <div key={sub.id} className="p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 flex items-center justify-between gap-3 text-xs">
                      <div className="truncate">
                        <p className="font-bold text-zinc-900 truncate">{sub.participant_name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{sub.department || 'General'} • Roll #{sub.roll_number || 'N/A'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-zinc-900">{sub.total_score}/{sub.max_score}</span>
                        <span className="block text-[10px] font-mono text-zinc-500">{sub.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </FacultyLayout>
  );
};
