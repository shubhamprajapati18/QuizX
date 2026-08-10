import React, { useState, useEffect } from 'react';
import { FacultyLayout } from '../../components/layout/FacultyLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { QuizBuilder } from './QuizBuilder';
import { QuizImport } from './QuizImport';
import { api } from '../../services/api';
import { FileText, Upload, ArrowRight, ArrowLeft, Clock, Edit3 } from 'lucide-react';

export const CreateQuiz = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const initialMethod = urlParams.get('method') || null;
  const editId = urlParams.get('id') || null;

  const [selectedMethod, setSelectedMethod] = useState(editId ? 'manual' : initialMethod);
  const [draftQuizzes, setDraftQuizzes] = useState([]);

  useEffect(() => {
    async function loadDrafts() {
      try {
        const res = await api.quizzes.getAll({ status: 'draft' });
        if (res.success && res.quizzes) {
          setDraftQuizzes(res.quizzes);
        }
      } catch (err) {
        console.error('Failed to load drafts:', err);
      }
    }
    loadDrafts();
  }, []);

  if (selectedMethod === 'manual' || editId) {
    return (
      <FacultyLayout title={editId ? 'Edit Quiz' : 'Manual Quiz Builder'} activePath="/dashboard/create">
        <div className="mb-4">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => {
            setSelectedMethod(null);
            window.history.pushState({}, '', '/dashboard/create');
          }}>
            Change Creation Method
          </Button>
        </div>
        <QuizBuilder editId={editId} />
      </FacultyLayout>
    );
  }

  if (selectedMethod === 'import') {
    return (
      <FacultyLayout title="PDF / DOCX Document Import" activePath="/dashboard/create">
        <div className="mb-4">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => setSelectedMethod(null)}>
            Change Creation Method
          </Button>
        </div>
        <QuizImport />
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout title="Create New Quiz" activePath="/dashboard/create">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-8">
        <div className="text-center">
          <Badge variant="draft" className="mb-2">CREATION METHOD WIZARD</Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">Select How You Want to Build Your Quiz</h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600">Build questions manually or upload an existing question paper document.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual Builder Card */}
          <Card
            hoverEffect
            onClick={() => setSelectedMethod('manual')}
            className="p-6 sm:p-8 border-2 hover:border-zinc-900 flex flex-col justify-between relative group border-zinc-200"
          >
            <div>
              <div className="w-14 h-14 rounded-xl bg-zinc-900 text-white flex items-center justify-center mb-5 font-bold shadow-xs">
                <FileText className="w-7 h-7" />
              </div>
              <Badge variant="draft" className="mb-2">MANUAL WORKSPACE</Badge>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Create Manually</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
                Build your quiz question by question. Customize multiple choice options, assign marks, select correct answers, add explanations, and reorder items.
              </p>
            </div>

            <Button variant="primary" icon={ArrowRight} className="w-full py-2.5">
              Open Manual Builder
            </Button>
          </Card>

          {/* PDF / DOCX Import Card */}
          <Card
            hoverEffect
            onClick={() => setSelectedMethod('import')}
            className="p-6 sm:p-8 border-2 hover:border-zinc-900 flex flex-col justify-between relative group border-zinc-200"
          >
            <div>
              <div className="w-14 h-14 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-300 flex items-center justify-center mb-5 font-bold shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <Badge variant="draft" className="mb-2">AUTOMATED PARSER</Badge>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Upload Question Paper</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
                Upload existing test paper files (PDF, DOC, DOCX). Our intelligent parser automatically extracts questions and choices into editable cards for instant review.
              </p>
            </div>

            <Button variant="secondary" icon={ArrowRight} className="w-full py-2.5">
              Upload Document File
            </Button>
          </Card>
        </div>

        {/* Unfinished Drafts Section */}
        {draftQuizzes.length > 0 && (
          <div className="pt-6 border-t border-zinc-200 space-y-4">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-900" /> Resume Unfinished Quiz Drafts ({draftQuizzes.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {draftQuizzes.map((draft) => (
                <Card key={draft.id} className="p-4 border-zinc-200 hover:border-zinc-900 transition-colors flex items-center justify-between">
                  <div>
                    <Badge variant="draft" className="mb-1 font-mono text-[10px]">CODE: {draft.quiz_code}</Badge>
                    <h4 className="text-sm font-bold text-zinc-900 line-clamp-1">{draft.title || 'Untitled Draft'}</h4>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {draft.question_count || 0} Questions • Duration: {draft.duration_minutes || 30}m
                    </p>
                  </div>
                  <a href={`/dashboard/create?id=${draft.id}`}>
                    <Button variant="secondary" size="sm" icon={Edit3}>
                      Resume Draft
                    </Button>
                  </a>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
};
