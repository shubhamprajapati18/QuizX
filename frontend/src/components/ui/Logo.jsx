import React from 'react';

export const Logo = ({ size = 'md', className = '', showBadge = false, light = false }) => {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl sm:text-5xl',
  };

  const textColor = light ? 'text-white' : 'text-zinc-900';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`font-doto font-black tracking-tight ${sizes[size] || sizes.md} ${textColor} leading-none select-none`}>
        QuizX
      </span>
      {showBadge && (
        <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${
          light ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-100 text-zinc-700 border-zinc-300'
        }`}>
          PLATFORM
        </span>
      )}
    </div>
  );
};
