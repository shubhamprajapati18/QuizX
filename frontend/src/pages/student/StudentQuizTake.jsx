import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { Modal } from '../../components/ui/Modal';
import { Logo } from '../../components/ui/Logo';
import { Loader } from '../../components/ui/Loader';
import { api } from '../../services/api';
import { Clock, CheckCircle2, ArrowRight, ArrowLeft, Send, Menu, X, WifiOff, RefreshCw } from 'lucide-react';

export const StudentQuizTake = () => {
  const pathParts = window.location.pathname.split('/');
  const attemptId = pathParts[pathParts.length - 1];

  const [attemptData, setAttemptData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimeOutModal, setShowTimeOutModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Reconnection Sync Handler
  const flushPendingSyncQueue = useCallback(async () => {
    try {
      const pendingRaw = localStorage.getItem(`pending_sync_${attemptId}`);
      if (!pendingRaw) return;
      const pendingQueue = JSON.parse(pendingRaw);
      if (!Array.isArray(pendingQueue) || pendingQueue.length === 0) return;

      setSaveStatus('Syncing...');
      const res = await api.attempts.syncBatch(attemptId, { answers: pendingQueue });
      if (res.success) {
        localStorage.removeItem(`pending_sync_${attemptId}`);
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus('Saved'), 1500);
      }
    } catch (err) {
      console.warn('Sync pending queue error:', err);
    }
  }, [attemptId]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushPendingSyncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus('Offline — saved locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushPendingSyncQueue]);

  // Initial Attempt & Question Load (Resume on Refresh)
  useEffect(() => {
    async function loadActiveAttempt() {
      try {
        setLoading(true);
        const res = await api.attempts.getActive(attemptId);

        if (res.success) {
          if (res.isCompleted) {
            window.location.href = `/quiz/result/${attemptId}`;
            return;
          }

          setAttemptData(res.attempt);
          setQuestions(res.questions || []);
          setTimeLeftSeconds(res.attempt.remainingSeconds);

          // Restore saved answers from server
          const restoredAnswers = { ...(res.savedAnswers || {}) };

          // Merge with any unsynced local answers
          const localSaved = localStorage.getItem(`attempt_answers_${attemptId}`);
          if (localSaved) {
            try {
              const parsedLocal = JSON.parse(localSaved);
              Object.assign(restoredAnswers, parsedLocal);
            } catch (e) {
              console.error('Local storage parse error:', e);
            }
          }
          setAnswers(restoredAnswers);

          // Restore current question index
          const savedIndex = localStorage.getItem(`attempt_q_index_${attemptId}`);
          if (savedIndex !== null) {
            const parsedIdx = Number(savedIndex);
            if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < (res.questions || []).length) {
              setCurrentIndex(parsedIdx);
            }
          }

          // Cache attempt metadata locally for offline resilience
          localStorage.setItem(`attempt_cache_${attemptId}`, JSON.stringify({
            attempt: res.attempt,
            questions: res.questions
          }));
        } else {
          // Fallback to local cache if network call fails
          const cached = localStorage.getItem(`attempt_cache_${attemptId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            setAttemptData(parsed.attempt);
            setQuestions(parsed.questions || []);
          } else {
            window.location.href = '/';
          }
        }
      } catch (err) {
        console.error('Error loading active attempt:', err);
        const cached = localStorage.getItem(`attempt_cache_${attemptId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setAttemptData(parsed.attempt);
          setQuestions(parsed.questions || []);
        } else {
          window.location.href = '/';
        }
      } finally {
        setLoading(false);
      }
    }

    loadActiveAttempt();
  }, [attemptId]);

  // Server-Enforced Timer Countdown Effect
  useEffect(() => {
    if (timeLeftSeconds === null) return;

    if (timeLeftSeconds <= 0) {
      setShowTimeOutModal(true);
      handleFinalSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowTimeOutModal(true);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  // Track & Persist Current Question Index
  const handleNavigateQuestion = (newIndex) => {
    if (newIndex >= 0 && newIndex < questions.length) {
      setCurrentIndex(newIndex);
      localStorage.setItem(`attempt_q_index_${attemptId}`, newIndex.toString());
    }
  };

  // Option Selection & Progressive Auto-Save + Offline Queue
  const handleSelectOption = async (questionId, optionId) => {
    const updatedAnswers = { ...answers, [questionId]: optionId };
    setAnswers(updatedAnswers);

    // Save to client storage immediately for recovery
    localStorage.setItem(`attempt_answers_${attemptId}`, JSON.stringify(updatedAnswers));

    if (!navigator.onLine) {
      setSaveStatus('Offline — saved locally');
      // Queue in pending sync
      const pendingRaw = localStorage.getItem(`pending_sync_${attemptId}`);
      const queue = pendingRaw ? JSON.parse(pendingRaw) : [];
      const filtered = queue.filter(item => item.questionId !== questionId);
      filtered.push({ questionId, selectedOption: optionId });
      localStorage.setItem(`pending_sync_${attemptId}`, JSON.stringify(filtered));
      return;
    }

    setSaveStatus('Saving...');
    try {
      await api.attempts.saveResponse(attemptId, {
        questionId,
        selectedOption: optionId
      });
      setSaveStatus('Saved');
    } catch (err) {
      setSaveStatus('Offline — saved locally');
      const pendingRaw = localStorage.getItem(`pending_sync_${attemptId}`);
      const queue = pendingRaw ? JSON.parse(pendingRaw) : [];
      const filtered = queue.filter(item => item.questionId !== questionId);
      filtered.push({ questionId, selectedOption: optionId });
      localStorage.setItem(`pending_sync_${attemptId}`, JSON.stringify(filtered));
    }
  };

  // Final Submission Handler
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Flush any unsynced answers before final submit
      await flushPendingSyncQueue();

      const res = await api.attempts.submit(attemptId);
      if (res.success) {
        localStorage.removeItem(`attempt_answers_${attemptId}`);
        localStorage.removeItem(`attempt_q_index_${attemptId}`);
        localStorage.removeItem(`attempt_cache_${attemptId}`);
        localStorage.removeItem(`pending_sync_${attemptId}`);
        window.location.href = `/quiz/result/${attemptId}`;
      }
    } catch (err) {
      alert(err.message || 'Error submitting exam attempt.');
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) return '--:--';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !attemptData || questions.length === 0) {
    return <Loader.Page message="Restoring Persistent Exam Workspace..." />;
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).filter(k => answers[k]).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-zinc-50 flex flex-col font-sans select-none">
      {/* Sticky Exam Top Bar */}
      <header className="sticky top-0 z-30 bg-zinc-900 text-white h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between border-b border-zinc-800 shadow-xs gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => setShowMobileNav(true)}
            className="lg:hidden p-1.5 rounded-lg bg-zinc-800 text-white border border-zinc-700 shrink-0"
            aria-label="Open Question Palette"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <Logo size="sm" light className="shrink-0" />
          <span className="font-bold text-xs sm:text-sm truncate max-w-[110px] xs:max-w-[160px] sm:max-w-md border-l border-zinc-700 pl-2 sm:pl-3">
            {attemptData.quiz_title}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Subtle Auto-Save Status Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-zinc-400" />
                <span>Offline — saved locally</span>
              </>
            ) : saveStatus === 'Saving...' || saveStatus === 'Syncing...' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                <span>{saveStatus}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                <span>Progress Saved</span>
              </>
            )}
          </div>

          {/* Countdown Timer */}
          <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border font-mono font-extrabold text-xs sm:text-base ${
            timeLeftSeconds && timeLeftSeconds < 300
              ? 'bg-zinc-800 text-white border-zinc-600 animate-pulse'
              : 'bg-zinc-800 text-white border-zinc-700'
          }`}>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 shrink-0" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-transparent bg-white text-zinc-900 font-bold text-xs sm:text-sm hover:bg-zinc-100 transition-colors shadow-xs shrink-0"
            onClick={() => setShowSubmitModal(true)}
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Submit Quiz</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-y-auto lg:overflow-hidden">
        {/* Question Content View */}
        <main className="lg:col-span-3 flex flex-col gap-4 lg:overflow-hidden h-full">

          {/* Active Question Box */}
          <Card className="p-4 sm:p-6 border border-zinc-200 shadow-xs relative flex flex-col flex-1 lg:overflow-hidden">
            <div className="flex-1 lg:overflow-y-auto pr-1 sm:pr-2 pb-4">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded border border-zinc-300">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <Badge variant="draft" className="font-mono text-xs">
                Marks: {currentQuestion.marks || 1}
              </Badge>
            </div>

            <h2 className="text-sm sm:text-base font-bold text-zinc-900 mb-5 leading-relaxed whitespace-pre-wrap font-sans">
              {currentQuestion.question_text}
            </h2>

            {/* Option Choices */}
            <div className="space-y-3 mb-6">
              {(currentQuestion.options || []).map((opt, optIdx) => {
                const isSelected = answers[currentQuestion.id] === opt.id || answers[currentQuestion.id] === opt.text;
                const optionLabel = String.fromCharCode(65 + optIdx);

                return (
                  <button
                    key={opt.id || optIdx}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id || opt.text)}
                    className={`w-full text-left py-2.5 px-3 sm:p-3.5 rounded-xl border transition-all duration-150 flex items-start sm:items-center justify-between group ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white font-bold shadow-xs'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <span className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center border shrink-0 mt-0.5 sm:mt-0 ${
                        isSelected
                          ? 'bg-white text-zinc-900 border-white'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200 group-hover:border-zinc-300'
                      }`}>
                        {optionLabel}
                      </span>
                      <span className="text-xs sm:text-sm whitespace-pre-wrap font-mono break-words">{opt.text}</span>
                    </div>

                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2 mt-0.5 sm:mt-0" />}
                  </button>
                );
              })}
            </div>

            </div>

            {/* Question Action Navigation Buttons */}
            <div className="pt-4 mt-auto shrink-0 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => handleNavigateQuestion(currentIndex - 1)}
                icon={ArrowLeft}
                className="text-xs sm:text-sm"
              >
                Previous
              </Button>

              {isLastQuestion ? (
                <Button
                  variant="primary"
                  className="bg-zinc-900 text-white hover:bg-zinc-800 font-bold text-xs sm:text-sm"
                  onClick={() => setShowSubmitModal(true)}
                  icon={Send}
                >
                  Finish & Submit
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => handleNavigateQuestion(currentIndex + 1)}
                  icon={ArrowRight}
                  className="text-xs sm:text-sm"
                >
                  Next Question
                </Button>
              )}
            </div>
          </Card>
        </main>

        {/* Sidebar Question Palette Matrix */}
        <aside className="hidden lg:block lg:col-span-1 overflow-hidden">
          <Card className="p-4 border-zinc-200 shadow-xs flex flex-col max-h-full">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-3 mb-4 shrink-0">
              Question Palette
            </h3>

            <div className="grid grid-cols-5 gap-1.5 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => handleNavigateQuestion(idx)}
                    className={`h-9 w-full rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'border-2 border-zinc-900 bg-white text-zinc-900'
                        : isAnswered
                        ? 'bg-zinc-900 text-white border border-zinc-900'
                        : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 space-y-2 text-[11px] font-mono text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-zinc-900" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-zinc-50 border border-zinc-300" />
                <span>Unanswered ({questions.length - answeredCount})</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* Mobile Question Palette Drawer Modal */}
      {showMobileNav && (
        <Modal
          isOpen={showMobileNav}
          onClose={() => setShowMobileNav(false)}
          title="Question Navigation Palette"
        >
          <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto py-2">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id || idx}
                  onClick={() => {
                    handleNavigateQuestion(idx);
                    setShowMobileNav(false);
                  }}
                  className={`h-10 w-full rounded-lg text-xs font-mono font-bold flex items-center justify-center border ${
                    isCurrent
                      ? 'ring-2 ring-zinc-900 bg-zinc-100 text-zinc-900 font-extrabold'
                      : isAnswered
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Confirm Submission Dialog Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Exam Submission"
        description="Are you sure you want to submit your final answers? Once submitted, you cannot modify your responses."
      >
        <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono space-y-1 mb-4">
          <p><strong className="text-zinc-900">Total Questions:</strong> {questions.length}</p>
          <p><strong className="text-zinc-900">Questions Answered:</strong> {answeredCount}</p>
          <p><strong className="text-zinc-900">Unanswered Questions:</strong> {questions.length - answeredCount}</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
            Return to Exam
          </Button>
          <Button
            variant="primary"
            isLoading={isSubmitting}
            onClick={() => handleFinalSubmit(false)}
            icon={Send}
          >
            Confirm Submission
          </Button>
        </div>
      </Modal>

      {/* Time-Out Submission Notification Modal */}
      <Modal
        isOpen={showTimeOutModal}
        onClose={() => {}}
        title="Exam Time Has Expired"
        description="The allocated exam duration has ended. Your answers have been recorded automatically."
      >
        <div className="flex justify-end pt-4">
          <Button variant="primary" isLoading={isSubmitting} onClick={() => handleFinalSubmit(true)}>
            View Final Results
          </Button>
        </div>
      </Modal>
    </div>
  );
};
