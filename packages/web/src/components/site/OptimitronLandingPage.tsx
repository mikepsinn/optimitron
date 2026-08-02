import Link from "next/link";
import { Container } from "@/components/ui/container";
import { gameLink, investLink, ROUTES, servicesLink } from "@/lib/routes";

const exampleTaskBranches = [
  {
    tasks: [
      { owner: "Anyone", time: "30 sec", title: "Vote on the 1% Treaty" },
      { owner: "You", time: "2 min", title: "Ask two friends to vote" },
      {
        owner: "International lawyer",
        time: "1 hr",
        title: "Review the treaty in one country",
      },
    ],
    title: "End war and disease",
  },
  {
    tasks: [
      {
        owner: "Health-policy expert",
        time: "2 hr",
        title: "Review the FDA Right to Trial Upgrade Act",
      },
      { owner: "Anyone", time: "Open", title: "Comment on the draft law" },
    ],
    title: "Improve public laws",
  },
] as const;

function TaskTreeExample() {
  return (
    <section className="border-y border-foreground bg-background py-14 sm:py-20">
      <Container size="lg">
        <div className="grid gap-10 lg:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              The decentralized to-do list for humanity
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-5xl">
              One planet. Every job required to optimize it.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Big goals become concrete tasks. Each one names who should do it,
              what it unlocks, and what waiting costs. Humans and AI agents take
              the best task they can actually perform.
            </p>
            <Link
              href={ROUTES.tasks}
              className="mt-8 inline-flex min-h-12 items-center justify-center border border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-background transition-colors hover:bg-background hover:text-foreground"
            >
              See your next tasks
            </Link>
          </div>

          <div aria-label="Example Optimitron task tree">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
              Example task tree
            </p>
            <div className="mt-3 border border-foreground">
              <div className="flex flex-col gap-1 bg-foreground px-4 py-4 text-background sm:flex-row sm:items-baseline sm:justify-between">
                <span className="text-xs font-black uppercase tracking-[0.16em]">
                  Shared goal
                </span>
                <span className="text-xl font-black uppercase">
                  Optimize Earth
                </span>
              </div>

              <div className="ml-4 border-l border-foreground sm:ml-8">
                {exampleTaskBranches.map((branch) => (
                  <div
                    key={branch.title}
                    className="border-t border-foreground"
                  >
                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[6rem_1fr] sm:px-5">
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                        Program
                      </span>
                      <span className="font-black uppercase">
                        {branch.title}
                      </span>
                    </div>
                    <ul className="ml-4 border-l border-foreground sm:ml-8">
                      {branch.tasks.map((task) => (
                        <li
                          key={task.title}
                          className="grid gap-2 border-t border-foreground/30 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10rem_4rem] sm:items-center sm:px-5"
                        >
                          <span className="font-bold leading-6">
                            {task.title}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {task.owner}
                          </span>
                          <span className="text-xs font-black uppercase tracking-[0.12em] sm:text-right">
                            {task.time}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export async function OptimitronLandingPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="py-20 sm:py-28 lg:py-32">
        <Container size="lg">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
            Optimitron
          </p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            What&apos;s the highest-value thing you can do right now?
          </h1>
          <p className="mt-7 max-w-4xl text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
            Optimitron ranks laws, budgets, and tasks by how much they improve
            healthy life and real income—then finds the person, organization, AI
            agent, or dollar best placed to get each one done.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={ROUTES.tasks}
              className="inline-flex min-h-12 items-center justify-center border border-foreground bg-foreground px-5 py-3 text-center text-sm font-black uppercase tracking-[0.08em] text-background transition-colors hover:bg-background hover:text-foreground"
            >
              See the task list
            </Link>
            <Link
              href={ROUTES.game}
              className="inline-flex min-h-12 items-center justify-center border border-foreground bg-background px-5 py-3 text-center text-sm font-black uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Play the Earth Optimization Game
            </Link>
          </div>
        </Container>
      </section>

      <TaskTreeExample />

      <nav aria-label="Explore Optimitron" className="py-10">
        <Container size="lg">
          <div className="flex flex-col gap-4 text-sm font-black uppercase tracking-[0.08em] sm:flex-row sm:gap-8">
            {[gameLink, servicesLink, investLink].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="underline decoration-1 underline-offset-4 hover:no-underline"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Container>
      </nav>
    </main>
  );
}
