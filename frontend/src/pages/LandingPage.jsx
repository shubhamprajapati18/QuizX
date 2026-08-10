import React, { useState } from 'react';
import { PublicNavbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { StudentJoinModal } from './student/StudentJoinModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import {
  Sparkles,
  ArrowRight,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  Share2,
  BarChart2,
  Users,
  ShieldCheck,
  Zap,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

export const LandingPage = () => {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    {
      icon: FileText,
      title: 'Manual Quiz Builder',
      description: 'Google Forms-style interactive builder with multiple choice options, custom marking scheme, and explanation fields.'
    },
    {
      icon: Upload,
      title: 'PDF & DOCX Import',
      description: 'Upload existing test papers. Our intelligent parser extracts questions and options into editable cards instantly.'
    },
    {
      icon: Share2,
      title: 'Instant Link Sharing',
      description: 'Generate unique quiz codes and shareable URLs. Students access directly without platform sign-up friction.'
    },
    {
      icon: Clock,
      title: 'Server-Enforced Timers',
      description: 'Precise backend countdown timer prevents client clock tampering and submits answers automatically when time expires.'
    },
    {
      icon: CheckCircle2,
      title: 'Automatic Evaluation',
      description: 'Instant score calculation, percentage grading, and result generation following faculty visibility controls.'
    },
    {
      icon: BarChart2,
      title: 'Question Analytics',
      description: 'Identify hard questions with accuracy heatmaps, option distribution charts, and student performance summaries.'
    }
  ];

  const faqs = [
    {
      q: 'Do students need to create an account to take a quiz?',
      a: 'No. Students only need the unique Quiz Link or 6-character Quiz Code shared by their educator. They enter the required participant details and start immediately.'
    },
    {
      q: 'How does PDF & DOCX question import work?',
      a: 'You can drag and drop any test paper document. The backend automatically parses question stems, multiple choice options (A, B, C, D), and correct answers, displaying them in an editable builder for final review.'
    },
    {
      q: 'Is my faculty account isolated from other teachers?',
      a: 'Yes. QuizX uses strict multi-tenant architecture. Your quizzes, questions, student responses, and analytics are completely private to your faculty account.'
    },
    {
      q: 'Can I control whether students see correct answers after submission?',
      a: 'Absolutely. In Quiz Settings, you can choose to show scores immediately, release results later, or hide correct answer keys as required for formal examinations.'
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <PublicNavbar onOpenJoinModal={() => setIsJoinModalOpen(true)} />

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-16 sm:pb-24 overflow-hidden border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge variant="draft" className="mb-4 text-xs font-mono font-bold tracking-wider">
            MULTI-FACULTY ASSESSMENT PLATFORM
          </Badge>
          
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Create, Share & Conduct <span className="underline decoration-zinc-300 underline-offset-4">Online Quizzes</span> Effortlessly
          </h1>
          
          <p className="mt-5 text-sm sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            The minimal, high-performance platform for educators and institutes. Build manual quizzes or import PDF exam papers, share via short link, enforce timed exams, and analyze student results.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto sm:max-w-none">
            <a href="/register" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" icon={ArrowRight} className="w-full sm:w-auto py-3">
                Create Your Quiz
              </Button>
            </a>
            <Button
              variant="secondary"
              size="lg"
              icon={Zap}
              onClick={() => setIsJoinModalOpen(true)}
              className="w-full sm:w-auto py-3"
            >
              Join Quiz with Code
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-mono font-medium text-zinc-500">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-zinc-900" /> Isolated Faculty Workspaces</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-zinc-900" /> Frictionless Student Access</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-zinc-900" /> Auto-Grading Engine</span>
          </div>

          {/* Monochrome Product Preview / Mockup */}
          <div className="mt-12 max-w-5xl mx-auto bg-white rounded-xl shadow-card border border-zinc-200 overflow-hidden text-left">
            <div className="bg-zinc-900 rounded-t-xl p-3 sm:p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
                <span className="text-xs font-mono text-zinc-400">quizx.platform/quiz/7XK29P</span>
              </div>
              <Badge variant="live" size="sm">LIVE EXAM ACTIVE</Badge>
            </div>

            <div className="p-4 sm:p-6 bg-zinc-50 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-zinc-900 uppercase">Question 4 of 20</span>
                    <span className="text-xs font-mono text-zinc-500">2 Marks</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 mb-4">
                    Which data structure operates on a First-In, First-Out (FIFO) principle?
                  </h3>
                  <div className="space-y-2">
                    {['A. Stack', 'B. Queue', 'C. Binary Tree', 'D. Linked List'].map((opt, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs sm:text-sm font-medium transition-colors flex items-center justify-between ${
                          idx === 1 ? 'border-zinc-900 bg-zinc-100 font-bold text-zinc-900' : 'border-zinc-200 bg-white text-zinc-700'
                        }`}
                      >
                        <span>{opt}</span>
                        {idx === 1 && <CheckCircle2 className="w-4 h-4 text-zinc-900" />}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="p-4 text-center bg-zinc-900 text-white">
                  <span className="text-xs font-mono text-zinc-400 font-medium uppercase">Time Remaining</span>
                  <div className="text-2xl font-mono font-bold text-white mt-1">18:42</div>
                  <Progress value={65} className="mt-3" />
                </Card>

                <Card className="p-4">
                  <h4 className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider mb-2">Question Navigation</h4>
                  <div className="grid grid-cols-5 gap-1.5 text-xs font-mono font-bold text-center">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-md ${
                          i < 3 ? 'bg-zinc-200 text-zinc-900' : i === 3 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-16 sm:py-24 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Designed for Professional Assessment
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-600">
              Clean, minimal features built specifically for faculty members and academic institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card key={idx} hoverEffect className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 mb-2">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">{feat.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Step-by-Step */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <Badge variant="draft" className="mb-2">SIMPLE WORKFLOW</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Create → Share → Conduct → Evaluate
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Create Account', desc: 'Register as an independent faculty member in under 30 seconds.' },
              { num: '02', title: 'Build or Import', desc: 'Create questions manually or upload your PDF/DOCX exam paper.' },
              { num: '03', title: 'Share Quiz Code', desc: 'Publish and copy your shareable link or 6-digit code for students.' },
              { num: '04', title: 'Analyze Results', desc: 'View instant scores, item accuracy, and detailed student submissions.' }
            ].map((step, idx) => (
              <Card key={idx} className="p-6 relative bg-white border-zinc-200">
                <span className="text-2xl font-black font-mono text-zinc-300 block mb-2">{step.num}</span>
                <h3 className="text-base font-bold text-zinc-900 mb-1">{step.title}</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-16 sm:py-24 bg-white border-t border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <HelpCircle className="w-8 h-8 text-zinc-900 mx-auto mb-2" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-zinc-900 flex items-center justify-between hover:bg-zinc-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform shrink-0 ml-2 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Student Join Modal */}
      <StudentJoinModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
    </div>
  );
};
