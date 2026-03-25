import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import type { NavItem } from "@/lib/routes";

export type NavItemLinkVariant = "topNav" | "dropdown" | "mobile" | "footer" | "custom";

export function getNavItemLinkClasses(
  variant: NavItemLinkVariant,
  isActive: boolean,
): string {
  switch (variant) {
    case "topNav":
      return `text-[9px] font-bold uppercase px-3 py-2 border transition-all block ${
        isActive
          ? "border-arcade-cyan bg-arcade-cyan/10 text-arcade-cyan"
          : "border-transparent text-arcade-green hover:border-arcade-pink hover:text-arcade-pink"
      }`;
    case "dropdown":
      return `block px-4 py-3 transition-colors ${
        isActive
          ? "bg-arcade-yellow/20 text-arcade-yellow"
          : "text-arcade-green hover:bg-arcade-cyan/20 hover:text-arcade-cyan"
      }`;
    case "mobile":
      return `block px-3 py-2 border transition-all ${
        isActive
          ? "border-arcade-cyan bg-arcade-cyan/10 text-arcade-cyan"
          : "border-transparent text-arcade-green hover:border-arcade-pink hover:text-arcade-pink"
      }`;
    case "footer":
      return "text-[8px] font-bold text-arcade-green hover:text-arcade-cyan transition-colors";
    case "custom":
      return "";
  }
}

export function getNavItemDescriptionMode(
  variant: NavItemLinkVariant,
): "tooltip" | "inline" | "none" {
  switch (variant) {
    case "topNav":
    case "footer":
      return "tooltip";
    case "dropdown":
    case "mobile":
      return "inline";
    case "custom":
      return "none";
  }
}

function getTooltipClasses(variant: NavItemLinkVariant): string {
  if (variant === "topNav") {
    return "pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 w-52 border-2 border-arcade-green bg-background px-3 py-2 text-[8px] font-bold text-arcade-green opacity-0 neon-box-green transition-opacity group-hover:opacity-100 z-50 normal-case";
  }

  return "pointer-events-none absolute left-0 bottom-full mb-2 w-52 border-2 border-arcade-green bg-background px-3 py-2 text-[8px] font-bold text-arcade-green opacity-0 neon-box-green transition-opacity group-hover:opacity-100 z-10";
}

function renderLabel(
  item: NavItem,
  variant: NavItemLinkVariant,
  external: boolean,
): ReactNode {
  if (variant === "dropdown" || variant === "mobile") {
    return (
      <>
        <span className="flex items-center gap-2 text-[9px] font-bold uppercase">
          {item.emoji ? <span>{item.emoji}</span> : null}
          <span>
            ► {item.label}
            {external ? " ↗" : ""}
          </span>
        </span>
        {item.description ? (
          <span className="mt-0.5 block text-[8px] text-arcade-green/70 normal-case">
            {item.description}
          </span>
        ) : null}
      </>
    );
  }

  return (
    <span>
      {item.emoji ? <span className="mr-1">{item.emoji}</span> : null}
      {item.label}
      {external ? " ↗" : ""}
    </span>
  );
}

export interface NavItemLinkProps {
  item: NavItem;
  variant: NavItemLinkVariant;
  isActive?: boolean;
  external?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  className?: string;
  children?: ReactNode;
  descriptionMode?: "tooltip" | "inline" | "none";
  title?: string;
}

export function NavItemLink({
  item,
  variant,
  isActive = false,
  external = item.external ?? false,
  onClick,
  className,
  children,
  descriptionMode,
  title,
}: NavItemLinkProps) {
  const resolvedDescriptionMode = descriptionMode ?? getNavItemDescriptionMode(variant);
  const label = children ?? renderLabel(item, variant, external);
  const tooltipText = title ?? (resolvedDescriptionMode === "tooltip" ? item.description : undefined);
  const content =
    resolvedDescriptionMode === "tooltip" && item.description ? (
      <span className="group relative inline-block">
        {label}
        <span className={getTooltipClasses(variant)}>{item.description}</span>
      </span>
    ) : (
      label
    );
  const combinedClassName = [getNavItemLinkClasses(variant, isActive), className]
    .filter(Boolean)
    .join(" ");

  if (external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={combinedClassName}
        onClick={onClick}
        title={tooltipText}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={combinedClassName} onClick={onClick} title={tooltipText}>
      {content}
    </Link>
  );
}
