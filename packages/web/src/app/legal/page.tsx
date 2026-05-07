import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

type LegalPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegalPage({ searchParams }: LegalPageProps) {
  const params = (await searchParams) ?? {};
  const redirectSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      redirectSearchParams.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => redirectSearchParams.append(key, item));
    }
  }

  const queryString = redirectSearchParams.toString();
  redirect(
    `${ROUTES.endorse}${queryString ? `?${queryString}` : ""}#organization-legal-notes`,
  );
}
