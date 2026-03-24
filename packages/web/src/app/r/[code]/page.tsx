import { redirect } from "next/navigation";
import { cookies } from "next/headers";

interface PageProps {
  params: Promise<{ code: string }>;
}

/**
 * Referral landing route: /r/jane or /r/REF123
 *
 * Stores the referral code in a cookie, then redirects to the homepage.
 * The homepage pitch converts them; the stored ref attributes the signup.
 */
export default async function ReferralRedirectPage({ params }: PageProps) {
  const { code } = await params;

  const cookieStore = await cookies();
  cookieStore.set("ref", code, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  redirect("/");
}
