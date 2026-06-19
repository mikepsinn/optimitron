import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  canReviewTaskApplications,
  getTaskApplications,
} from "@/lib/task-applications.server";
import {
  ApplicationReviewUI,
  type ApplicationRow,
} from "@/components/tasks/ApplicationReviewUI";
import { getTaskPath } from "@/lib/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: task ? `Applications — ${task.title}` : "Applications",
  };
}

export default async function TaskApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/auth/signin?callbackUrl=/tasks/${id}/applications`);

  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true, title: true, applicationPolicy: true },
  });
  if (!task) notFound();
  if (!(await canReviewTaskApplications(user.id, id))) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase">Not authorized</h1>
      </section>
    );
  }

  const applications = (await getTaskApplications(id)) as ApplicationRow[];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-4 border-b px-4 py-3">
        <Link
          href={getTaskPath(id)}
          className="text-sm font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          ← {task.title}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-bold uppercase tracking-wide">
          Applications ({applications.length})
        </span>
      </header>
      <div className="min-h-0 flex-1">
        <ApplicationReviewUI taskId={id} initialApplications={applications} />
      </div>
    </div>
  );
}
