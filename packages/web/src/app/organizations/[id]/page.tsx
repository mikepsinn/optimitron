import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { OrganizationProfileEditor } from "@/components/organizations/OrganizationProfileEditor";
import { getCurrentUser } from "@/lib/auth-utils";
import { canManageOrganization } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import {
  getOrganizationPath,
  getSignInPath,
  NONPROFIT_COALITION_STRATEGY_URL,
  ROUTES,
} from "@/lib/routes";
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
  const iframeTitle = `${org.name} Clinical Trial Abundance Survey`;
  const escapedIframeTitle = escapeHtml(iframeTitle);
  const iframeCode = `<iframe src="${embedSurveyUrl}" title="${escapedIframeTitle}" width="100%" height="760" style="border:0;max-width:100%;"></iframe>`;
  const buttonCode = `<a href="${embedSurveyUrl}" style="display:inline-block;border:1px solid #000;padding:12px 16px;color:#000;text-decoration:none;font-weight:700;">Take the Clinical Trial Abundance Survey</a>`;
  const emailSubject = "30 seconds on clinical trial abundance";
  const emailBody = `Subject: ${emailSubject}

Hi,

${org.name} joined the International Campaign to End War and Disease by publicly supporting the 1% Treaty: every nation should simultaneously redirect 1% of military spending to high-efficiency pragmatic clinical trials.

Please review the treaty question and record your response here:

${memberSurveyUrl}

Responses from this link are credited to ${org.name}. This is a policy survey, not a candidate endorsement.`;

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
        {org.status === "APPROVED" ? (
          <div className="border-2 border-foreground bg-background p-5">
            <h2 className="mb-3 text-lg font-black uppercase text-foreground">
              Member survey
            </h2>
            <p className="text-sm font-bold leading-7 text-muted-foreground">
              Your organization has trusted reach. Use it once: share the
              Clinical Trial Abundance Survey link, or place the button or
              iframe on your website, so your audience can review the treaty
              question and record its response.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-bold leading-7 text-foreground">
              <li>
                Share the member link in an email, newsletter, or social post.
              </li>
              <li>
                Embed the website button or iframe on a page your members see.
              </li>
              <li>
                Keep the organization URL intact so responses are credited here.
              </li>
            </ol>
            <p className="mt-4 text-sm font-bold leading-7 text-muted-foreground">
              For the case behind this, read{" "}
              <a
                href={NONPROFIT_COALITION_STRATEGY_URL}
                className="underline underline-offset-4"
              >
                why organizations should share this
              </a>
              .
            </p>
          </div>
        ) : null}

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Profile
          </h2>
          <OrganizationProfileEditor
            organization={{
              contactEmail: org.contactEmail,
              description: org.description,
              donationUrl: org.donationUrl,
              id: org.id,
              name: org.name,
              squareLogoUrl: org.squareLogoUrl,
              type: org.type,
              website: org.website,
              wordmarkLogoUrl: org.wordmarkLogoUrl,
            }}
          />
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
            Clinical Trial Abundance Survey
          </h2>
          {org.status === "APPROVED" ? (
            <div className="space-y-4">
              <p className="text-sm font-bold text-muted-foreground">
                Use the member link for email and social posts. Use the iframe
                for your website. Both credit {org.name}; the member link also
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
              This organization must be approved before the embed kit is
              available.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Referendum positions
          </h2>
          {org.referendumPositions.length === 0 ? (
            <p className="text-sm font-bold text-muted-foreground">
              This organization has not joined the campaign yet.{" "}
              <Link href={ROUTES.endorse} className="underline">
                Join as an organization
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
