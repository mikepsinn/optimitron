'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SafetyScaleProps {
  safetyScore: number;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'compact';
}

/**
 * Reference substances for comparative safety scale
 * These are used to provide context for treatment safety scores
 */
const SAFETY_REFERENCE_MARKERS = [
  { emoji: '☠️', label: 'Cyanide', position: 5, color: 'text-red-900' },
  { emoji: '💀', label: 'Meth', position: 15, color: 'text-red-800' },
  { emoji: '🚬', label: 'Cigarettes', position: 20, color: 'text-red-700' },
  { emoji: '☢️', label: 'Chemo', position: 25, color: 'text-orange-600' },
  { emoji: '🍺', label: 'Alcohol', position: 30, color: 'text-orange-500' },
  { emoji: '💊', label: 'Morphine', position: 45, color: 'text-yellow-600' },
  { emoji: '💉', label: 'Antibiotics', position: 70, color: 'text-lime-600' },
  { emoji: '💊', label: 'Tylenol', position: 80, color: 'text-green-600' },
  { emoji: '🏃', label: 'Exercise', position: 95, color: 'text-green-700' },
  { emoji: '💧', label: 'Water', position: 100, color: 'text-green-800' },
] as const;

/**
 * Shared component for displaying comparative safety scale
 * Shows treatment safety relative to common reference substances
 * 
 * Used in:
 * - InterventionCard (treatment cards)
 * - TreatmentReport (detailed treatment pages)
 * - Treatment detail pages
 */
export function SafetyScale({
  safetyScore,
  className = '',
  showLabel = true,
  variant = 'default',
}: SafetyScaleProps) {
  const height = variant === 'compact' ? 'h-16' : 'h-20';
  const markerTop = variant === 'compact' ? '12px' : '20px';

  return (
    <div className={`bg-gradient-to-r from-red-50 via-yellow-50 to-green-50 border-2 border-gray-200 rounded-lg p-4 ${className}`}>
      {showLabel && (
        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>Comparative Safety Scale</span>
          <span className="text-xs font-normal text-muted-foreground">(Higher is safer)</span>
        </p>
      )}

      {/* Safety bar with markers */}
      <div className={`relative ${height} mb-2`}>
        {/* Background gradient bar */}
        <div className="absolute bottom-2 left-0 right-0 h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />

        {/* Reference substance markers */}
        {SAFETY_REFERENCE_MARKERS.map((marker, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute -translate-x-1/2 cursor-help"
                  style={{ left: `${marker.position}%`, top: markerTop }}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[8px] font-semibold text-gray-600 whitespace-nowrap leading-tight">
                      {marker.label}
                    </span>
                    <span className="text-base" role="img" aria-label={marker.label}>
                      {marker.emoji}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{marker.label}</p>
                <p className="text-xs text-muted-foreground">Safety: {marker.position}/100</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Treatment position indicator */}
        <div
          className="absolute -translate-x-1/2 z-10"
          style={{ left: `${Math.min(Math.max(safetyScore, 0), 100)}%`, bottom: '2px' }}
        >
          <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
            {safetyScore}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
        <span className="font-semibold text-red-600">Dangerous</span>
        <span className="font-semibold text-yellow-600">Moderate</span>
        <span className="font-semibold text-green-600">Safe</span>
      </div>
    </div>
  );
}




