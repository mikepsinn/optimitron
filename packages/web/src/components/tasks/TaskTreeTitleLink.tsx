"use client";

import Link from "next/link";

/** The task-title link needs an onClick handler (to stop the click from
 * bubbling to the parent `<summary>` and toggling it), and event handlers
 * can't be passed as props across the server/client boundary — so this one
 * interactive piece is a client component while the rest of the tree stays
 * server-rendered. */
export function TaskTreeTitleLink({
  className,
  href,
  title,
}: {
  className: string;
  href: string;
  title: string;
}) {
  return (
    <Link
      className={className}
      href={href}
      onClick={(event) => event.stopPropagation()}
    >
      {title}
    </Link>
  );
}
