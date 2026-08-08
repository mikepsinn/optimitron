import { formatCompactCurrency } from "@/lib/tasks/accountability";
import { getTaskPath } from "@/lib/routes";
import { TaskTreeTitleLink } from "@/components/tasks/TaskTreeTitleLink";
import type { TaskTreeNode } from "@/lib/tasks/task-tree";

/** Root + its direct children start open so a visitor immediately sees the
 * top of the argument (Optimize Earth -> its programs) without a click.
 * Deeper branches start collapsed so a ~100-node tree doesn't render as one
 * long unreadable page. */
const DEFAULT_OPEN_DEPTH = 1;

function formatEvLabel(node: TaskTreeNode): string {
  if (!node.evValid) {
    return "no direct estimate";
  }
  return `EV ${formatCompactCurrency(node.realEv)} · priority ${formatCompactCurrency(node.priority)}/hr`;
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
      <span className="text-xs text-muted-foreground">
        {formatEvLabel(node)}
      </span>
      {node.alsoServes && node.alsoServes.length > 0 ? (
        <span className="text-xs text-muted-foreground">
          also serves: {node.alsoServes.join(", ")}
        </span>
      ) : null}
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
            {node.children.length === 1 ? "subtask" : "subtasks"})
          </span>
        </summary>
        <ul className="mt-2 border-l border-foreground/20 pl-4">
          {node.children.map((child) => (
            <TaskTreeNodeView depth={depth + 1} key={child.id} node={child} />
          ))}
        </ul>
      </details>
    </li>
  );
}

export function TaskTreeView({ root }: { root: TaskTreeNode }) {
  return (
    <ul className="text-sm">
      <TaskTreeNodeView depth={0} node={root} />
    </ul>
  );
}
