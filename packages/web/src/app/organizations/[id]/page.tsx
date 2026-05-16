import { notFound } from "next/navigation";
import Link from "next/link";
import { OrganizationCopyField } from "@/components/organizations/OrganizationCopyField";
import { OrganizationGrantCalculator } from "@/components/organizations/OrganizationGrantCalculator";
import { OrganizationProfileEditor } from "@/components/organizations/OrganizationProfileEditor";
import { OrganizationSurveyFrame } from "@/components/organizations/OrganizationSurveyFrame";
import { getCurrentUser } from "@/lib/auth-utils";
import { GLOBAL_SURVEY_NAME } from "@/lib/messaging";
import { canManageOrganization } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import {
  getOrganizationSurveyPath,
  NONPROFIT_COALITION_STRATEGY_URL,
  ROUTES,
} from "@/lib/routes";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import { buildOrganizationSurveyUrl } from "@/lib/site";
import { getUserDisplayName, userDisplaySelect } from "@/lib/user-display";

export const dynamic = "force-dynamic";

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const org = await prisma.organization.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id }, { slug: id }],
    },
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
  });

  if (!org) notFound();

  const canManage = user ? await canManageOrganization(user.id, org.id) : false;
  const isManager = Boolean(user && (canManage || user.isAdmin));
  const referralIdentifier = user
    ? getHandleOrReferralCode({
        handle: user.person?.handle ?? null,
        referralCode: user.referralCode,
      })
    : null;
  const organizationSurveyUrl = buildOrganizationSurveyUrl(org.slug);
  const donationHref = getSafeHttpUrl(org.donationUrl);
  const embeddedSurveyPath = getOrganizationSurveyPath(org.slug);
  const memberSurveyUrl = referralIdentifier
    ? buildOrganizationSurveyUrl(org.slug, {
        referralCode: referralIdentifier,
      })
    : null;
  const iframeTitle = `${org.name} ${GLOBAL_SURVEY_NAME}`;
  const escapedIframeTitle = escapeHtml(iframeTitle);
  const iframeCode = `<iframe src="${organizationSurveyUrl}" title="${escapedIframeTitle}" width="100%" height="760" style="border:0;max-width:100%;"></iframe>`;
  const buttonCode = `<a href="${organizationSurveyUrl}" style="display:inline-block;border:1px solid #000;padding:12px 16px;color:#000;text-decoration:none;font-weight:700;">Take the ${GLOBAL_SURVEY_NAME}</a>`;
  const emailSubject = "30 seconds to end war and disease";
  const emailBody = `Subject: ${emailSubject}

Hi,

${org.name} joined the International Campaign to End War and Disease by publicly supporting the 1% Treaty: every nation should simultaneously redirect 1% of military spending to high-efficiency pragmatic clinical trials.

Please answer the ${GLOBAL_SURVEY_NAME}:

${organizationSurveyUrl}

This is a policy survey, not a candidate endorsement.`;

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10 border-b-2 border-foreground pb-6">
        {org.wordmarkLogoUrl || org.squareLogoUrl ? (
          <img
            alt={`${org.name} logo`}
            className="mb-6 max-h-16 max-w-56 object-contain"
            src={org.wordmarkLogoUrl ?? org.squareLogoUrl ?? undefined}
          />
        ) : null}
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
        {donationHref ? (
          <a
            href={donationHref}
            rel="noreferrer"
            className="mt-2 block text-sm font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Donate to {org.name}
          </a>
        ) : null}
        {org.description ? (
          <p className="mt-4 text-sm font-bold leading-7 text-muted-foreground">
            {org.description}
          </p>
        ) : null}
      </header>

      <div className="space-y-10">
        {org.status === "APPROVED" ? (
          <>
            <section>
              <h2 className="mb-3 text-lg font-black uppercase text-foreground">
                Share this organization&apos;s survey
              </h2>
              <div className="space-y-4">
                <OrganizationCopyField
                  label="Survey URL"
                  value={organizationSurveyUrl}
                />
                <OrganizationCopyField
                  label="Email starter"
                  minRows={10}
                  multiline
                  value={emailBody}
                />
                <OrganizationCopyField
                  label="Website button"
                  minRows={5}
                  multiline
                  value={buttonCode}
                />
                <OrganizationCopyField
                  label="Iframe embed"
                  minRows={5}
                  multiline
                  value={iframeCode}
                />
                <div>
                  <p className="mb-2 text-sm font-bold text-muted-foreground">
                    Survey preview
                  </p>
                  <OrganizationSurveyFrame
                    src={embeddedSurveyPath}
                    title={iframeTitle}
                  />
                </div>
                <p className="text-sm font-bold leading-7 text-muted-foreground">
                  Keep the organization URL intact so responses credit{" "}
                  {org.name}. Board needs a memo?{" "}
                  <a
                    href={NONPROFIT_COALITION_STRATEGY_URL}
                    className="underline underline-offset-4"
                  >
                    Use this one
                  </a>
                  .
                </p>
              </div>
            </section>
          </>
        ) : (
          <section className="border border-foreground bg-background p-5">
            <h2 className="mb-3 text-lg font-black uppercase text-foreground">
              Public survey not active yet
            </h2>
            <p className="text-sm font-bold leading-7 text-muted-foreground">
              This organization exists, but its public survey link and embed are
              available after campaign approval.
            </p>
          </section>
        )}

        {isManager ? (
          <>
            {org.status === "APPROVED" && memberSurveyUrl ? (
              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Manager referral link
                </h2>
                <p className="mb-3 text-sm font-bold leading-7 text-muted-foreground">
                  This version credits {org.name} and your personal referral
                  code. Use the public organization URL above for staff,
                  webmasters, and volunteers who do not need accounts.
                </p>
                <OrganizationCopyField
                  label="Manager referral URL"
                  value={memberSurveyUrl}
                />
              </section>
            ) : null}

            {org.status === "APPROVED" ? (
              <OrganizationGrantCalculator organizationName={org.name} />
            ) : null}

            <section>
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
            </section>

            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Members
              </h2>
              <ul className="space-y-2">
                {org.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between border border-foreground bg-background px-3 py-2 text-sm font-bold"
                  >
                    <span>{getUserDisplayName(m.user)}</span>
                    <span className="text-xs uppercase text-muted-foreground">
                      {m.role}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}

        <section>
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
                  className="border border-foreground bg-background p-3 text-sm font-bold"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span>{p.referendum.title}</span>
                    <span className="shrink-0 text-xs uppercase text-muted-foreground">
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
        </section>
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

function getSafeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
