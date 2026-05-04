import type { Metadata } from "next";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import { PresidentManagementSystemSection } from "@/components/tasks/PresidentManagementSystemSection";
import { authOptions } from "@/lib/auth";
import { getSiteMetadata, getRouteMetadata } from "@/lib/metadata";
import { presidentManagementLink, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { getTasksPageData } from "@/lib/tasks.server";
import { selectTreatyPresidentManagementTasks } from "@/lib/tasks/president-management";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  if (site.primaryReferendumSlug) {
    const content = getOptionalReferendumSiteContent(site.contentKey);
    if (content) {
      return getSiteMetadata(site, content.metadata.tasks, ROUTES.employees);
    }
  }

  return getRouteMetadata(presidentManagementLink);
}

export default async function PresidentManagementPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const data = await getTasksPageData(userId);
  const presidentManagement = selectTreatyPresidentManagementTasks(data);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        <PresidentManagementSystemSection
          signerTasks={presidentManagement.signerTasks}
          treatyProgram={presidentManagement.treatyProgram}
        />
      </div>
    </div>
  );
}
