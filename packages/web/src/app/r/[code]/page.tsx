import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ code: string }>;
}

/**
 * Referral landing route: /r/jane or /r/REF123
 *
 * Redirects to the homepage with ?ref= in the URL. The TreatyVoteSection
 * reads this param, stores it in the pending vote, and passes it through
 * to the AuthForm on signin. User votes first, signs in after.
 */
export default async function ReferralRedirectPage({ params }: PageProps) {
  const { code } = await params;
  redirect(`/?ref=${encodeURIComponent(code)}#vote`);
}
