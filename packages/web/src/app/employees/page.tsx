import type { Metadata } from "next";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { PresidentManagementSystemSection } from "@/components/tasks/PresidentManagementSystemSection";
import { authOptions } from "@/lib/auth";
import { getSiteMetadata } from "@/lib/metadata";
import { presidentManagementLink, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { getTasksPageData } from "@/lib/tasks.server";
import { countOverdueTasks } from "@/lib/tasks/overdue";
import { selectTreatyPresidentManagementTasks } from "@/lib/tasks/president-management";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  return getSiteMetadata(
    site,
    {
      title: `${presidentManagementLink.label} | ${site.name}`,
      description: presidentManagementLink.description,
    },
    ROUTES.employees,
  );
}

export default async function PresidentManagementPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const data = await getTasksPageData(userId);
  const presidentManagement = selectTreatyPresidentManagementTasks(data);
  const initialOverdueCount = countOverdueTasks(
    presidentManagement.signerTasks,
    new Date(),
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        <PresidentManagementSystemSection
          initialOverdueCount={initialOverdueCount}
          signerTasks={presidentManagement.signerTasks}
          treatyProgram={presidentManagement.treatyProgram}
        />
      </div>
    </div>
  );
}
