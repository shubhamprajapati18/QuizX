import React, { useState, useEffect } from 'react';
import { FacultyLayout } from '../../components/layout/FacultyLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { Search, Download, Eye, Users, Filter } from 'lucide-react';

export const ResultsList = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuizId = urlParams.get('quizId') || 'all';

  const [results, setResults] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(initialQuizId);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      setLoading(true);
      try {
        const res = await api.results.getAll({
          quizId: selectedQuizId,
          department: departmentFilter,
          search: searchTerm
        });
        if (res.success) {
          setResults(res.results || []);
          setQuizzes(res.quizzes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [selectedQuizId, departmentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    api.results.getAll({
      quizId: selectedQuizId,
      department: departmentFilter,
      search: searchTerm
    }).then(res => {
      if (res.success) setResults(res.results || []);
    });
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = ['Student Name', 'Roll Number', 'Department', 'Quiz Title', 'Score', 'Max Score', 'Percentage', 'Status', 'Submitted At'];
    const rows = results.map(r => [
      `"${r.participant_name}"`,
      `"${r.roll_number || 'N/A'}"`,
      `"${r.department || 'N/A'}"`,
      `"${r.quiz_title}"`,
      r.total_score,
      r.max_score,
      `${r.percentage}%`,
      r.status,
      `"${new Date(r.created_at).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QuizX_Results_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSubmissions = results.length;
  const avgPercentage = totalSubmissions > 0
    ? Math.round(results.reduce((acc, r) => acc + Number(r.percentage || 0), 0) / totalSubmissions)
    : 0;

  return (
    <FacultyLayout title="Student Results Workspace" activePath="/dashboard/results">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 sm:p-5 border-zinc-200">
          <span className="text-[11px] font-mono font-bold uppercase text-zinc-500">Total Submissions</span>
          <div className="text-2xl font-extrabold text-zinc-900 font-mono mt-1">{totalSubmissions}</div>
        </Card>
        <Card className="p-4 sm:p-5 border-zinc-200">
          <span className="text-[11px] font-mono font-bold uppercase text-zinc-500">Class Average Score</span>
          <div className="text-2xl font-extrabold text-zinc-900 font-mono mt-1">{avgPercentage}%</div>
        </Card>
        <Card className="p-4 sm:p-5 border-zinc-200">
          <span className="text-[11px] font-mono font-bold uppercase text-zinc-500">Passing Attempts (≥50%)</span>
          <div className="text-2xl font-extrabold text-zinc-900 font-mono mt-1">
            {results.filter(r => Number(r.percentage || 0) >= 50).length}
          </div>
        </Card>
      </div>

      {/* Filter Controls Bar */}
      <Card className="p-4 mb-6 border-zinc-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-mono font-bold text-zinc-700">Quiz:</span>
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="text-xs font-semibold rounded-lg border border-zinc-300 py-1.5 px-3 bg-white focus:border-zinc-900"
              >
                <option value="all">All quizzes</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>{q.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="w-full sm:w-64">
              <Input
                placeholder="Search student or roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </form>
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV} disabled={results.length === 0}>
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Results DataTable */}
      <Card className="overflow-hidden border-zinc-200">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Users className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-zinc-800 uppercase">No Submissions Found</h3>
            <p className="text-xs text-zinc-500 mt-1">
              No student submissions match your filter criteria yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-zinc-700">
              <thead className="bg-zinc-100 text-[11px] font-mono uppercase font-bold text-zinc-600 border-b border-zinc-200">
                <tr>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Roll Number</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Quiz Title</th>
                  <th className="p-3.5">Score</th>
                  <th className="p-3.5">Percentage</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Submitted Date</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {results.map((res) => {
                  const isPass = Number(res.percentage || 0) >= 50;
                  return (
                    <tr key={res.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-zinc-900">{res.participant_name}</td>
                      <td className="p-3.5 font-mono text-xs text-zinc-600">{res.roll_number || 'N/A'}</td>
                      <td className="p-3.5 text-xs text-zinc-600">{res.department || 'N/A'}</td>
                      <td className="p-3.5 font-medium text-zinc-800 max-w-xs truncate">{res.quiz_title}</td>
                      <td className="p-3.5 font-mono font-bold text-zinc-900">{res.total_score} / {res.max_score}</td>
                      <td className="p-3.5">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          isPass ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                        }`}>
                          {res.percentage}%
                        </span>
                      </td>
                      <td className="p-3.5">
                        <Badge variant={res.status === 'submitted' ? 'live' : 'draft'} size="sm">
                          {res.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-xs font-mono text-zinc-500">
                        {new Date(res.created_at).toLocaleDateString()} {new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 text-right">
                        <a href={`/dashboard/submission/${res.id}`}>
                          <Button variant="ghost" size="sm" icon={Eye}>Inspect</Button>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </FacultyLayout>
  );
};
