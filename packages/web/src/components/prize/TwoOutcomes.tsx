import type { ReactNode } from "react";

interface OutcomeProps {
  title: string;
  metric: ReactNode;
  description: ReactNode;
}

interface TwoOutcomesProps {
  fail: OutcomeProps;
  success: OutcomeProps;
  footer?: ReactNode;
}

export function TwoOutcomes({ fail, success, footer }: TwoOutcomesProps) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-4 border-primary bg-background text-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-pixel text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-80">
            {fail.title}
          </p>
          <div className="font-mono text-3xl font-black mb-3">
            {fail.metric}
          </div>
          <p className="text-sm font-bold leading-relaxed">
            {fail.description}
          </p>
        </div>
        <div className="border-4 border-primary bg-background text-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-pixel text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-80">
            {success.title}
          </p>
          <div className="font-mono text-3xl font-black mb-3">
            {success.metric}
          </div>
          <p className="text-sm font-bold leading-relaxed">
            {success.description}
          </p>
        </div>
      </div>
      {footer && (
        <div className="border-4 border-primary border-t-0 bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-foreground text-center">
            {footer}
          </p>
        </div>
      )}
    </div>
  );
}
