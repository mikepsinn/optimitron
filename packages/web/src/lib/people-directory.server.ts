import {
  PersonLifeStatus,
  TaskCategory,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import { getPersonHref } from "@/lib/person-href";
import { prisma } from "@/lib/prisma";

export type PeopleDirectoryRole =
  | "all"
  | "officials"
  | "legal"
  | "research"
  | "organizing"
  | "communications"
  | "governance";

export interface PeopleDirectoryPerson {
  affiliation: string | null;
  countryCode: string | null;
  displayName: string;
  headline: string | null;
  href: string;
  id: string;
  image: string | null;
  isPublicFigure: boolean;
  openTaskPreview: Array<{
    category: TaskCategory;
    id: string;
    skillTags: string[];
    title: string;
  }>;
  publicTaskCount: number;
  sourceUrl: string | null;
  verifiedTaskPreview: Array<{
    category: TaskCategory;
    id: string;
    title: string;
  }>;
}

export interface PeopleDirectoryData {
  page: number;
  pageSize: number;
  people: PeopleDirectoryPerson[];
  query: string;
  role: PeopleDirectoryRole;
  totalCount: number;
  totalPages: number;
}

const ACTIVE_TASK_PREVIEW_LIMIT = 3;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 20;
const VERIFIED_TASK_PREVIEW_LIMIT = 2;
const TASK_PREVIEW_LIMIT =
  ACTIVE_TASK_PREVIEW_LIMIT + VERIFIED_TASK_PREVIEW_LIMIT;

const ROLE_FILTERS = {
  all: null,
  communications: [TaskCategory.COMMUNICATION, TaskCategory.CREATIVE],
  governance: [TaskCategory.GOVERNANCE, TaskCategory.ADVOCACY],
  legal: [TaskCategory.LEGAL],
  organizing: [TaskCategory.ORGANIZING, TaskCategory.OUTREACH],
  research: [TaskCategory.RESEARCH, TaskCategory.SCIENCE],
} satisfies Record<
  Exclude<PeopleDirectoryRole, "officials">,
  TaskCategory[] | null
>;

const publicAssignedTaskWhere = {
  deletedAt: null,
  isPublic: true,
} satisfies Prisma.TaskWhereInput;

const publicDirectoryTaskWhere = {
  ...publicAssignedTaskWhere,
  status: { in: [TaskStatus.ACTIVE, TaskStatus.VERIFIED] },
} satisfies Prisma.TaskWhereInput;

function buildRoleWhere(
  role: PeopleDirectoryRole,
): Prisma.PersonWhereInput | null {
  if (role === "all") return null;
  if (role === "officials") {
    return { isPublicFigure: true };
  }

  const categories = ROLE_FILTERS[role];
  return categories
    ? {
        assignedTasks: {
          some: {
            ...publicDirectoryTaskWhere,
            category: { in: [...categories] },
          },
        },
      }
    : null;
}

function buildSearchWhere(query: string): Prisma.PersonWhereInput | null {
  const q = query.trim();
  if (!q) return null;

  return {
    OR: [
      { displayName: { contains: q, mode: "insensitive" } },
      { headline: { contains: q, mode: "insensitive" } },
      { currentAffiliation: { contains: q, mode: "insensitive" } },
      { bio: { contains: q, mode: "insensitive" } },
      { countryCode: { equals: q.toUpperCase() } },
      {
        assignedTasks: {
          some: {
            ...publicDirectoryTaskWhere,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { roleTitle: { contains: q, mode: "insensitive" } },
              { skillTags: { has: q.toLowerCase() } },
              { interestTags: { has: q.toLowerCase() } },
            ],
          },
        },
      },
    ],
  };
}

export function parsePeopleDirectoryRole(
  value: string | string[] | undefined,
): PeopleDirectoryRole {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    candidate === "officials" ||
    candidate === "legal" ||
    candidate === "research" ||
    candidate === "organizing" ||
    candidate === "communications" ||
    candidate === "governance"
  ) {
    return candidate;
  }
  return "all";
}

export async function getPeopleDirectoryData({
  limit = DEFAULT_PAGE_SIZE,
  page = 1,
  query = "",
  role = "all",
}: {
  limit?: number;
  page?: number;
  query?: string;
  role?: PeopleDirectoryRole;
} = {}): Promise<PeopleDirectoryData> {
  const clauses: Prisma.PersonWhereInput[] = [
    { deletedAt: null },
    { lifeStatus: { not: PersonLifeStatus.DECEASED } },
    { assignedTasks: { some: publicDirectoryTaskWhere } },
  ];

  const searchWhere = buildSearchWhere(query);
  if (searchWhere) clauses.push(searchWhere);

  const roleWhere = buildRoleWhere(role);
  if (roleWhere) clauses.push(roleWhere);

  const where = { AND: clauses } satisfies Prisma.PersonWhereInput;
  const take = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);
  const totalCount = await prisma.person.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / take));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const people = await prisma.person.findMany({
    orderBy: [{ isPublicFigure: "desc" }, { displayName: "asc" }],
    select: {
      _count: {
        select: {
          assignedTasks: { where: publicDirectoryTaskWhere },
        },
      },
      assignedTasks: {
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        select: {
          category: true,
          id: true,
          skillTags: true,
          status: true,
          title: true,
        },
        take: TASK_PREVIEW_LIMIT,
        where: publicDirectoryTaskWhere,
      },
      countryCode: true,
      currentAffiliation: true,
      displayName: true,
      handle: true,
      headline: true,
      id: true,
      image: true,
      isPublicFigure: true,
      sourceUrl: true,
    },
    skip: (currentPage - 1) * take,
    take,
    where,
  });

  return {
    page: currentPage,
    pageSize: take,
    people: people.map((person) => ({
      affiliation: person.currentAffiliation,
      countryCode: person.countryCode,
      displayName: person.displayName,
      headline: person.headline,
      href: getPersonHref(person),
      id: person.id,
      image: person.image,
      isPublicFigure: person.isPublicFigure,
      openTaskPreview: person.assignedTasks
        .filter((task) => task.status === TaskStatus.ACTIVE)
        .slice(0, ACTIVE_TASK_PREVIEW_LIMIT)
        .map((task) => ({
          category: task.category,
          id: task.id,
          skillTags: task.skillTags,
          title: task.title,
        })),
      publicTaskCount: person._count.assignedTasks,
      sourceUrl: person.sourceUrl,
      verifiedTaskPreview: person.assignedTasks
        .filter((task) => task.status === TaskStatus.VERIFIED)
        .slice(0, VERIFIED_TASK_PREVIEW_LIMIT)
        .map((task) => ({
          category: task.category,
          id: task.id,
          title: task.title,
        })),
    })),
    query: query.trim(),
    role,
    totalCount,
    totalPages,
  };
}
