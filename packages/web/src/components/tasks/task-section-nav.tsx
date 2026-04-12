"use client";

import { useEffect, useState } from "react";

interface SectionLink {
  id: string;
  label: string;
  count?: number;
}

interface TaskSectionNavProps {
  links: SectionLink[];
}

/**
 * Sticky jump nav that pins under the viewport as you scroll, letting users
 * jump between the overview, the subtask list, and the discussion without
 * scrolling past hundreds of rows. Also highlights the active section via
 * an IntersectionObserver so returning visitors see where they are.
 */
export function TaskSectionNav({ links }: TaskSectionNavProps) {
  const [activeId, setActiveId] = useState<string | null>(links[0]?.id ?? null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0 && visible[0].target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    for (const link of links) {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [links]);

  return (
    <nav className="sticky top-[68px] z-20 -mx-4 border-b-4 border-primary bg-background px-4 py-2 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
      <ul className="flex flex-wrap items-center gap-2 text-xs font-black uppercase">
        {links.map((link) => {
          const isActive = activeId === link.id;
          return (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className={`inline-block border-2 border-foreground px-3 py-1 transition-colors ${
                  isActive
                    ? "bg-brutal-pink text-brutal-pink-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {link.label}
                {link.count != null ? (
                  <span className="ml-1 opacity-70">({link.count})</span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
