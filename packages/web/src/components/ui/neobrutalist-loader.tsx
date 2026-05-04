"use client";

interface NeobrutalistLoaderProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface NeobrutalistLoaderMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NeobrutalistLoaderMark({
  size = 'md',
  className = '',
}: NeobrutalistLoaderMarkProps) {
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const cargoClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      aria-label="Loading Earth Optimization System"
      className={`relative ${sizeClasses[size]} ${className}`}
      role="status"
    >
      <div className="absolute inset-0 border-4 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="absolute inset-[18%] rounded-full border-2 border-foreground" />
        <div className="absolute left-1/2 top-[18%] h-[64%] w-[2px] -translate-x-1/2 bg-foreground/70" />
        <div className="absolute left-[18%] top-1/2 h-[2px] w-[64%] -translate-y-1/2 bg-foreground/70" />
        <div className="absolute left-[28%] top-[18%] h-[64%] w-[18%] rounded-full border-l-2 border-r-2 border-foreground/70" />
        <div className="absolute right-[28%] top-[18%] h-[64%] w-[18%] rounded-full border-l-2 border-r-2 border-foreground/70" />

        <div className="earth-os-orbit absolute inset-2">
          <div
            className={`absolute left-1/2 top-0 -translate-x-1/2 border-2 border-foreground bg-brutal-cyan shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${cargoClasses[size]}`}
          />
        </div>

        <div className="absolute bottom-2 left-2 right-2 h-2 border-2 border-foreground bg-background">
          <div className="earth-os-packet h-full w-1/3 bg-foreground" />
        </div>
      </div>

      <style jsx>{`
        .earth-os-orbit {
          animation: earth-os-orbit 1.8s linear infinite;
          transform-origin: center;
        }

        .earth-os-packet {
          animation: earth-os-packet 1.2s steps(5, end) infinite;
        }

        @keyframes earth-os-orbit {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes earth-os-packet {
          0% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(200%);
          }
          100% {
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .earth-os-orbit,
          .earth-os-packet {
            animation: none;
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
      <NeobrutalistLoaderMark size={size} />

      {/* Loading Message */}
      {message && (
        <div className="relative">
          <div className="text-xl font-black uppercase tracking-wider border-4 border-foreground bg-background px-6 py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {message}
          </div>
        </div>
      )}

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
