import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { DropdownMenu } from '../ui/DropdownMenu';
import { LogOut, User, LayoutDashboard, BookOpen, Menu, ExternalLink } from 'lucide-react';

export const PublicNavbar = ({ onOpenJoinModal }) => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo */}
        <a href="/" className="flex items-center group shrink-0">
          <Logo size="md" showBadge className="hidden sm:flex" />
          <Logo size="sm" className="sm:hidden" />
        </a>

        {/* Action CTAs */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <a
            href="https://webdevvtheory.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="shiny-teal-btn px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold inline-flex items-center gap-1 shadow-xs shrink-0"
            title="Try WebDevTheory"
          >
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>
              <span className="hidden md:inline">Also Try: </span>WebDevTheory
            </span>
          </a>

          <Button variant="secondary" size="sm" icon={BookOpen} onClick={onOpenJoinModal} className="px-2 sm:px-3 text-xs">
            <span className="hidden xs:inline">Join</span> Quiz
          </Button>

          {isAuthenticated ? (
            <a href="/dashboard">
              <Button variant="primary" size="sm" icon={LayoutDashboard} className="px-2.5 sm:px-3 text-xs">
                <span className="hidden sm:inline">Workspace</span>
                <span className="sm:hidden">App</span>
              </Button>
            </a>
          ) : (
            <a href="/login">
              <Button variant="primary" size="sm" className="px-2.5 sm:px-3 text-xs">
                <span className="hidden sm:inline">Create Quiz</span>
                <span className="sm:hidden">Login</span>
              </Button>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};

export const FacultyHeader = ({ title = 'Dashboard', onToggleMobileSidebar }) => {
  const { faculty, logout } = useAuth();

  const dropdownItems = [
    { label: 'Profile', icon: User, onClick: () => (window.location.href = '/dashboard/profile') },
    { divider: true },
    { label: 'Sign Out', icon: LogOut, danger: true, onClick: logout }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-zinc-200 px-3 sm:px-6 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile menu trigger button */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 sm:p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 border border-zinc-200 shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-zinc-900 tracking-tight truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <a
          href="https://webdevvtheory.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex shiny-teal-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold items-center gap-1.5 shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Also Try: WebDevTheory</span>
        </a>

        <a href="/dashboard/create" className="hidden sm:inline-block">
          <Button variant="primary" size="sm">
            + New Quiz
          </Button>
        </a>

        {/* User Dropdown */}
        <DropdownMenu
          trigger={
            <button className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs shadow-xs font-mono shrink-0">
                {faculty?.name ? faculty.name.charAt(0).toUpperCase() : 'F'}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-bold text-zinc-900 leading-none truncate max-w-[120px]">{faculty?.name || 'Faculty'}</p>
                <p className="text-[10px] text-zinc-500 truncate max-w-[120px] mt-0.5">{faculty?.institution || 'Educator'}</p>
              </div>
            </button>
          }
          items={dropdownItems}
        />
      </div>
    </header>
  );
};
