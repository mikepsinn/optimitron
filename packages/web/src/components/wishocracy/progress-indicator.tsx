"use client"

interface ProgressIndicatorProps {
  current: number
  total: number
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  const percent = Math.min(100, (current / total) * 100)

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="text-center font-black text-base md:text-lg mb-2 uppercase">
        {current} of {total} possible pairs completed!
      </div>
      <div className="h-8 bg-background border-4 border-primary relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div
          className="h-full bg-brutal-pink transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center font-black text-sm">
          {Math.round(percent)}%
        </div>
      </div>
    </div>
  )
}
