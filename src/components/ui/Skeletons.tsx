'use client';

export function SkeletonCard() {
  return (
    <div className="h-48 bg-slate-200 rounded-md animate-pulse" />
  );
}

export function SkeletonText({ lines = 1 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-slate-200 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'} animate-pulse`}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  return (
    <div className={`${sizeClasses[size]} bg-slate-200 rounded-full animate-pulse flex-shrink-0`} />
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-slate-200 rounded-md h-24 animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonFeed() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          {/* Header with avatar and title */}
          <div className="flex gap-3 items-start">
            <SkeletonAvatar size="md" />
            <div className="flex-1 space-y-2">
              <SkeletonText lines={1} />
              <div className="w-1/3 h-3 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          
          {/* Content card */}
          <div className="h-40 bg-slate-200 rounded-md animate-pulse" />
          
          {/* Actions */}
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-8 flex-1 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPactCard() {
  return (
    <div className="space-y-3 p-4 bg-white rounded-md border border-slate-200">
      <div className="flex gap-3 items-start">
        <SkeletonAvatar size="sm" />
        <div className="flex-1 space-y-2">
          <SkeletonText lines={1} />
          <div className="w-1/2 h-3 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-20 bg-slate-200 rounded animate-pulse" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 flex-1 bg-slate-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
