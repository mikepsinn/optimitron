import type { Metadata } from "next";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import { PostVoteReminders } from "@/components/landing/PostVoteReminders";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import { ProgramCard, ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { BrutalCard } from "@/components/ui/brutal-card";
import { authOptions } from "@/lib/auth";
import { getSiteMetadata, getRouteMetadata } from "@/lib/metadata";
import { tasksLink } from "@/lib/routes";
import { getSiteFromHost } from "@/lib/site";
import { getTasksPageData } from "@/lib/tasks.server";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));

  if (site.primaryReferendumSlug) {
    const content = getReferendumSiteContent(site.contentKey);
    return getSiteMetadata(site, content.metadata.tasks);
  }

  return getRouteMetadata(tasksLink);
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const data = await getTasksPageData(userId);

  const prizeRoot = data.topLevelTasks.find(
    (t) => t.id === "win-earth-optimization-prize",
  );
  const otherRoots = data.topLevelTasks.filter(
    (t) => t.id !== "win-earth-optimization-prize",
  );
  const signerTasks = data.allTasks.filter((task) =>
    task.taskKey?.startsWith("program:one-percent-treaty:signer:"),
  );
  const programChildren = (prizeRoot?.childTasks ?? []) as unknown as TaskCardTask[];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        {/*
          Root task hero — literally the "Promote the General Welfare" root
          task. The 3 programs below are its direct children. Each program
          card may have its own grandchildren (e.g. treaty → 193 signers)
          rendered indented immediately beneath.
        */}
        {prizeRoot ? (
          <BrutalCard bgColor="yellow" shadowSize={8} className="p-8 text-center">
            <TasksRootIntro />
            <div className="mx-auto mt-6 max-w-2xl text-left">
              <PostVoteReminders />
            </div>
          </BrutalCard>
        ) : null}

        {/*
          Tree view: each program child renders as a card. If the program is
          the 1% Treaty, the 193 signer grandchildren render directly beneath
          it with a left-indent so the parent-child relationship is visible.
        */}
        {programChildren.map((program) => {
          const isTreaty = program.id === "1-pct-treaty";
          const programSignerTasks = isTreaty ? signerTasks : [];
          const programSignerCount = programSignerTasks.length;
          return (
            <div key={program.id}>
              {isTreaty ? (
                <ProgramTaskSection
                  task={program}
                  subtasks={programSignerTasks}
                  subtasksTitle={
                    programSignerCount > 0
                      ? `↳ ${programSignerCount} employees have overdue tasks`
                      : undefined
                  }
                />
              ) : (
                <ProgramCard task={program} />
              )}
            </div>
          );
        })}

        {/* Other top-level tasks not under the prize root (rare) */}
        {otherRoots.length > 0 ? (
          <Section title="Other blocking programs">
            <SortableTaskList tasks={otherRoots as unknown as TaskCardTask[]} />
          </Section>
        ) : null}

        {/* Authenticated-only personal sections */}
        {userId && data.ownedPrivateTasks.length > 0 ? (
          <Section title="My private tasks">
            <SortableTaskList tasks={data.ownedPrivateTasks} />
          </Section>
        ) : null}

        {userId && data.forYou.length > 0 ? (
          <Section title="For you">
            <SortableTaskList tasks={data.forYou.slice(0, 12)} />
          </Section>
        ) : null}

        {data.assignedToYou.length > 0 ? (
          <Section title="Assigned to you">
            <SortableTaskList tasks={data.assignedToYou} />
          </Section>
        ) : null}

        {userId && data.myClaims.length > 0 ? (
          <Section title="My claims">
            <SortableTaskList
              tasks={data.myClaims.map((claim) => ({
                ...claim.task,
                activeClaimCount: claim.task.claims.filter((taskClaim) =>
                  ["CLAIMED", "IN_PROGRESS", "COMPLETED"].includes(taskClaim.status),
                ).length,
                viewerHasClaim: true,
              }))}
            />
          </Section>
        ) : null}
      </div>
    </div>
  );
}
