import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 ${
            Icon ? 'pl-9' : ''
          } ${
            error ? 'border-zinc-900 focus:border-zinc-900 focus:ring-zinc-900' : 'border-zinc-200'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-zinc-900">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-zinc-500">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
