import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

function appendSearchParams(
  params: Record<string, string | string[] | undefined>,
) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) next.append(key, item);
      }
    } else if (value) {
      next.set(key, value);
    }
  }
  return next.toString();
}

export default async function LegacyPeopleManagePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const qs = appendSearchParams((await searchParams) ?? {});
  redirect(qs ? `${ROUTES.plaintiffsManage}?${qs}` : ROUTES.plaintiffsManage);
}
