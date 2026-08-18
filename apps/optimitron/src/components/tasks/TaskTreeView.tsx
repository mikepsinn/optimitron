import { formatCompactCurrency } from "@/lib/tasks/accountability";
import { getTaskPath } from "@/lib/routes";
import { TaskTreeTitleLink } from "@/components/tasks/TaskTreeTitleLink";
import type { TaskTreeNode } from "@/lib/tasks/task-tree";

/** Root + its direct children start open so a visitor immediately sees the
 * top of the argument (Optimize Earth -> its programs) without a click.
 * Deeper branches start collapsed so a ~100-node tree doesn't render as one
 * long unreadable page. */
const DEFAULT_OPEN_DEPTH = 2;

function formatMissionCurrency(value: number): string {
  if (Math.abs(value) < 1e15) {
    return formatCompactCurrency(value);
  }
  const quadrillions = value / 1e15;
  return `$${quadrillions.toLocaleString("en-US", {
    maximumFractionDigits: Math.abs(quadrillions) >= 10 ? 0 : 1,
  })} quadrillion`;
}

function formatImpactLabel(node: TaskTreeNode): string {
  if (node.valueIfAchievedUsd != null) {
    return `Value if achieved ${formatMissionCurrency(node.valueIfAchievedUsd)}`;
  }
  if (node.isTaxonomyNode) {
    return "category";
  }
  if (!node.hasEvEstimate) {
    return "no direct estimate";
  }
  const value = `Expected value ${formatCompactCurrency(node.realEv)}`;
  // Priority is value per hour, so a task with a real value but no effort
  // estimate has nothing to divide by. Say which half is missing instead of
  // discarding the half we have.
  return node.evValid
    ? `${value} · priority ${formatCompactCurrency(node.priority)}/hr`
    : `${value} · no effort estimate`;
}

function TaskTreeNodeLabel({ node }: { node: TaskTreeNode }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <TaskTreeTitleLink
        className="font-bold text-foreground underline-offset-4 hover:underline"
        href={getTaskPath(node.id)}
        title={node.title}
      />
      <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
        {node.status.toLowerCase()}
      </span>
      {node.isLinked ? (
        <span className="text-xs font-bold text-muted-foreground">
          shared approach
        </span>
      ) : null}
      <span className="text-xs text-muted-foreground">
        {formatImpactLabel(node)}
      </span>
    </span>
  );
}

function TaskTreeNodeView({
  depth,
  node,
}: {
  depth: number;
  node: TaskTreeNode;
}) {
  if (node.children.length === 0) {
    return (
      <li className="border-b border-foreground/10 py-2">
        <TaskTreeNodeLabel node={node} />
      </li>
    );
  }

  return (
    <li className="border-b border-foreground/10 py-2">
      <details open={depth < DEFAULT_OPEN_DEPTH}>
        <summary className="cursor-pointer list-item marker:text-foreground">
          <TaskTreeNodeLabel node={node} />
          <span className="ml-2 text-xs text-muted-foreground">
            ({node.children.length}{" "}
            {node.children.length === 1 ? "approach" : "approaches"})
          </span>
        </summary>
        <ul className="mt-2 border-l border-foreground/20 pl-4">
          {node.children.map((child) => (
            <TaskTreeNodeView
              depth={depth + 1}
              key={`${child.id}:${child.isLinked ? "linked" : "primary"}`}
              node={child}
            />
          ))}
        </ul>
      </details>
    </li>
  );
}

export function TaskTreeView({ root }: { root: TaskTreeNode }) {
  return (
    // id is the visual review's activation selector for the tasks-tree state;
    // it proves the tree actually rendered rather than an empty shell.
    <ul className="text-sm" id="task-tree">
      <TaskTreeNodeView depth={0} node={root} />
    </ul>
  );
}
