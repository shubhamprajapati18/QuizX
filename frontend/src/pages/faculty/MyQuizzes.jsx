import React, { useState, useEffect } from 'react';
import { FacultyLayout } from '../../components/layout/FacultyLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Input } from '../../components/ui/Input';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { ConfirmDialog } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import {
  BookOpen,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Eye,
  Copy,
  Share2,
  BarChart2,
  Trash2,
  Clock,
  Users,
  Lock,
  Globe
} from 'lucide-react';

export const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.quizzes.getAll({ status: activeTab, search: searchTerm });
      if (res.success) {
        setQuizzes(res.quizzes || []);
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuizzes();
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await api.quizzes.duplicate(id);
      if (res.success) {
        fetchQuizzes();
      }
    } catch (err) {
      alert('Failed to duplicate quiz.');
    }
  };

  const handleTogglePublish = async (quiz) => {
    try {
      const nextStatus = quiz.status === 'live' ? 'closed' : 'live';
      const res = await api.quizzes.togglePublish(quiz.id, { status: nextStatus });
      if (res.success) {
        fetchQuizzes();
      }
    } catch (err) {
      alert('Failed to change publish status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.quizzes.delete(deleteId);
      if (res.success) {
        setDeleteId(null);
        fetchQuizzes();
      }
    } catch (err) {
      alert('Failed to delete quiz.');
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Quizzes' },
    { id: 'draft', label: 'Drafts' },
    { id: 'live', label: 'Live' },
    { id: 'completed', label: 'Completed' },
    { id: 'closed', label: 'Closed' },
  ];

  return (
    <FacultyLayout title="My Quizzes" activePath="/dashboard/quizzes">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900">Quiz Management Workspace</h2>
          <p className="text-xs sm:text-sm text-zinc-500">Manage, edit, publish, and evaluate all quizzes created by your account</p>
        </div>
        <a href="/dashboard/create">
          <Button variant="primary" icon={Plus}>
            Create Quiz
          </Button>
        </a>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-4 mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <form onSubmit={handleSearchSubmit} className="sm:w-72 shrink-0">
          <Input
            placeholder="Search quizzes by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </form>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-48 w-full" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="p-12 text-center bg-zinc-50/50 border-zinc-200">
          <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-zinc-800 uppercase">No Quizzes Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-5">
            {searchTerm ? `No quizzes matching "${searchTerm}".` : `You haven't created any quizzes in this section yet.`}
          </p>
          <a href="/dashboard/create">
            <Button variant="primary" icon={Plus}>Create First Quiz</Button>
          </a>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {quizzes.map((quiz) => {
            const dropdownItems = [
              { label: 'Edit Builder', icon: Edit, onClick: () => (window.location.href = `/dashboard/create?id=${quiz.id}`) },
              { label: 'Preview Student View', icon: Eye, onClick: () => (window.location.href = `/dashboard/preview/${quiz.id}`) },
              { label: 'Duplicate Quiz', icon: Copy, onClick: () => handleDuplicate(quiz.id) },
              { label: 'Share Link & Code', icon: Share2, onClick: () => (window.location.href = `/dashboard/share/${quiz.id}`) },
              { label: 'View Results', icon: BarChart2, onClick: () => (window.location.href = `/dashboard/results?quizId=${quiz.id}`) },
              {
                label: quiz.status === 'live' ? 'Close Quiz' : 'Publish Live',
                icon: quiz.status === 'live' ? Lock : Globe,
                onClick: () => handleTogglePublish(quiz)
              },
              { divider: true },
              { label: 'Delete Quiz', icon: Trash2, danger: true, onClick: () => setDeleteId(quiz.id) }
            ];

            return (
              <Card key={quiz.id} hoverEffect className="flex flex-col justify-between p-5 border-zinc-200">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge variant={quiz.status}>{quiz.status.toUpperCase()}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
                        {quiz.quiz_code}
                      </span>
                      <DropdownMenu
                        trigger={
                          <button className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        }
                        items={dropdownItems}
                      />
                    </div>
                  </div>

                  <h3 className="font-bold text-zinc-900 text-base line-clamp-2 mb-1.5">{quiz.title}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-4">
                    {quiz.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-mono font-medium text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {quiz.duration_minutes}m</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {quiz.question_count} Qs</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {quiz.participant_count} Subs</span>
                  </div>
                  <a href={`/dashboard/results?quizId=${quiz.id}`} className="text-zinc-900 font-bold hover:underline">
                    Results →
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Quiz"
        description="Are you sure you want to delete this quiz? All associated questions, student attempts, and results will be permanently removed."
        confirmText="Delete Quiz"
        isLoading={isDeleting}
      />
    </FacultyLayout>
  );
};
