import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export const Alert = ({ type = 'info', title, children, className = '' }) => {
  const styles = {
    info: 'bg-zinc-50 border-zinc-300 text-zinc-900',
    success: 'bg-zinc-900 text-white border-zinc-900',
    warning: 'bg-zinc-100 border-zinc-400 text-zinc-900',
    error: 'bg-zinc-100 border-zinc-900 text-zinc-900 font-medium'
  };

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : type === 'warning' ? AlertTriangle : Info;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles[type] || styles.info} ${className}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="text-xs sm:text-sm leading-relaxed">
        {title && <h4 className="font-bold mb-0.5">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
};
