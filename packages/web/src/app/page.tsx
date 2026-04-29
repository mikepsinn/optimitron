import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import { OnePercentTreatyLandingPage } from "@/components/site/OnePercentTreatyLandingPage";
import { OptimitronLandingPage } from "@/components/site/OptimitronLandingPage";
import { authOptions } from "@/lib/auth";
import { getRootSiteMetadata, getSiteMetadata } from "@/lib/metadata";
import { getReferendumSiteHomeData } from "@/lib/referendum-site.server";
import { getSiteFromHost } from "@/lib/site";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { getTaskDetailData } from "@/lib/tasks.server";
import { TREATY_PARENT_TASK_ID } from "@/lib/tasks/task-keys";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));

  if (site.pageVariants.home === "onePercentTreatyLanding") {
    const content = getOptionalReferendumSiteContent(site.contentKey);
    if (content) {
      return getSiteMetadata(site, content.metadata.home, "/");
    }
  }

  return getRootSiteMetadata(site);
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  if (site.pageVariants.home === "onePercentTreatyLanding") {
    const resolvedParams = (await searchParams) ?? {};
    const rawPage = resolvedParams.signersPage;
    const signersPageParam = Array.isArray(rawPage) ? rawPage[0] : rawPage;
    const signersPage = signersPageParam
      ? Math.max(1, parseInt(signersPageParam, 10) || 1)
      : 1;
    const session = await getServerSession(authOptions);
    const data = await getReferendumSiteHomeData(site, {
      signersPage,
      currentUserId: session?.user?.id ?? null,
    });
    if (!data) {
      return (
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-black uppercase">{site.name}</h1>
          <p className="mt-4 font-bold text-muted-foreground">
            Referendum not found.
          </p>
        </section>
      );
    }

    return <OnePercentTreatyLandingPage data={data} />;
  }

  const treatyParentTask = await getTaskDetailData(TREATY_PARENT_TASK_ID, null);
  const lateEmployeeProgramTask =
    (treatyParentTask?.task ?? null) as TaskCardTask | null;
  const lateEmployeeTasks = (treatyParentTask?.task.childTasks ??
    []) as unknown as TaskCardTask[];

  return (
    <OptimitronLandingPage
      lateEmployeeProgramTask={lateEmployeeProgramTask}
      lateEmployeeTasks={lateEmployeeTasks}
    />
  );
}
