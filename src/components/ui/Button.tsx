'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50',
  secondary: 'bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50',
  ghost: 'bg-transparent text-slate-900 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50',
};

const sizes = {
  sm: 'px-3 py-2 text-sm font-medium rounded-md',
  md: 'px-4 py-2.5 text-base font-semibold rounded-lg',
  lg: 'px-6 py-3 text-base font-semibold rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  className,
  ...props
}: ButtonProps) {
  const variantClass = variants[variant];
  const sizeClass = sizes[size];
  
  const baseClass = 'inline-flex items-center justify-center gap-2 transition-colors focus-ring disabled:cursor-not-allowed touch-target';
  const combinedClass = `${baseClass} ${variantClass} ${sizeClass} ${className || ''}`;

  return (
    <button
      disabled={disabled || isLoading}
      className={combinedClass}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
