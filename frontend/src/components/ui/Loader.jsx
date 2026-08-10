import React from 'react';
import { Logo } from './Logo';
import { Loader2 } from 'lucide-react';

export const Loader = ({ size = 'md', className = '', label = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-zinc-200 border-t-zinc-900 animate-spin shrink-0`}
        role="status"
        aria-label="loading"
      />
      {label && <span className="text-xs font-mono text-zinc-600 font-medium">{label}</span>}
    </div>
  );
};

// Full-Page Route / Application Loader
Loader.Page = ({ message = 'Loading QuizX Workspace...' }) => {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-50 flex flex-col items-center justify-center p-4 selection:bg-zinc-900 selection:text-white">
      <div className="text-center space-y-4 max-w-sm">
        <div className="inline-block animate-pulse">
          <Logo size="xl" showBadge />
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
          <span className="text-xs font-mono font-bold tracking-wide uppercase text-zinc-600">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};

// Container / Card Section Loader
Loader.Section = ({ message = 'Fetching data...', height = 'h-48', className = '' }) => {
  return (
    <div className={`w-full ${height} bg-white rounded-xl border border-zinc-200 flex flex-col items-center justify-center p-6 text-center shadow-xs ${className}`}>
      <div className="w-6 h-6 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin mb-3" />
      <p className="text-xs font-mono text-zinc-500 font-bold">{message}</p>
    </div>
  );
};

// Inline Compact Loader
Loader.Inline = ({ label = 'Loading...', className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-mono text-zinc-600 ${className}`}>
      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-900" />
      {label}
    </span>
  );
};

// Compact Button Action Loader
Loader.Button = ({ className = '' }) => {
  return (
    <div
      className={`w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0 ${className}`}
      role="status"
    />
  );
};

// Semi-Transparent Backdrop Overlay Loader
Loader.Overlay = ({ message = 'Saving changes...' }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-2xl flex flex-col items-center gap-3 max-w-xs text-center">
        <div className="w-8 h-8 rounded-full border-3 border-zinc-200 border-t-zinc-900 animate-spin" />
        <p className="text-xs font-bold font-mono text-zinc-900 uppercase tracking-wider">{message}</p>
      </div>
    </div>
  );
};

// Theme-Consistent Skeleton Primitives
Loader.Skeleton = ({ className = '', variant = 'text' }) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    title: 'h-6 w-3/4 rounded-md',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-32 w-full rounded-xl border border-zinc-200 bg-white p-4',
    button: 'h-10 w-28 rounded-lg',
  };

  return (
    <div
      className={`bg-zinc-100 animate-pulse ${variantStyles[variant] || ''} ${className}`}
    />
  );
};
