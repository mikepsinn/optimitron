import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";
import { canManageOrganization } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import { getOrganizationPath, getSignInPath, ROUTES } from "@/lib/routes";
import { buildOrganizationSurveyUrl } from "@/lib/site";
import {
  getUserDisplayHandle,
  getUserDisplayName,
  userDisplaySelect,
} from "@/lib/user-display";

export const dynamic = "force-dynamic";

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(getSignInPath(getOrganizationPath(id)));
  }

  const [canManage, org] = await Promise.all([
    canManageOrganization(user.id, id),
    prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: userDisplaySelect },
          },
          orderBy: { joinedAt: "asc" },
        },
        referendumPositions: {
          where: { deletedAt: null },
          include: {
            referendum: { select: { id: true, slug: true, title: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    }),
  ]);

  if (!org || org.deletedAt) notFound();

  const isAllowed = canManage || user.isAdmin;
  if (!isAllowed) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase text-foreground">
          Access denied
        </h1>
        <p className="mt-4 font-bold text-muted-foreground">
          You are not a manager of this organization.
        </p>
        <Link href="/" className="mt-6 inline-block underline font-bold">
          Return home
        </Link>
      </section>
    );
  }

  const referralIdentifier = getUserDisplayHandle(user);
  const organizationSurveyUrl = buildOrganizationSurveyUrl(org.slug);
  const memberSurveyUrl = buildOrganizationSurveyUrl(org.slug, {
    referralCode: referralIdentifier,
  });
  const embedSurveyUrl = organizationSurveyUrl;
  const iframeTitle = `${org.name} Trial Abundance Survey`;
  const escapedIframeTitle = escapeHtml(iframeTitle);
  const iframeCode = `<iframe src="${embedSurveyUrl}" title="${escapedIframeTitle}" width="100%" height="760" style="border:0;max-width:100%;"></iframe>`;
  const buttonCode = `<a href="${embedSurveyUrl}" style="display:inline-block;border:1px solid #000;padding:12px 16px;color:#000;text-decoration:none;font-weight:700;">Take the Trial Abundance Survey</a>`;
  const emailSubject = "Two questions about clinical trial funding";
  const emailBody = `Subject: ${emailSubject}

Hi,

Can you take 30 seconds to answer two questions about clinical trial funding?

${memberSurveyUrl}

Responses from this link are credited to ${org.name}.`;

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10 border-b-2 border-foreground pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Organization · {org.status.toLowerCase()}
        </p>
        <h1 className="text-3xl font-black uppercase text-foreground sm:text-4xl">
          {org.name}
        </h1>
        {org.website ? (
          <a
            href={org.website}
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-bold underline text-muted-foreground"
          >
            {org.website}
          </a>
        ) : null}
      </header>

      <div className="space-y-10">
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Profile
          </h2>
          <dl className="space-y-2 text-base font-bold text-foreground">
            <div>
              <dt className="inline text-muted-foreground">Type: </dt>
              <dd className="inline">{org.type}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Contact: </dt>
              <dd className="inline">{org.contactEmail ?? "—"}</dd>
            </div>
            {org.description ? (
              <div>
                <dt className="inline text-muted-foreground">About: </dt>
                <dd className="inline">{org.description}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Members
          </h2>
          <ul className="space-y-2">
            {org.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between border-2 border-foreground bg-background px-3 py-2 text-sm font-bold"
              >
                <span>{getUserDisplayName(m.user)}</span>
                <span className="text-xs uppercase text-muted-foreground">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Trial Abundance Survey
          </h2>
          {org.status === "APPROVED" ? (
            <div className="space-y-4">
              <p className="text-sm font-bold text-muted-foreground">
                Use the member link for email and social posts. Use the iframe
                for a website page. Both credit {org.name}; the member link also
                credits your referral code.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm font-bold text-muted-foreground">
                    Member link
                  </p>
                  <a
                    href={memberSurveyUrl}
                    className="break-all text-sm font-bold underline"
                  >
                    {memberSurveyUrl}
                  </a>
                </div>
                <div>
                  <p className="mb-1 text-sm font-bold text-muted-foreground">
                    Organization-only link
                  </p>
                  <a
                    href={organizationSurveyUrl}
                    className="break-all text-sm font-bold underline"
                  >
                    {organizationSurveyUrl}
                  </a>
                </div>
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-muted-foreground">
                  Email starter
                </span>
                <textarea
                  readOnly
                  className="min-h-36 w-full border-2 border-foreground bg-background p-3 font-mono text-xs"
                  value={emailBody}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-muted-foreground">
                  Website button
                </span>
                <textarea
                  readOnly
                  className="min-h-28 w-full border-2 border-foreground bg-background p-3 font-mono text-xs"
                  value={buttonCode}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-muted-foreground">
                  Iframe code
                </span>
                <textarea
                  readOnly
                  className="min-h-28 w-full border-2 border-foreground bg-background p-3 font-mono text-xs"
                  value={iframeCode}
                />
              </label>
              <div>
                <p className="mb-2 text-sm font-bold text-muted-foreground">
                  Preview
                </p>
                <iframe
                  src={embedSurveyUrl}
                  title={iframeTitle}
                  className="h-[520px] w-full border-2 border-foreground"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm font-bold text-muted-foreground">
              This organization is not approved yet. New organizations are
              approved automatically; this one may be legacy or admin-created.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Referendum positions
          </h2>
          {org.referendumPositions.length === 0 ? (
            <p className="text-sm font-bold text-muted-foreground">
              No treaty signature yet.{" "}
              <Link href={ROUTES.endorse} className="underline">
                Sign as an organization
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {org.referendumPositions.map((p) => (
                <li
                  key={p.id}
                  className="border-2 border-foreground bg-background p-3 text-sm font-bold"
                >
                  <div className="flex items-center justify-between">
                    <span>{p.referendum.title}</span>
                    <span className="text-xs uppercase text-muted-foreground">
                      {p.position} · {p.status.toLowerCase()}
                    </span>
                  </div>
                  {p.statement ? (
                    <p className="mt-2 italic text-muted-foreground">
                      &ldquo;{p.statement}&rdquo;
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
