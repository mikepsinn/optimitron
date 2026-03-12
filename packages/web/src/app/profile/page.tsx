import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProfileHub } from "@/components/profile/ProfileHub";
import { authOptions } from "@/lib/auth";
import { getProfilePageData } from "@/lib/profile.server";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  const initialData = await getProfilePageData(userId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ProfileHub initialData={initialData} />
    </div>
  );
}
