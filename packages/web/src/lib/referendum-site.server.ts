import {
  OrganizationReferendumPositionStatus,
  OrgStatus,
  type Prisma,
  VotePosition,
} from "@optimitron/db";
import { shareableSnippets } from "@optimitron/data/parameters";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import type { ReferendumSiteContent } from "@/content/referendum-sites";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { prisma } from "@/lib/prisma";
import type { SiteConfig } from "@/lib/site";
import { getTaskDetailData } from "@/lib/tasks.server";
import {
  getTreatyParentTaskHref,
  TREATY_PARENT_TASK_ID,
} from "@/lib/tasks/task-keys";

interface ReferendumSiteRecord {
  description: string | null;
  id: string;
  title: string;
}

export interface ReferendumSiteContext {
  content: ReferendumSiteContent;
  referendum: ReferendumSiteRecord;
  site: SiteConfig;
}

export interface ReferendumSiteHomeData extends ReferendumSiteContext {
  lateEmployeeProgramTask: TaskCardTask | null;
  lateEmployeeTasks: TaskCardTask[];
  fullTasksHref: string;
  individualCount: number;
  organizationCount: number;
  treatyMarkdown: string;
}

export type ReferendumSiteSupporterRecord =
  Prisma.OrganizationReferendumPositionGetPayload<{
    include: {
      organization: {
        select: {
          description: true;
          id: true;
          logo: true;
          name: true;
          slug: true;
          website: true;
        };
      };
    };
  }>;

export interface ReferendumSiteSupportersData extends ReferendumSiteContext {
  supporters: ReferendumSiteSupporterRecord[];
}

export function buildApprovedOrganizationPositionWhere(
  referendumId: string,
): Prisma.OrganizationReferendumPositionWhereInput {
  return {
    referendumId,
    position: VotePosition.YES,
    status: OrganizationReferendumPositionStatus.APPROVED,
    deletedAt: null,
    organization: {
      status: OrgStatus.APPROVED,
      deletedAt: null,
    },
  };
}

export async function getReferendumSiteContext(
  site: SiteConfig,
): Promise<ReferendumSiteContext | null> {
  if (!site.primaryReferendumSlug) {
    return null;
  }

  const referendum = await prisma.referendum.findUnique({
    where: { slug: site.primaryReferendumSlug },
    select: { id: true, title: true, description: true },
  });

  if (!referendum) {
    return null;
  }

  return {
    site,
    referendum,
    content: getReferendumSiteContent(site.contentKey),
  };
}

export async function getReferendumSiteHomeData(
  site: SiteConfig,
): Promise<ReferendumSiteHomeData | null> {
  const context = await getReferendumSiteContext(site);
  if (!context) {
    return null;
  }

  const [individualCount, organizationCount] = await Promise.all([
    prisma.referendumVote.count({
      where: {
        referendumId: context.referendum.id,
        deletedAt: null,
        answer: VotePosition.YES,
      },
    }),
    prisma.organizationReferendumPosition.count({
      where: buildApprovedOrganizationPositionWhere(context.referendum.id),
    }),
  ]);

  const treatyParentTask =
    site.key === "onePercentTreaty"
      ? await getTaskDetailData(TREATY_PARENT_TASK_ID, null)
      : null;

  return {
    ...context,
    lateEmployeeProgramTask:
      site.key === "onePercentTreaty"
        ? ((treatyParentTask?.task ?? null) as TaskCardTask | null)
        : null,
    lateEmployeeTasks:
      site.key === "onePercentTreaty"
        ? ((treatyParentTask?.task.childTasks ?? []) as unknown as TaskCardTask[])
        : [],
    fullTasksHref:
      site.key === "onePercentTreaty" ? getTreatyParentTaskHref() : "/tasks",
    individualCount,
    organizationCount,
    treatyMarkdown:
      site.key === "onePercentTreaty"
        ? shareableSnippets.onePercentTreatyText.markdown
        : "",
  };
}

export async function getReferendumSiteSupportersData(
  site: SiteConfig,
): Promise<ReferendumSiteSupportersData | null> {
  const context = await getReferendumSiteContext(site);
  if (!context) {
    return null;
  }

  const supporters = await prisma.organizationReferendumPosition.findMany({
    where: buildApprovedOrganizationPositionWhere(context.referendum.id),
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          website: true,
          logo: true,
          description: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return {
    ...context,
    supporters,
  };
}
