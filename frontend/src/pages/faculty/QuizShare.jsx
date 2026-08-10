import React, { useState, useEffect } from 'react';
import { FacultyLayout } from '../../components/layout/FacultyLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ExternalLink, MessageSquare, Mail } from 'lucide-react';

export const QuizShare = () => {
  const pathParts = window.location.pathname.split('/');
  const quizId = pathParts[pathParts.length - 1];

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  if (loading) {
    return (
      <FacultyLayout title="Share Quiz">
        <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
      </FacultyLayout>
    );
  }

  const shareUrl = `${window.location.origin}/quiz/${quiz?.quiz_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Hello! Take the quiz "${quiz?.title}" on QuizX. Quiz Code: ${quiz?.quiz_code}\nLink: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Quiz Invitation: ${quiz?.title}`);
    const body = encodeURIComponent(`Dear Students,\n\nPlease complete the online quiz "${quiz?.title}".\n\nQuiz Code: ${quiz?.quiz_code}\nQuiz Link: ${shareUrl}\n\nThank you.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <FacultyLayout title="Share Quiz with Students" activePath="/dashboard/quizzes">
      <div className="max-w-2xl mx-auto py-4 sm:py-6">
        <Card className="p-6 sm:p-8 shadow-xs border-zinc-200 text-center space-y-6">
          <div>
            <Badge variant="live" className="mb-2">QUIZ IS LIVE & PUBLISHED</Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{quiz?.title}</h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">Share the link or passcode below with your participants</p>
          </div>

          {/* High Contrast Black Quiz Passcode Box */}
          <div className="p-6 rounded-xl bg-zinc-900 text-white shadow-xs">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400 block mb-1">
              Official Quiz Passcode
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-widest my-2 select-all">
              {quiz?.quiz_code}
            </div>
            <p className="text-xs text-zinc-400">Students enter this code on the homepage to start</p>
          </div>

          {/* Shareable Link Box */}
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3 text-left">
            <div className="truncate font-mono text-xs sm:text-sm text-zinc-800 font-medium">
              {shareUrl}
            </div>
            <Button variant="primary" size="sm" icon={copied ? Check : Copy} onClick={handleCopy} className="shrink-0">
              {copied ? 'Copied Link!' : 'Copy Link'}
            </Button>
          </div>

          {/* QR Code */}
          <div className="pt-4 border-t border-zinc-100 flex flex-col items-center">
            <span className="text-xs font-mono font-bold text-zinc-600 mb-3">Scan QR Code to Join Instantly</span>
            <div className="p-4 bg-white rounded-xl shadow-xs border border-zinc-300">
              <QRCodeSVG value={shareUrl} size={150} />
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-100">
            <Button variant="secondary" icon={MessageSquare} onClick={handleWhatsAppShare} className="w-full">
              Share on WhatsApp
            </Button>
            <Button variant="outline" icon={Mail} onClick={handleEmailShare} className="w-full">
              Share via Email
            </Button>
          </div>

          <div className="pt-4 flex justify-between items-center text-xs border-t border-zinc-100">
            <a href="/dashboard/quizzes" className="text-zinc-600 hover:text-zinc-900 font-bold">
              ← Return to My Quizzes
            </a>
            <a href={`/quiz/${quiz?.quiz_code}`} target="_blank" rel="noreferrer" className="text-zinc-900 font-bold hover:underline flex items-center gap-1">
              Open Quiz Page <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </Card>
      </div>
    </FacultyLayout>
  );
};
