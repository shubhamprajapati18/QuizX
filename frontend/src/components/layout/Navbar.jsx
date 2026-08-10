import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { DropdownMenu } from '../ui/DropdownMenu';
import { LogOut, User, Settings, LayoutDashboard, BookOpen, Menu } from 'lucide-react';

export const PublicNavbar = ({ onOpenJoinModal }) => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Doto Font Bold Logo */}
        <a href="/" className="flex items-center group">
          <Logo size="lg" showBadge />
        </a>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="secondary" size="sm" icon={BookOpen} onClick={onOpenJoinModal}>
            Join Quiz
          </Button>

          {isAuthenticated ? (
            <a href="/dashboard">
              <Button variant="primary" size="sm" icon={LayoutDashboard}>
                Workspace
              </Button>
            </a>
          ) : (
              <a href="/login">
                <Button variant="primary" size="sm">
                  Create Quiz
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
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-zinc-200 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger button */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <a href="/dashboard/create" className="hidden sm:inline-block">
          <Button variant="primary" size="sm">
            + New Quiz
          </Button>
        </a>

        {/* User Dropdown */}
        <DropdownMenu
          trigger={
            <button className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs shadow-xs font-mono">
                {faculty?.name ? faculty.name.charAt(0).toUpperCase() : 'F'}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-bold text-zinc-900 leading-none">{faculty?.name || 'Faculty'}</p>
                <p className="text-[10px] text-zinc-500 truncate max-w-[110px] mt-0.5">{faculty?.institution || 'Educator'}</p>
              </div>
            </button>
          }
          items={dropdownItems}
        />
      </div>
    </header>
  );
};
