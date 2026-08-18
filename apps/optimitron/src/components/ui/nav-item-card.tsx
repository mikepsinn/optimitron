import Link from "next/link";
import type { ReactNode } from "react";
import { BrutalCard, type BrutalCardBgColor } from "@/components/ui/brutal-card";
import type { NavItem } from "@/lib/routes";

export interface NavItemCardProps {
  item: NavItem;
  cta?: string;
  subtitle?: string;
  bgColor?: BrutalCardBgColor;
  children?: ReactNode;
  className?: string;
}

export function NavItemCard({
  item,
  cta,
  subtitle,
  bgColor = "default",
  children,
  className,
}: NavItemCardProps) {
  return (
    <Link href={item.href} className={className}>
      <BrutalCard bgColor={bgColor} hover padding="lg" className="h-full flex flex-col">
        <span className="text-2xl mb-3 block">{item.emoji}</span>
        <h3 className="font-black uppercase text-lg mb-2">{item.label}</h3>
        <p className="text-sm font-bold leading-relaxed flex-grow">
          {item.description}
        </p>
        {subtitle && (
          <p className="text-xs font-bold opacity-60 mt-2">{subtitle}</p>
        )}
        {children}
        {(cta ?? item.cta) && (
          <span className="mt-4 block text-sm font-black uppercase underline underline-offset-2">
            {cta ?? item.cta} &rarr;
          </span>
        )}
      </BrutalCard>
    </Link>
  );
}

export function NavItemCardGrid({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 ${columns === 3 ? "xl:grid-cols-3" : ""} gap-6`}
    >
      {children}
    </div>
  );
}
