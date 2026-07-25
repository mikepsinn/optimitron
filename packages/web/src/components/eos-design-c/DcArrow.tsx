/**
 * The connector between two nodes of a drawn flow. Points right on desktop;
 * CSS rotates it down when the flow stacks at narrow widths.
 *
 * Two deliberate choices, both about the pencil filter. The shaft is a
 * shallow curve rather than a straight line, because the filter is sized in
 * objectBoundingBox units and a perfectly flat path has a zero-height box,
 * which collapses the filter region and renders nothing. And the head is
 * drawn into the path instead of referenced as a <marker>, because markers
 * are dropped on filtered geometry.
 */
export function DcArrow({ className }: { className?: string }) {
  return (
    <span className={className ?? "dc-conn"} aria-hidden="true">
      <svg viewBox="0 0 34 16" role="presentation">
        <path
          className="dc-draw"
          d="M2 9.6 C9 6.8 16 10.6 25.5 8 M20 3.6 L26.5 8 L20 12.4"
        />
      </svg>
    </span>
  );
}
