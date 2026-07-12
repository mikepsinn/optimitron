/**
 * A day in the optimized life: the warm cream interlude between the
 * exhibit hall and the stakes. Static by design; no scroll tricks, so
 * every line is visible without JavaScript.
 */

interface DayEntry {
  time: string;
  text: React.ReactNode;
}

const DAY: DayEntry[] = [
  {
    time: "6:00 AM",
    text: (
      <>
        You wake up without an alarm. Also without the depression. The
        treatment that worked was ranked first for your biology by an
        outcome label, not discovered by accident in year nine of trying
        things.
      </>
    ),
  },
  {
    time: "7:30 AM",
    text: (
      <>
        Breakfast. The advice on the carton comes from outcome data on
        millions of real people, not from whichever food lobby bought the
        guidelines that decade.
      </>
    ),
  },
  {
    time: "12:00 PM",
    text: (
      <>
        You vote on the national budget over lunch. Ten pairs, ninety
        seconds. Clinical trials or another aircraft carrier. You feel
        strongly about one of these.
      </>
    ),
  },
  {
    time: "3:00 PM",
    text: (
      <>
        Your daughter&apos;s history class covers how citizens used to
        change policy: they walked long distances in large groups, holding
        signs, and hoped. She raises her hand.{" "}
        <strong>&ldquo;They WALKED? That was the plan?&rdquo;</strong>{" "}
        Nobody laughs. It was the plan.
      </>
    ),
  },
  {
    time: "6:00 PM",
    text: (
      <>
        Groceries. The 0.5% transaction tax settles itself somewhere
        between the register and your account. You have never filed a tax
        form. April is just a month.
      </>
    ),
  },
  {
    time: "9:00 PM",
    text: (
      <>
        The news is boring on purpose. The last war is a documentary, and
        &ldquo;medical bankruptcy&rdquo; is a phrase your daughter will
        need a historian to explain. You do not set an alarm.
      </>
    ),
  },
];

export function OptimizedDayTimeline() {
  return (
    <div className="mx-auto max-w-3xl">
      {DAY.map((entry) => (
        <div className="er-day-row" key={entry.time}>
          <span className="er-day-time">{entry.time}</span>
          <p className="er-day-text">{entry.text}</p>
        </div>
      ))}
    </div>
  );
}
