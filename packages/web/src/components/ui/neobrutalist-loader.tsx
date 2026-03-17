import React from 'react';

interface NeobrutalistLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NeobrutalistLoader({ message = 'Loading...', size = 'md' }: NeobrutalistLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      {/* Animated Neobrutalist Squares */}
      <div className="relative flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${sizeClasses[size]} border-4 border-black bg-brutal-pink rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            style={{
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Loading Message */}
      {message && (
        <div className="relative">
          <div className="text-xl font-black uppercase tracking-wider border-4 border-black bg-white px-6 py-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            {message}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) rotate(-5deg);
          }
          50% {
            transform: translateY(0) rotate(0deg);
          }
          75% {
            transform: translateY(-10px) rotate(5deg);
          }
        }
      `}</style>
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
        className={`${sizeClasses[size]} border-4 border-black bg-brutal-cyan rounded-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
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
          className="border-4 border-black bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b-4 border-black bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-black animate-pulse" />
              <div className="h-6 bg-gray-300 border-2 border-black rounded w-48 animate-pulse" />
            </div>
            <div className="h-4 bg-gray-200 border-2 border-black rounded w-64 animate-pulse" />
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Progress bar */}
            <div className="h-3 bg-gray-200 border-2 border-black rounded-full overflow-hidden">
              <div
                className="h-full bg-brutal-pink border-r-2 border-black animate-pulse"
                style={{ width: '60%' }}
              />
            </div>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-7 bg-yellow-100 border-2 border-black rounded-full w-24 animate-pulse"
                  style={{ animationDelay: `${j * 0.1}s` }}
                />
              ))}
            </div>

            {/* Badges */}
            <div className="flex gap-2">
              {[1, 2].map((j) => (
                <div
                  key={j}
                  className="h-7 bg-blue-100 border-2 border-black rounded-full w-20 animate-pulse"
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
