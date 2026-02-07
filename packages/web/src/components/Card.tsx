import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  icon?: string;
  title: string;
  description?: string;
}

export function CardHeader({ icon, title, description }: CardHeaderProps) {
  return (
    <div className="mb-4">
      {icon && <div className="text-3xl mb-3">{icon}</div>}
      <h3 className="text-lg font-black text-black">{title}</h3>
      {description && (
        <p className="text-sm text-black/60 mt-1 font-medium">
          {description}
        </p>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatCard({ icon, label, value, change, changeType = "neutral" }: StatCardProps) {
  const changeColors = {
    positive: "text-emerald-600",
    negative: "text-red-600",
    neutral: "text-black/60",
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl mb-2">{icon}</div>
          <div className="text-3xl font-black text-black">{value}</div>
          <div className="text-sm text-black/60 mt-1 font-bold">{label}</div>
        </div>
        {change && (
          <span className={`text-sm font-black ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
    </Card>
  );
}
