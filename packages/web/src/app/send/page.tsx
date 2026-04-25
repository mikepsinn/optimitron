import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReferralInvitationStatusCard } from "@/components/dashboard/ReferralInvitationStatusCard";
import { ReferralInvitationComposer } from "@/components/landing/ReferralInvitationComposer";
import { authOptions } from "@/lib/auth";
import { getRouteMetadata } from "@/lib/metadata";
import { getSignInPath, ROUTES, sendLink } from "@/lib/routes";

export const metadata = getRouteMetadata(sendLink);

export default async function SendPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    redirect(getSignInPath(ROUTES.send));
  }

  return (
    <main className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <div className="border-4 border-primary bg-brutal-yellow p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-black uppercase tracking-wide">
            Humanity Project Management System
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase leading-tight sm:text-5xl">
            Assign One Overdue Task
          </h1>
          <p className="mt-3 text-base font-bold leading-snug sm:text-lg">
            Optimize Earth contains End War and Disease, which contains Ratify
            the 1% Treaty, which currently contains one very small task for one
            human you know.
          </p>
        </div>

        <ReferralInvitationComposer />
        <ReferralInvitationStatusCard />
      </div>
    </main>
  );
}
