import { permanentRedirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LegacyCampaignPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      query.append(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) query.append(key, item);
      }
    }
  }

  const serialized = query.toString();
  permanentRedirect(
    serialized ? `${ROUTES.signatories}?${serialized}` : ROUTES.signatories,
  );
}
