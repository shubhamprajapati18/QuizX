import React from 'react';

export const Progress = ({ value = 0, max = 100, label, color = 'brand', className = '' }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-xs font-semibold text-zinc-600 mb-1">
          <span>{label}</span>
          <span className="font-mono font-bold">{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-200">
        <div
          className="h-full transition-all duration-300 rounded-full bg-zinc-900"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
