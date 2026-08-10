import React from 'react';

export const Textarea = React.forwardRef(({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 ${
          error ? 'border-zinc-900 focus:border-zinc-900' : 'border-zinc-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs font-semibold text-zinc-900">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-zinc-500">{helperText}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
