import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Switch } from '../../components/ui/Switch';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../services/api';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Save,
  Eye,
  Globe,
  Settings,
  Clock,
  KeyRound,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Zap
} from 'lucide-react';

// Date formatting helpers for datetime-local <-> ISO UTC conversion
const formatToLocalDatetime = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

const formatToISO = (localStr) => {
  if (!localStr) return null;
  const d = new Date(localStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

export const QuizBuilder = ({
  editId,
  initialQuestions = [],
  importSessionId = null,
  docHash = null,
  docName = null
}) => {
  // Step 1: Questions Builder, Step 2: Settings & Access
  const [currentStep, setCurrentStep] = useState(1);

  const [quizData, setQuizData] = useState({
    title: docName ? `Quiz from ${docName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}` : '',
    description: importSessionId ? `Parsed from document: ${docName || 'uploaded PDF'}` : '',
    instructions: '1. Answer all questions within the allowed time.\n2. Do not refresh browser during exam.\n3. Progressive answers are saved automatically.',
    duration_minutes: 30,
    start_time: '',
    end_time: '',
    max_attempts: 1,
    access_code: '',
    shuffle_questions: false,
    shuffle_options: false,
    show_score_immediately: true,
    show_correct_answers: true,
    required_fields: ['name', 'roll_number', 'department']
  });

  const [questions, setQuestions] = useState(initialQuestions.length > 0 ? initialQuestions : [
    {
      id: 'q_1',
      question_text: 'What is the primary function of an operating system kernel?',
      options: [
        { id: 'opt_1', text: 'Manage system resources and hardware interaction' },
        { id: 'opt_2', text: 'Compile high level code to machine language' },
        { id: 'opt_3', text: 'Render graphical interface elements' },
        { id: 'opt_4', text: 'Manage network router routing tables' }
      ],
      correct_answer: 'opt_1',
      marks: 2,
      explanation: 'The kernel is the core component of an OS that manages memory, hardware, and processes.'
    }
  ]);

  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('Saved');
  const [error, setError] = useState('');
  const [savedQuiz, setSavedQuiz] = useState(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initial Load & Local Draft Recovery with Document Session Isolation
  useEffect(() => {
    if (editId) {
      async function loadQuiz() {
        try {
          const res = await api.quizzes.getById(editId);
          if (res.success && res.quiz) {
            const q = res.quiz;
            setQuizData({
              title: q.title || '',
              description: q.description || '',
              instructions: q.instructions || '',
              duration_minutes: q.duration_minutes || 30,
              start_time: formatToLocalDatetime(q.start_time),
              end_time: formatToLocalDatetime(q.end_time),
              max_attempts: q.max_attempts || 1,
              access_code: q.access_code || '',
              shuffle_questions: !!q.shuffle_questions,
              shuffle_options: !!q.shuffle_options,
              show_score_immediately: q.show_score_immediately !== undefined ? q.show_score_immediately : true,
              show_correct_answers: q.show_correct_answers !== undefined ? q.show_correct_answers : true,
              required_fields: q.required_fields || ['name', 'roll_number', 'department']
            });
            if (q.questions && q.questions.length > 0) {
              setQuestions(q.questions);
            }
            setSavedQuiz(q);
          }
        } catch (err) {
          // Check local recovery draft
          const localDraft = localStorage.getItem(`quiz_builder_draft_${editId}`);
          if (localDraft) {
            try {
              const parsed = JSON.parse(localDraft);
              if (parsed.quizData) setQuizData(parsed.quizData);
              if (parsed.questions) setQuestions(parsed.questions);
            } catch (e) {}
          }
          setError('Failed to load quiz details.');
        } finally {
          setIsInitialized(true);
        }
      }
      loadQuiz();
    } else if (importSessionId || (initialQuestions && initialQuestions.length > 0)) {
      // Document Import session active: ISOLATE workspace and prevent generic draft contamination
      if (docName) {
        const cleanTitle = docName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setQuizData(prev => ({
          ...prev,
          title: prev.title || `Quiz from ${cleanTitle}`
        }));
      }

      // Check for session-specific local draft if user edited inside this specific import session
      const sessionDraftKey = `quiz_builder_draft_${importSessionId || 'imported'}`;
      const sessionDraft = localStorage.getItem(sessionDraftKey);
      if (sessionDraft) {
        try {
          const parsed = JSON.parse(sessionDraft);
          if (parsed.quizData) setQuizData(parsed.quizData);
          if (parsed.questions) setQuestions(parsed.questions);
        } catch (e) {}
      } else {
        setQuestions(initialQuestions);
      }
      setIsInitialized(true);
    } else {
      // Check for unsaved new manual draft
      const newDraft = localStorage.getItem('quiz_builder_draft_new');
      if (newDraft) {
        try {
          const parsed = JSON.parse(newDraft);
          if (parsed.quizData) setQuizData(parsed.quizData);
          if (parsed.questions) setQuestions(parsed.questions);
        } catch (e) {}
      }
      setIsInitialized(true);
    }
  }, [editId, importSessionId]);

  // Debounced Auto-Save Mechanism (Session-Isolated LocalStorage + DB Sync)
  useEffect(() => {
    if (!isInitialized) return;
    if (!quizData.title.trim()) return;

    setAutoSaveStatus('Saving...');

    const draftKey = editId
      ? `quiz_builder_draft_${editId}`
      : (importSessionId ? `quiz_builder_draft_${importSessionId}` : 'quiz_builder_draft_new');

    localStorage.setItem(draftKey, JSON.stringify({ quizData, questions }));

    const timer = setTimeout(async () => {
      if (!navigator.onLine) {
        setAutoSaveStatus('Offline — saved locally');
        return;
      }

      try {
        const payload = {
          ...quizData,
          start_time: formatToISO(quizData.start_time),
          end_time: formatToISO(quizData.end_time),
          questions,
          status: savedQuiz?.status || 'draft',
          is_published: savedQuiz?.is_published || false
        };

        if (editId || savedQuiz?.id) {
          const idToUpdate = editId || savedQuiz.id;
          const res = await api.quizzes.update(idToUpdate, payload);
          if (res.success && res.quiz) {
            setSavedQuiz(res.quiz);
          }
        }
        setAutoSaveStatus('Saved just now');
      } catch (err) {
        setAutoSaveStatus('Offline — saved locally');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [quizData, questions, isInitialized, editId, importSessionId, savedQuiz?.id, savedQuiz?.status, savedQuiz?.is_published]);

  // Question Management Controls
  const addQuestion = () => {
    const newQ = {
      id: `q_${Date.now()}`,
      question_text: '',
      options: [
        { id: `opt_1`, text: '' },
        { id: `opt_2`, text: '' },
        { id: `opt_3`, text: '' },
        { id: `opt_4`, text: '' }
      ],
      correct_answer: 'opt_1',
      marks: 1,
      explanation: ''
    };
    setQuestions([...questions, newQ]);
  };

  const duplicateQuestion = (index) => {
    const original = questions[index];
    const cloned = {
      ...original,
      id: `q_${Date.now()}`,
      options: original.options.map(o => ({ ...o }))
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, cloned);
    setQuestions(updated);
  };

  const deleteQuestion = (index) => {
    if (questions.length <= 1) {
      alert('Quiz must contain at least 1 question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setQuestions(updated);
  };

  const updateQuestionText = (index, text) => {
    const updated = [...questions];
    updated[index].question_text = text;
    setQuestions(updated);
  };

  const updateMarks = (index, marks) => {
    const updated = [...questions];
    updated[index].marks = Number(marks) || 1;
    setQuestions(updated);
  };

  const updateOptionText = (qIndex, optIndex, text) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex].text = text;
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    const optCount = updated[qIndex].options.length;
    updated[qIndex].options.push({
      id: `opt_${optCount + 1}`,
      text: ''
    });
    setQuestions(updated);
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) {
      alert('Question must have at least 2 options.');
      return;
    }
    const removedOpt = updated[qIndex].options[optIndex];
    updated[qIndex].options.splice(optIndex, 1);

    if (updated[qIndex].correct_answer === removedOpt.id) {
      updated[qIndex].correct_answer = updated[qIndex].options[0].id;
    }
    setQuestions(updated);
  };

  const setCorrectAnswer = (qIndex, optionId) => {
    const updated = [...questions];
    updated[qIndex].correct_answer = optionId;
    setQuestions(updated);
  };

  const handleRequiredFieldToggle = (field) => {
    const current = quizData.required_fields || [];
    if (current.includes(field)) {
      if (current.length <= 1) {
        alert('At least one student info field (e.g. Name) must be required.');
        return;
      }
      setQuizData({ ...quizData, required_fields: current.filter(f => f !== field) });
    } else {
      setQuizData({ ...quizData, required_fields: [...current, field] });
    }
  };

  // Move to Step 2 validation
  const handleProceedToSettings = () => {
    setError('');
    if (questions.some(q => !q.question_text.trim())) {
      setError('Please fill in question text for all questions before proceeding.');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Preset Date Time Helpers
  const handleSetStartNow = () => {
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm
    const isoStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setQuizData({ ...quizData, start_time: isoStr });
  };

  const handleSetEndHours = (hours) => {
    const base = quizData.start_time ? new Date(quizData.start_time) : new Date();
    const end = new Date(base.getTime() + (hours * 3600000) - (base.getTimezoneOffset() * 60000));
    const isoStr = end.toISOString().slice(0, 16);
    setQuizData({ ...quizData, end_time: isoStr });
  };

  // Save / Publish Quiz Handler
  const handleSaveQuiz = async (shouldPublish = false) => {
    setError('');
    if (!quizData.title.trim()) {
      setError('Please provide a Quiz Title.');
      setCurrentStep(2);
      return;
    }

    if (questions.some(q => !q.question_text.trim())) {
      setError('All questions must have question text filled in.');
      setCurrentStep(1);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...quizData,
        start_time: formatToISO(quizData.start_time),
        end_time: formatToISO(quizData.end_time),
        questions,
        status: shouldPublish ? 'live' : (savedQuiz?.status || 'draft'),
        is_published: shouldPublish ? true : (savedQuiz?.is_published || false)
      };

      let res;
      if (editId || savedQuiz?.id) {
        const idToUpdate = editId || savedQuiz.id;
        res = await api.quizzes.update(idToUpdate, payload);
      } else {
        res = await api.quizzes.create(payload);
      }

      if (res.success && res.quiz) {
        setSavedQuiz(res.quiz);
        if (shouldPublish) {
          window.location.href = `/dashboard/share/${res.quiz.id}`;
        } else {
          alert('Quiz saved successfully as draft!');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save quiz.');
    } finally {
      setSaving(false);
      setShowPublishDialog(false);
    }
  };

  const totalMarksSum = questions.reduce((acc, q) => acc + (Number(q.marks) || 1), 0);

  return (
    <div className="space-y-6">
      {/* Step Indicator Header (Replaces Tab Bar with Step Flow) */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
              currentStep === 1 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 border border-zinc-300'
            }`}>
              1
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">Step 1</span>
              <span className={`text-xs sm:text-sm font-bold ${currentStep === 1 ? 'text-zinc-900' : 'text-zinc-500'}`}>
                Question Builder ({questions.length} Qs)
              </span>
            </div>
          </div>

          <div className="hidden sm:block text-zinc-300 font-bold text-lg">→</div>

          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
              currentStep === 2 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 border border-zinc-300'
            }`}>
              2
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">Step 2</span>
              <span className={`text-xs sm:text-sm font-bold ${currentStep === 2 ? 'text-zinc-900' : 'text-zinc-500'}`}>
                Settings & Access
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
          {/* Progressive Auto-Save Status Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700">
            <span className={`w-2 h-2 rounded-full ${autoSaveStatus === 'Saving...' ? 'bg-zinc-400 animate-ping' : 'bg-zinc-900'}`} />
            {autoSaveStatus}
          </span>

          {savedQuiz?.id && (
            <a href={`/dashboard/preview/${savedQuiz.id}`}>
              <Button variant="outline" size="sm" icon={Eye} className="text-xs">
                Preview
              </Button>
            </a>
          )}
          <Button variant="secondary" size="sm" icon={Save} isLoading={saving} onClick={() => handleSaveQuiz(false)} className="text-xs">
            Save Draft
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* STEP 1: QUESTION BUILDER */}
      {currentStep === 1 && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-900 text-white p-4 rounded-xl shadow-xs gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5" /> Step 1: Create & Customize Questions
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                {questions.length} Questions • Total Marks: <strong className="text-white">{totalMarksSum}</strong>
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={ArrowRight} onClick={handleProceedToSettings} className="bg-white text-zinc-900 font-bold hover:bg-zinc-100 w-full sm:w-auto text-xs shrink-0">
              Next: Settings & Access →
            </Button>
          </div>

          {questions.map((q, qIndex) => (
            <Card key={q.id || qIndex} className="p-5 sm:p-6 border-l-4 border-l-zinc-900 border-zinc-200 relative">
              {/* Question Header & Order */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded border border-zinc-300">
                  Question #{qIndex + 1}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-500">Marks:</span>
                  <input
                    type="number"
                    min="1"
                    value={q.marks}
                    onChange={(e) => updateMarks(qIndex, e.target.value)}
                    className="w-16 px-2 py-1 text-center text-xs font-bold font-mono rounded border border-zinc-300 bg-white"
                  />
                  <div className="flex items-center border-l border-zinc-200 pl-2 ml-1 gap-1">
                    <button
                      onClick={() => moveQuestion(qIndex, -1)}
                      disabled={qIndex === 0}
                      className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveQuestion(qIndex, 1)}
                      disabled={qIndex === questions.length - 1}
                      className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <Textarea
                placeholder="Enter question statement..."
                value={q.question_text}
                onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                rows={q.question_text.includes('\n') ? Math.min(8, Math.max(3, q.question_text.split('\n').length)) : 2}
                className="font-bold text-sm sm:text-base mb-4 whitespace-pre-wrap font-sans"
              />

              {/* MCQ Options */}
              <div className="space-y-3 mb-6">
                <label className="block text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-wider">
                  Options Choice (Click Radio Button to Set Correct Key)
                </label>
                {q.options.map((opt, optIndex) => {
                  const isCorrect = q.correct_answer === opt.id || q.correct_answer === opt.text;
                  const optionLabel = String.fromCharCode(65 + optIndex);
                  const isMultiline = opt.text.includes('\n');

                  return (
                    <div
                      key={opt.id || optIndex}
                      className={`flex items-start sm:items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                        isCorrect ? 'border-zinc-900 bg-zinc-100 font-bold' : 'border-zinc-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct_answer_${qIndex}`}
                        checked={isCorrect}
                        onChange={() => setCorrectAnswer(qIndex, opt.id)}
                        className="w-4 h-4 text-zinc-900 focus:ring-zinc-900 cursor-pointer mt-1 sm:mt-0 shrink-0"
                      />

                      <span className={`text-xs font-mono font-bold w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                        isCorrect ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}>
                        {optionLabel}
                      </span>

                      <textarea
                        rows={isMultiline ? Math.min(6, Math.max(2, opt.text.split('\n').length)) : 1}
                        placeholder={`Option ${optionLabel}...`}
                        value={opt.text}
                        onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                        className="flex-1 text-xs sm:text-sm font-medium border-0 bg-transparent focus:ring-0 px-2 resize-y whitespace-pre-wrap font-mono"
                      />

                      {q.options.length > 2 && (
                        <button
                          onClick={() => removeOption(qIndex, optIndex)}
                          className="text-zinc-400 hover:text-zinc-900 p-1 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {q.options.length < 6 && (
                  <Button variant="ghost" size="sm" icon={Plus} onClick={() => addOption(qIndex)}>
                    Add Option Choice
                  </Button>
                )}
              </div>

              {/* Action Controls */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" icon={Copy} onClick={() => duplicateQuestion(qIndex)}>
                  Duplicate
                </Button>
                <Button variant="ghost" size="sm" icon={Trash2} className="text-zinc-900 hover:bg-zinc-100 font-bold" onClick={() => deleteQuestion(qIndex)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Button variant="outline" icon={Plus} onClick={addQuestion} className="w-full sm:w-auto py-3">
              Add Question
            </Button>
            <Button variant="primary" icon={ArrowRight} onClick={handleProceedToSettings} className="w-full sm:w-auto py-3 font-bold">
              Proceed to Step 2: Settings & Access →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: QUIZ SETTINGS, TIMING & ACCESS */}
      {currentStep === 2 && (
        <Card className="max-w-4xl mx-auto p-6 sm:p-8 space-y-8 border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <Badge variant="live" className="mb-1">STEP 2 OF 2</Badge>
              <h3 className="text-xl font-black text-zinc-900">Quiz Settings, Timing & Access Controls</h3>
              <p className="text-xs text-zinc-500">Configure exam parameters, window timing, student fields, and publish live.</p>
            </div>
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => setCurrentStep(1)}>
              Back to Questions
            </Button>
          </div>

          {/* Section 1: General Quiz Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700">General Information</h4>
            <Input
              label="Quiz Title *"
              placeholder="e.g. Data Structures & Algorithms Midterm Exam"
              value={quizData.title}
              onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
              required
            />

            <Textarea
              label="Description"
              placeholder="Brief summary of topics covered in this quiz..."
              value={quizData.description}
              onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
              rows={2}
            />

            <Textarea
              label="Instructions for Students"
              placeholder="Rules, guidelines, forbidden materials..."
              value={quizData.instructions}
              onChange={(e) => setQuizData({ ...quizData, instructions: e.target.value })}
              rows={3}
            />
          </div>

          {/* Section 2: Timing & Exam Window UI Fix */}
          <div className="pt-6 border-t border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-900" /> Exam Duration & Availability Window
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Quizzes start immediately upon publishing. Optionally set start and end datetime window limits below.
                </p>
              </div>
              <Badge variant="live" className="hidden sm:inline-flex">IMMEDIATE START ENABLED</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <Input
                label="Exam Duration (Minutes) *"
                type="number"
                min="1"
                value={quizData.duration_minutes}
                onChange={(e) => setQuizData({ ...quizData, duration_minutes: Number(e.target.value) })}
                icon={Clock}
                helperText="Allowed time once student begins test"
              />

              <Input
                label="Access Passcode (Optional)"
                placeholder="Leave blank for open link access"
                value={quizData.access_code}
                onChange={(e) => setQuizData({ ...quizData, access_code: e.target.value })}
                icon={KeyRound}
                helperText="Passcode required to open exam"
              />

              {/* Exam Window Start Time Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Exam Window Start Time
                  </label>
                  <button
                    type="button"
                    onClick={handleSetStartNow}
                    className="text-[10px] font-mono font-bold text-zinc-900 hover:underline bg-white px-2 py-0.5 rounded border border-zinc-300"
                  >
                    Set Start Now
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={quizData.start_time}
                    onChange={(e) => setQuizData({ ...quizData, start_time: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono font-semibold text-zinc-900 focus:border-zinc-900 shadow-xs"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {quizData.start_time ? `Opens: ${new Date(quizData.start_time).toLocaleString()}` : 'Starts immediately when published'}
                </p>
              </div>

              {/* Exam Window End Time Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Exam Window End Time
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetEndHours(2)}
                      className="text-[10px] font-mono font-bold text-zinc-900 hover:underline bg-white px-1.5 py-0.5 rounded border border-zinc-300"
                    >
                      +2h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetEndHours(24)}
                      className="text-[10px] font-mono font-bold text-zinc-900 hover:underline bg-white px-1.5 py-0.5 rounded border border-zinc-300"
                    >
                      +24h
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={quizData.end_time}
                    onChange={(e) => setQuizData({ ...quizData, end_time: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono font-semibold text-zinc-900 focus:border-zinc-900 shadow-xs"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {quizData.end_time ? `Closes: ${new Date(quizData.end_time).toLocaleString()}` : 'No deadline set (remains open)'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Required Participant Fields */}
          <div className="pt-6 border-t border-zinc-200">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Required Student Registration Fields
            </h4>
            <p className="text-xs text-zinc-500 mb-4">Select what details students must fill in before taking the test</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'name', label: 'Full Name (Required)', fixed: true },
                { id: 'roll_number', label: 'Roll / ID Number' },
                { id: 'department', label: 'Department / Branch' },
                { id: 'year', label: 'Year / Semester' },
                { id: 'college', label: 'College / Institute' },
                { id: 'email', label: 'Email Address' }
              ].map((field) => {
                const isSelected = quizData.required_fields.includes(field.id);
                return (
                  <button
                    key={field.id}
                    type="button"
                    disabled={field.fixed}
                    onClick={() => handleRequiredFieldToggle(field.id)}
                    className={`p-3 rounded-lg border text-xs font-semibold text-left transition-colors flex items-center justify-between ${
                      isSelected ? 'border-zinc-900 bg-zinc-100 text-zinc-900 font-bold' : 'border-zinc-200 bg-white text-zinc-600'
                    }`}
                  >
                    <span>{field.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Result & Evaluation Options */}
          <div className="pt-6 border-t border-zinc-200 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700">
              Result & Randomization Settings
            </h4>

            <Switch
              label="Shuffle Questions Order"
              description="Randomize question sequence for every student attempt"
              checked={quizData.shuffle_questions}
              onChange={(val) => setQuizData({ ...quizData, shuffle_questions: val })}
            />

            <Switch
              label="Shuffle Options Order"
              description="Randomize option A/B/C/D order for every question"
              checked={quizData.shuffle_options}
              onChange={(val) => setQuizData({ ...quizData, shuffle_options: val })}
            />

            <Switch
              label="Show Score Immediately After Submission"
              description="Allow students to view their score upon completion"
              checked={quizData.show_score_immediately}
              onChange={(val) => setQuizData({ ...quizData, show_score_immediately: val })}
            />

            <Switch
              label="Show Correct Answers & Explanations"
              description="Expose answer keys on the student's result screen"
              checked={quizData.show_correct_answers}
              onChange={(val) => setQuizData({ ...quizData, show_correct_answers: val })}
            />
          </div>

          {/* Bottom Action Footer for Step 2 */}
          <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button variant="outline" icon={ArrowLeft} onClick={() => setCurrentStep(1)}>
              Back to Question Builder
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="secondary" icon={Save} isLoading={saving} onClick={() => handleSaveQuiz(false)}>
                Save as Draft
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon={Zap}
                isLoading={saving}
                onClick={() => handleSaveQuiz(true)}
                className="w-full sm:w-auto font-black shadow-xs py-3 px-6"
              >
                Publish & Start Quiz Live Now
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Publish Confirmation Modal */}
      <Modal
        isOpen={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        title="Publish Quiz Live & Start Immediately"
        description="Publishing will activate the quiz immediately and generate shareable links for your students:"
      >
        <div className="space-y-3 py-2 text-xs sm:text-sm text-zinc-600">
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1 font-mono">
            <p><strong className="text-zinc-900">Title:</strong> {quizData.title || 'Untitled Quiz'}</p>
            <p><strong className="text-zinc-900">Total Questions:</strong> {questions.length}</p>
            <p><strong className="text-zinc-900">Total Marks:</strong> {totalMarksSum}</p>
            <p><strong className="text-zinc-900">Duration:</strong> {quizData.duration_minutes} Mins</p>
            {quizData.start_time && <p><strong className="text-zinc-900">Window Start:</strong> {new Date(quizData.start_time).toLocaleString()}</p>}
            {quizData.end_time && <p><strong className="text-zinc-900">Window End:</strong> {new Date(quizData.end_time).toLocaleString()}</p>}
          </div>
          <p className="text-xs text-zinc-500">Students with the link or quiz code will be able to start the exam immediately.</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
          <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
            Cancel
          </Button>
          <Button variant="primary" icon={Globe} isLoading={saving} onClick={() => handleSaveQuiz(true)}>
            Confirm & Start Quiz Live
          </Button>
        </div>
      </Modal>
    </div>
  );
};
