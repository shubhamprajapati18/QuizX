import React from 'react';

export const Card = ({ children, className = '', hoverEffect = false, onClick, ...props }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border border-zinc-200 shadow-xs ${
      hoverEffect ? 'hover:border-zinc-400 hover:shadow-card-hover transition-all duration-150 cursor-pointer' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-5 pb-3 border-b border-zinc-100 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-base sm:text-lg font-bold text-zinc-900 tracking-tight ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-xs sm:text-sm text-zinc-500 mt-0.5 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-5 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-5 pt-3 border-t border-zinc-100 bg-zinc-50/50 rounded-b-xl flex items-center justify-between ${className}`}>
    {children}
  </div>
);
