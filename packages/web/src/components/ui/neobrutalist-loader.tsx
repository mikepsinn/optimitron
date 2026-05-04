"use client";

interface NeobrutalistLoaderProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface NeobrutalistLoaderMarkProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NeobrutalistLoaderMark({
  label = 'OPTIMIZING EARTH',
  size = 'md',
  className = '',
}: NeobrutalistLoaderMarkProps) {
  const panelClasses = {
    sm: 'w-40 p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    md: 'w-56 p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
    lg: 'w-72 p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
  };

  const labelClasses = {
    sm: 'text-[0.55rem]',
    md: 'text-[0.68rem]',
    lg: 'text-xs',
  };

  const barClasses = {
    sm: 'h-2',
    md: 'h-2.5',
    lg: 'h-3',
  };

  return (
    <div
      aria-label={`Loading: ${label}`}
      className={`inline-flex ${className}`}
      role="status"
    >
      <div
        className={`border-2 border-foreground bg-background font-mono text-foreground ${panelClasses[size]}`}
      >
        <div>
          <span
            className={`block text-center font-black leading-tight tracking-[0.16em] ${labelClasses[size]}`}
          >
            {label}
          </span>
        </div>

        <div
          className={`mt-2 overflow-hidden border border-foreground bg-background ${barClasses[size]}`}
        >
          <div className="earth-os-progress h-full bg-foreground" />
        </div>
      </div>

      <style jsx>{`
        .earth-os-progress {
          animation: earth-os-progress 1.4s steps(7, end) infinite;
          transform-origin: left;
        }

        @keyframes earth-os-progress {
          0% {
            transform: scaleX(0.18);
          }
          45% {
            transform: scaleX(0.72);
          }
          75% {
            transform: scaleX(1);
          }
          100% {
            transform: scaleX(0.18);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .earth-os-progress {
            animation: none;
          }

          .earth-os-progress {
            transform: scaleX(0.72);
          }
        }
      `}</style>
    </div>
  );
}

export function NeobrutalistLoader({
  message = 'Booting Earth Optimization System',
  submessage = 'Thank you for your patience. Your civilization is very important to us.',
  size = 'md',
  className = '',
}: NeobrutalistLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-6 py-12 ${className}`}>
      <NeobrutalistLoaderMark label={message} size={size} />

      {submessage && (
        <p className="max-w-xl text-center text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {submessage}
        </p>
      )}
    </div>
  );
}

// Alternative loader with spinning square
export function NeobrutalistSpinner({ message, size = 'md' }: NeobrutalistLoaderProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      <div
        className={`${sizeClasses[size]} border-4 border-foreground bg-brutal-cyan rounded-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
        style={{
          animation: 'spin 1s ease-in-out infinite',
        }}
      />

      {message && (
        <div className="text-lg font-bold uppercase tracking-wide">
          {message}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Card-style skeleton loader with neobrutalist design
export function NeobrutalistCardLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border-4 border-foreground bg-background rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b-4 border-foreground bg-muted">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-muted border-2 border-foreground animate-pulse" />
              <div className="h-6 bg-muted border-2 border-foreground rounded w-48 animate-pulse" />
            </div>
            <div className="h-4 bg-muted border-2 border-foreground rounded w-64 animate-pulse" />
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Progress bar */}
            <div className="h-3 bg-muted border-2 border-foreground rounded-full overflow-hidden">
              <div
                className="h-full bg-brutal-pink border-r-2 border-foreground animate-pulse"
                style={{ width: '60%' }}
              />
            </div>

            {/* Side effects */}
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-7 bg-brutal-yellow border-2 border-foreground rounded-full w-24 animate-pulse"
                  style={{ animationDelay: `${j * 0.1}s` }}
                />
              ))}
            </div>

            {/* Phases */}
            <div className="flex gap-2">
              {[1, 2].map((j) => (
                <div
                  key={j}
                  className="h-7 bg-brutal-cyan border-2 border-foreground rounded-full w-20 animate-pulse"
                  style={{ animationDelay: `${j * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
