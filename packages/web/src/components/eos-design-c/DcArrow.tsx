/**
 * The connector between two nodes of a drawn flow. Points right on desktop;
 * CSS rotates it down when the flow stacks at narrow widths.
 */
export function DcArrow({ className }: { className?: string }) {
  return (
    <span className={className ?? "dc-conn"} aria-hidden="true">
      <svg viewBox="0 0 34 16" role="presentation">
        <path
          className="dc-draw"
          d="M1 8 H25"
          markerEnd="url(#dc-head)"
        />
      </svg>
    </span>
  );
}
