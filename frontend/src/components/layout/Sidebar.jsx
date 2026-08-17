import React from 'react';
import {
  LayoutDashboard,
  BookOpenCheck,
  PlusCircle,
  BarChart3,
  PieChart,
  User,
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';

export const Sidebar = ({ activePath = '/dashboard', isMobileOpen = false, onCloseMobile }) => {
  const { faculty } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Quizzes', path: '/dashboard/quizzes', icon: BookOpenCheck },
    { label: 'Create Quiz', path: '/dashboard/create', icon: PlusCircle },
    { label: 'Results', path: '/dashboard/results', icon: BarChart3 },
    { label: 'Analytics', path: '/dashboard/analytics', icon: PieChart },
    { label: 'Profile Settings', path: '/dashboard/profile', icon: User },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-zinc-900 border-r border-zinc-200">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-200">
        <a href="/" className="flex items-center">
          <Logo size="md" />
        </a>
        {isMobileOpen && (
          <button onClick={onCloseMobile} className="text-zinc-500 hover:text-zinc-900 p-1.5 rounded-lg border border-zinc-200">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-mono uppercase font-bold tracking-wider text-zinc-400">
          Faculty Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path || (item.path !== '/dashboard' && activePath.startsWith(item.path));
          return (
            <a
              key={item.path}
              href={item.path}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-xs font-bold'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>

      {/* Faculty Profile Footer */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs shrink-0 font-mono">
            {faculty?.name ? faculty.name.charAt(0).toUpperCase() : 'F'}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-zinc-900 truncate">{faculty?.name || 'Faculty Member'}</p>
            <p className="text-[10px] text-zinc-500 truncate">{faculty?.institution || 'Educator'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Close mobile sidebar on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    if (isMobileOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer / Sheet */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-fade-in">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[85vw] bg-white z-10 h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
