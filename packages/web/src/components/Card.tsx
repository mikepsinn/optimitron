import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 ${className}`}
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
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
    positive: "text-green-500",
    negative: "text-red-500",
    neutral: "text-gray-400",
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl mb-2">{icon}</div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
        </div>
        {change && (
          <span className={`text-sm font-medium ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
    </Card>
  );
}
