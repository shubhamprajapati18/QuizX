import React from 'react';
import { Logo } from '../ui/Logo';
import { Shield, Award, Cpu } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-zinc-900 text-zinc-400 border-t border-zinc-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Logo size="lg" light />
          </div>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-4">
            Independent, multi-faculty online quiz and assessment platform. Empowering educators to create, share, and evaluate timed online exams with instant analytics.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-zinc-200" /> Isolated Workspaces</span>
            <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-zinc-200" /> Auto-Grading</span>
            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-zinc-200" /> Document Parser</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="/login" className="hover:text-white transition-colors">Faculty Sign In</a></li>
            <li><a href="/register" className="hover:text-white transition-colors">Create Faculty Account</a></li>
            <li><a href="/#features" className="hover:text-white transition-colors">Platform Features</a></li>
            <li><a href="/#how-it-works" className="hover:text-white transition-colors">Workflow Guide</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3">Student Access</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="/#join" className="hover:text-white transition-colors">Join Quiz with Code</a></li>
            <li><a href="/#faq" className="hover:text-white transition-colors">Student FAQ</a></li>
            <li><span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">No account required for students</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} QuizX Assessment Platform. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 font-mono text-[10px]">Developed by <a href="https://shubhamprajapati18.netlify.app/">Shubham Prajapati</a></p>
      </div>
    </footer>
  );
};
