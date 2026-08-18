import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { SectionContainer } from "@/components/ui/section-container";
import { ROUTES } from "@/lib/routes";

const exampleLeafTasks = [
  {
    executor: "Any eligible voter",
    task: "Vote for the 1% Treaty",
  },
  {
    executor: "Someone who already voted",
    task: "Recruit two more voters",
  },
  {
    executor: "Authorized governments only",
    task: "Ratify the treaty",
  },
] as const;

export function EarthOptimizationTaskSystemSection() {
  return (
    <SectionContainer
      bgColor="background"
      borderPosition="both"
      id="decentralized-to-do-list"
      padding="lg"
    >
      <Container size="lg">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              The decentralized to-do list for humanity
            </p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
              One planet. One task tree.
            </h2>
            <p className="mt-6 max-w-2xl text-lg font-bold leading-8">
              A better policy helps once somebody does the work. So the whole
              plan hangs from two numbers, how long you live and how much you
              keep, and every goal above them is split down until what is left
              is a job somebody can finish this afternoon.
            </p>
            <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">
              Deadlines come first. After that, the job that buys the most
              health and income per hour goes to whoever can do it, human or AI.
              You only ever see work you can actually start.
            </p>
            <div className="mt-8">
              <GameCTA href={ROUTES.tasksTree} variant="outline">
                Open the task tree
              </GameCTA>
            </div>
          </div>

          <div
            className="border border-foreground"
            aria-label="Example task decomposition"
          >
            <div className="bg-foreground px-5 py-4 text-background">
              <p className="text-xs font-black uppercase tracking-[0.16em]">
                Root goal
              </p>
              <p className="mt-1 text-2xl font-black uppercase">
                Optimize Earth
              </p>
            </div>
            <div className="ml-5 border-l border-foreground sm:ml-8">
              {[
                ["Outcome", "Make the median human healthier and wealthier"],
                ["Mission", "End war and disease"],
                ["Program", "Pass the 1% Treaty"],
              ].map(([label, title]) => (
                <div
                  className="grid gap-1 border-b border-foreground/20 px-5 py-4 sm:grid-cols-[6rem_1fr]"
                  key={label}
                >
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                    {label}
                  </span>
                  <span className="font-black uppercase">{title}</span>
                </div>
              ))}
              <div className="px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Executable leaves
                </p>
                <ul className="mt-3 divide-y divide-foreground/20 border-y border-foreground/20">
                  {exampleLeafTasks.map(({ executor, task }) => (
                    <li
                      className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-baseline"
                      key={task}
                    >
                      <span className="font-bold">{task}</span>
                      <span className="text-sm text-muted-foreground sm:text-right">
                        {executor}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="border-t border-foreground bg-foreground px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-background">
              Deadlines first · then expected value per hour · routed to the
              right executor
            </p>
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}
