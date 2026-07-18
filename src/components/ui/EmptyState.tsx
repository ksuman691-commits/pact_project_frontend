'use client';

import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-slate-400">
          {icon}
        </div>
      )}
      
      <h3 className="text-h3 font-bold text-slate-950 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-body-md text-slate-600 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="md"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
