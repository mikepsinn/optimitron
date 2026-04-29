import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { SignatoriesLeaderboard } from "@/components/referendum/SignatoriesLeaderboard";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";
import { TreatySection } from "@/components/site/TreatySection";
import type { ReferendumSiteHomeData } from "@/lib/referendum-site.server";

interface Props {
  data: ReferendumSiteHomeData;
}

export function OnePercentTreatyLandingPage({ data }: Props) {
  const {
    content,
    lateEmployeeProgramTask,
    lateEmployeeTasks,
    publicSigners,
    site,
    treatyMarkdown,
  } = data;
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-10 text-center">
        <h1 className="mx-auto max-w-4xl text-4xl font-black uppercase tracking-tight text-foreground sm:text-6xl [font-family:var(--v0-font-libre-baskerville)]">
          {content.home.heroTitle}
        </h1>
      </header>

      <section id="sign" className="mb-16">
        <TreatyVoteFlow />
      </section>

      <section id="late-employees" className="border-t-2 border-foreground pt-12">
        <div className="mb-10 text-center">
          <TasksRootIntro />
        </div>
        {lateEmployeeProgramTask ? (
          <ProgramTaskSection
            task={lateEmployeeProgramTask}
            subtasks={lateEmployeeTasks}
            subtasksTitle={
              lateEmployeeTasks.length > 0
                ? `↳ ${lateEmployeeTasks.length} employees have overdue tasks`
                : undefined
            }
          />
        ) : null}
      </section>

      <TreatySection
        treatyMarkdown={treatyMarkdown}
        referendumSlug={site.primaryReferendumSlug ?? null}
      />

      {process.env.NODE_ENV !== "production" ? (
        <SignatoriesLeaderboard publicSigners={publicSigners} />
      ) : null}
    </div>
  );
}
