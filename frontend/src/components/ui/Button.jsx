import React from 'react';
import { Loader } from './Loader';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none touch-manipulation active:scale-[0.98]';

  const variants = {
    primary: 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-900 shadow-xs font-semibold',
    secondary: 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 shadow-xs font-medium',
    outline: 'border border-zinc-300 text-zinc-800 bg-white hover:bg-zinc-100 shadow-xs',
    ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
    danger: 'bg-zinc-900 text-white border border-zinc-900 hover:bg-zinc-800 font-semibold',
    success: 'bg-zinc-900 text-white border border-zinc-900 hover:bg-zinc-800 font-semibold',
    accent: 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 font-medium',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[46px]',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader.Button />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};
