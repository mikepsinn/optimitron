import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";

export interface EmployeeReviewMetric {
  detail?: string | null;
  label: string;
  tone?: "background" | "cyan" | "green" | "pink" | "red" | "yellow";
  value: string;
}

export interface EmployeeReviewCallout {
  description: string;
  href?: string;
  hrefLabel?: string;
  eyebrow: string;
  title: string;
}

export interface EmployeeReviewBannerModel {
  callout?: EmployeeReviewCallout | null;
  description: string;
  eyebrow: string;
  metrics: EmployeeReviewMetric[];
  title: string;
}

function EmployeeReviewMetricCard({ metric }: { metric: EmployeeReviewMetric }) {
  return (
    <BrutalCard bgColor={metric.tone ?? "background"} padding="md" shadowSize={4}>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em]">
          {metric.label}
        </p>
        <p className="text-2xl font-black uppercase">{metric.value}</p>
        {metric.detail ? (
          <p className="text-xs font-bold leading-5 opacity-80">{metric.detail}</p>
        ) : null}
      </div>
    </BrutalCard>
  );
}

export function EmployeeReviewBanner({
  callout,
  description,
  eyebrow,
  metrics,
  title,
}: EmployeeReviewBannerModel) {
  return (
    <BrutalCard bgColor="yellow" padding="lg">
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.18em]">
            {eyebrow}
          </p>
          <h2 className="text-2xl font-black uppercase sm:text-3xl">{title}</h2>
          <p className="max-w-4xl text-sm font-bold leading-6">{description}</p>
        </div>

        {callout ? (
          <div className="border-4 border-foreground bg-background p-4 text-foreground">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground">
              {callout.eyebrow}
            </p>
            <p className="mt-2 text-lg font-black uppercase">{callout.title}</p>
            <p className="mt-2 text-sm font-bold leading-6">{callout.description}</p>
            {callout.href ? (
              <Link
                className="mt-3 inline-block text-sm font-black uppercase underline underline-offset-4"
                href={callout.href}
              >
                {callout.hrefLabel ?? "Open Review"}
              </Link>
            ) : null}
          </div>
        ) : null}

        {metrics.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {metrics.map((metric) => (
              <EmployeeReviewMetricCard
                key={`${metric.label}-${metric.value}`}
                metric={metric}
              />
            ))}
          </div>
        ) : null}
      </div>
    </BrutalCard>
  );
}
