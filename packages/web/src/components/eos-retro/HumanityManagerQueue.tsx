/**
 * Illustrative ranked queue in a terminal readout: what the task engine's
 * output looks like for one human. Static by design (a live queue requires
 * auth); styled after the MCP task queue it depicts.
 */

interface QueueEntry {
  priority: number;
  when: string;
  overdue?: boolean;
  task: string;
  meta: string;
}

const QUEUE: QueueEntry[] = [
  {
    priority: 1,
    when: "OVERDUE",
    overdue: true,
    task: "Sign the 1% Treaty publicly",
    meta: "36 seconds",
  },
  {
    priority: 2,
    when: "22:30",
    task: "Take night meds",
    meta: "2 min",
  },
  {
    priority: 3,
    when: "23:00",
    task: "Record mood + energy (1 to 5)",
    meta: "1 min",
  },
  {
    priority: 4,
    when: "QUEUED",
    task: "Apply for the Survival and Flourishing Fund grant",
    meta: "2.5 h, EV $70,000",
  },
];

export function HumanityManagerQueue() {
  return (
    <div className="er-terminal">
      <div className="er-terminal-bar">
        <span>Optimitron // next best action</span>
        <span>Operator: you</span>
      </div>
      <div className="py-2">
        {QUEUE.map((entry) => (
          <div className="er-terminal-row" key={entry.priority}>
            <span className="er-terminal-pri">#{entry.priority}</span>
            <span className="er-terminal-when" data-overdue={entry.overdue ?? false}>
              {entry.when}
            </span>
            <span className="er-terminal-task">{entry.task}</span>
            <span className="er-terminal-meta">{entry.meta}</span>
          </div>
        ))}
        <div className="er-terminal-row">
          <span className="er-terminal-pri">&gt;</span>
          <span className="er-terminal-task" style={{ gridColumn: "2 / -1" }}>
            awaiting input<span className="er-blink">_</span>
          </span>
        </div>
      </div>
    </div>
  );
}
