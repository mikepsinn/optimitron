import { notFound } from "next/navigation";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_REDUCTION_PCT,
  fmtParamValueOnly,
} from "@optimitron/data/parameters";
import { OrganizationCopyField } from "@/components/organizations/OrganizationCopyField";
import { OrganizationGrantCalculator } from "@/components/organizations/OrganizationGrantCalculator";
import { OrganizationProfileEditor } from "@/components/organizations/OrganizationProfileEditor";
import { OrganizationSurveyFrame } from "@/components/organizations/OrganizationSurveyFrame";
import { getCurrentUser } from "@/lib/auth-utils";
import { GLOBAL_SURVEY_NAME } from "@/lib/messaging";
import { canManageOrganization } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import {
  PRAGMATIC_CLINICAL_TRIALS_MANUAL_URL,
  getOrganizationSurveyPath,
} from "@/lib/routes";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import { buildOrganizationSurveyUrl } from "@/lib/site";
import {
  FLOW_GLOBAL_WARHEAD_COUNT,
  FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR,
  FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  formatFlowWords,
} from "@/lib/treaty-share-flow-parameters";
import { getUserDisplayName, userDisplaySelect } from "@/lib/user-display";

export const dynamic = "force-dynamic";

export default async function OrganizationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
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
    },
  });

  if (!org) notFound();

  const canManage = user ? await canManageOrganization(user.id, org.id) : false;
  const isManager = Boolean(user && (canManage || user.isAdmin));
  const joinedFlag = resolvedSearchParams.joined === "1";
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
  const nuclearWinterWarheadThreshold = formatFlowWords(
    FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD,
    3,
  );
  const globalWarheadCount = formatFlowWords(FLOW_GLOBAL_WARHEAD_COUNT, 3);
  const apocalypseCount = formatFlowWords(
    FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR,
    3,
  );
  const treatyReduction = fmtParamValueOnly(TREATY_REDUCTION_PCT, 1);
  const trialCapacityMultiplier = fmtParamValueOnly(
    DFDA_TRIAL_CAPACITY_MULTIPLIER,
    3,
  );
  const diseaseEradicationYears = fmtParamValueOnly(
    DFDA_QUEUE_CLEARANCE_YEARS,
    2,
  );
  const statusQuoYears = fmtParamValueOnly(STATUS_QUO_QUEUE_CLEARANCE_YEARS, 3);
  const emailSubject = "Please take 30 seconds to end war and disease";
  const emailBody = `Subject: ${emailSubject}

It currently requires about ${nuclearWinterWarheadThreshold} nuclear weapons to create a nuclear winter, destroy the food system, and cause an apocalypse. Humanity currently has about ${globalWarheadCount} nuclear weapons, sufficient to cause at least ${apocalypseCount} of these apocalypses.

Sacrificing one apocalypse of this mass-murder capacity by redirecting ${treatyReduction} of military spending to fund high-efficiency pragmatic clinical trials could increase the pace of medical research ${trialCapacityMultiplier} times. This could compress the time required to find the first treatment for all diseases from ${statusQuoYears} years to ${diseaseEradicationYears} years.

Please take this survey to share your opinion on this proposal:
${organizationSurveyUrl}`;
  const linkedSurveyUrl = linkHtml(
    organizationSurveyUrl,
    organizationSurveyUrl,
  );
  const emailHtmlBody = [
    `<p><strong>Subject:</strong> ${escapeHtml(emailSubject)}</p>`,
    `<p>It currently requires about ${linkHtml(
      nuclearWinterWarheadThreshold,
      FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD.manualPageUrl,
    )} nuclear weapons to create a nuclear winter, destroy the food system, and cause an apocalypse. Humanity currently has about ${linkHtml(
      globalWarheadCount,
      FLOW_GLOBAL_WARHEAD_COUNT.manualPageUrl,
    )} nuclear weapons, sufficient to cause at least ${linkHtml(
      apocalypseCount,
      FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR.manualPageUrl,
    )} of these apocalypses.</p>`,
    `<p>Sacrificing one apocalypse of this mass-murder capacity by redirecting ${linkHtml(
      treatyReduction,
      TREATY_REDUCTION_PCT.manualPageUrl,
    )} of military spending to fund high-efficiency ${linkHtml(
      "pragmatic clinical trials",
      PRAGMATIC_CLINICAL_TRIALS_MANUAL_URL,
    )} could increase the pace of medical research ${linkHtml(
      trialCapacityMultiplier,
      DFDA_TRIAL_CAPACITY_MULTIPLIER.manualPageUrl,
    )} times. This could compress the time required to find the first treatment for all diseases from ${linkHtml(
      statusQuoYears,
      STATUS_QUO_QUEUE_CLEARANCE_YEARS.manualPageUrl,
    )} years to ${linkHtml(
      diseaseEradicationYears,
      DFDA_QUEUE_CLEARANCE_YEARS.manualPageUrl,
    )} years.</p>`,
    `<p>Please take this survey to share your opinion on this proposal:<br />${linkedSurveyUrl}</p>`,
  ].join("\n");

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
        {isManager ? (
          <a
            href="#edit-organization"
            className="mt-4 inline-block border border-foreground px-3 py-2 text-xs font-black uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background"
          >
            Edit organization
          </a>
        ) : null}
      </header>

      {joinedFlag && (
        <p className="mb-6 border-y border-foreground py-3 text-sm font-bold uppercase tracking-wider text-foreground">
          You&apos;re in. Copy your survey link below and send it to your people.
        </p>
      )}

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
                  htmlValue={emailHtmlBody}
                  label="Email"
                  minRows={14}
                  multiline
                  value={emailBody}
                />
                <p className="text-sm font-bold leading-7 text-muted-foreground">
                  Use the organization URL above so responses credit {org.name}.
                </p>
                <details className="border border-foreground bg-background">
                  <summary className="cursor-pointer select-none px-4 py-3 text-sm font-black uppercase tracking-wider text-foreground">
                    More ways to share
                  </summary>
                  <div className="space-y-4 border-t border-foreground p-4">
                    <OrganizationCopyField
                      label="Website button"
                      minRows={5}
                      multiline
                      value={buttonCode}
                    />
                    <OrganizationCopyField
                      label="Embed on your website"
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
                  </div>
                </details>
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

            <section id="edit-organization" className="scroll-mt-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Edit organization
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

function linkHtml(label: string, href: string | null | undefined): string {
  const escapedLabel = escapeHtml(label);
  if (!href) return escapedLabel;
  return `<a href="${escapeHtml(href)}">${escapedLabel}</a>`;
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
