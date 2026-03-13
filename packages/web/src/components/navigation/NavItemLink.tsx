import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import type { NavItem } from "@/lib/routes";

export type NavItemLinkVariant = "topNav" | "dropdown" | "mobile" | "footer";

export function getNavItemLinkClasses(
  variant: NavItemLinkVariant,
  isActive: boolean,
): string {
  switch (variant) {
    case "topNav":
      return `text-sm font-bold uppercase px-3 py-2 border-2 transition-all block ${
        isActive
          ? "border-black bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          : "border-transparent text-black hover:border-black hover:bg-cyan-200 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      }`;
    case "dropdown":
      return `block px-4 py-3 transition-colors ${
        isActive
          ? "bg-yellow-300 text-black"
          : "text-black hover:bg-cyan-200"
      }`;
    case "mobile":
      return `block px-3 py-2 border-2 transition-all ${
        isActive
          ? "border-black bg-yellow-300 text-black"
          : "border-transparent text-black hover:border-black hover:bg-cyan-200"
      }`;
    case "footer":
      return "text-sm font-medium text-black/70 hover:text-black transition-colors";
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
  }
}

function getTooltipClasses(variant: NavItemLinkVariant): string {
  if (variant === "topNav") {
    return "pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 w-52 rounded border-2 border-black bg-white px-3 py-2 text-xs font-medium text-black opacity-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-opacity group-hover:opacity-100 z-50 normal-case";
  }

  return "pointer-events-none absolute left-0 bottom-full mb-2 w-52 rounded border-2 border-black bg-white px-3 py-2 text-xs font-medium text-black opacity-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-opacity group-hover:opacity-100 z-10";
}

function renderLabel(
  item: NavItem,
  variant: NavItemLinkVariant,
  external: boolean,
): ReactNode {
  if (variant === "dropdown" || variant === "mobile") {
    return (
      <>
        <span className="flex items-center gap-2 text-sm font-bold uppercase">
          {item.emoji ? <span>{item.emoji}</span> : null}
          <span>
            {item.label}
            {external ? " ↗" : ""}
          </span>
        </span>
        {item.description ? (
          <span className="mt-0.5 block text-xs text-black/50 normal-case">
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
}

export function NavItemLink({
  item,
  variant,
  isActive = false,
  external = item.external ?? false,
  onClick,
}: NavItemLinkProps) {
  const descriptionMode = getNavItemDescriptionMode(variant);
  const label = renderLabel(item, variant, external);
  const content =
    descriptionMode === "tooltip" && item.description ? (
      <span className="group relative inline-block">
        {label}
        <span className={getTooltipClasses(variant)}>{item.description}</span>
      </span>
    ) : (
      label
    );
  const className = getNavItemLinkClasses(variant, isActive);

  if (external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {content}
    </Link>
  );
}
