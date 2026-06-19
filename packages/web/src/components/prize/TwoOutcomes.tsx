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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border border-foreground bg-background p-5 text-foreground">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            {fail.title}
          </p>
          <div className="mb-3 text-3xl font-black">
            {fail.metric}
          </div>
          <p className="text-sm font-bold leading-relaxed">
            {fail.description}
          </p>
        </div>
        <div className="border border-foreground bg-background p-5 text-foreground">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            {success.title}
          </p>
          <div className="mb-3 text-3xl font-black">
            {success.metric}
          </div>
          <p className="text-sm font-bold leading-relaxed">
            {success.description}
          </p>
        </div>
      </div>
      {footer && (
        <div className="mt-3 border-l border-foreground pl-4">
          <p className="text-sm font-bold text-muted-foreground">
            {footer}
          </p>
        </div>
      )}
    </div>
  );
}
