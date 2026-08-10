import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const base = 'inline-flex items-center font-mono font-medium rounded-md transition-colors select-none';

  const variants = {
    default: 'bg-zinc-100 text-zinc-800 border border-zinc-300',
    live: 'bg-zinc-900 text-white border border-zinc-900 font-bold',
    draft: 'bg-zinc-100 text-zinc-600 border border-zinc-300',
    scheduled: 'bg-zinc-200 text-zinc-900 border border-zinc-400 font-semibold',
    completed: 'bg-zinc-900 text-white border border-zinc-900 font-bold',
    closed: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
    archived: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
    success: 'bg-zinc-900 text-white font-bold',
    danger: 'bg-zinc-100 text-zinc-900 border border-zinc-400 font-bold',
    warning: 'bg-zinc-100 text-zinc-800 border border-zinc-300',
    brand: 'bg-zinc-900 text-white font-bold',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider',
    md: 'text-xs px-2.5 py-0.5 tracking-wide',
    lg: 'text-xs px-3 py-1 font-bold tracking-wide',
  };

  const currentVariant = variants[variant.toString().toLowerCase()] || variants.default;

  return (
    <span className={`${base} ${currentVariant} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
};
