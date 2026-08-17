import React from 'react';
import { Logo } from '../ui/Logo';
import { Shield, Award, Cpu, Globe, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800/80 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Logo size="lg" light />
          </div>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
            Independent, multi-faculty online quiz and assessment platform. Empowering educators to create, share, and evaluate timed online exams with instant analytics.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400 pt-1">
            <span className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800"><Shield className="w-3.5 h-3.5 text-zinc-300" /> Isolated Workspaces</span>
            <span className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800"><Award className="w-3.5 h-3.5 text-zinc-300" /> Auto-Grading</span>
            <span className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800"><Cpu className="w-3.5 h-3.5 text-zinc-300" /> Document Parser</span>
          </div>
        </div>

        {/* Quick Links Column */}
        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
          <ul className="space-y-2.5 text-xs">
            <li><a href="/login" className="hover:text-white transition-colors">Faculty Sign In</a></li>
            <li><a href="/register" className="hover:text-white transition-colors">Create Faculty Account</a></li>
            <li><a href="/#features" className="hover:text-white transition-colors">Platform Features</a></li>
            <li><a href="/#how-it-works" className="hover:text-white transition-colors">Workflow Guide</a></li>
          </ul>
        </div>

        {/* Connect & Social Column */}
        <div>
          <div className="space-y-3 text-xs">
            <p className="text-zinc-200 font-bold font-mono text-xs tracking-wide">
              Built & Developed by Shubham Prajapati
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {/* X (Twitter) Button */}
              <a
                href="https://x.com/SPrajapati16222"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors shadow-xs"
              >
                <span className="font-extrabold text-xs">𝕏</span> Twitter / X <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>

              {/* LinkedIn Button */}
              <a
                href="https://www.linkedin.com/in/shubhamprajapati18/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors shadow-xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg> LinkedIn <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
        <p>© {new Date().getFullYear()} QuizX Assessment Platform. All rights reserved.</p>
        <p className="font-mono text-[11px] text-zinc-400 italic">
          "Any sufficiently advanced technology is indistinguishable from magic." — Arthur C. Clarke
        </p>
      </div>
    </footer>
  );
};

