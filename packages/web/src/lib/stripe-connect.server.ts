import {
  Prisma,
  StripeConnectedAccountStatus,
  StripeTransferCapabilityStatus,
  type PrismaClient,
  type StripeConnectedAccount,
} from "@optimitron/db";
import { serverEnv } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const STRIPE_V2_API_VERSION = "2026-06-24.preview";
const STRIPE_API_ORIGIN = "https://api.stripe.com";

const log = createLogger("stripe-connect");

type StripeConnectedAccountDb = Pick<
  PrismaClient,
  "stripeConnectedAccount" | "user"
>;

interface StripeV2RequirementEntry {
  minimum_deadline?: {
    status?: string | null;
  } | null;
  requested_reasons?: Array<{ code?: string | null }> | null;
  status?: string | null;
}

interface StripeV2Requirements {
  currently_due?: unknown[] | null;
  eventually_due?: unknown[] | null;
  past_due?: unknown[] | null;
  entries?: StripeV2RequirementEntry[] | null;
}

interface StripeV2Account {
  id: string;
  contact_email?: string | null;
  display_name?: string | null;
  dashboard?: string | null;
  identity?: {
    country?: string | null;
  } | null;
  configuration?: {
    recipient?: {
      capabilities?: {
        stripe_balance?: {
          stripe_transfers?: {
            requested?: boolean | null;
            status?: string | null;
            status_details?: {
              code?: string | null;
            } | null;
          } | null;
        } | null;
      } | null;
    } | null;
  } | null;
  requirements?: StripeV2Requirements | null;
}

interface StripeV2AccountLink {
  url: string;
}

export interface StripeConnectStatus {
  connectedAccountId: string | null;
  onboardingCompletedAt: Date | null;
  onboardingStartedAt: Date | null;
  requirementsCurrentlyDueCount: number;
  requirementsEventuallyDueCount: number;
  requirementsPastDueCount: number;
  status: StripeConnectedAccountStatus | "NOT_CREATED";
  transfersCapabilityStatus: StripeTransferCapabilityStatus;
  transferReady: boolean;
}

function getStripeSecretKey() {
  const key = serverEnv.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  return key;
}

async function stripeV2Request<T>(
  path: string,
  init: { body?: unknown; method?: "GET" | "POST" } = {},
) {
  const response = await fetch(`${STRIPE_API_ORIGIN}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      "Content-Type": "application/json",
      "Stripe-Version": STRIPE_V2_API_VERSION,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Stripe Connect API failed (${response.status} ${response.statusText}): ${body}`,
    );
  }

  return (await response.json()) as T;
}

function trimToNull(value: string | null | undefined, maxLength = 200) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function normalizeCountryCode(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase();
  return trimmed && /^[a-z]{2}$/u.test(trimmed) ? trimmed : "us";
}

function getRequirementArrayCount(
  requirements: StripeV2Requirements | null | undefined,
  key: "currently_due" | "eventually_due" | "past_due",
) {
  const value = requirements?.[key];
  return Array.isArray(value) ? value.length : null;
}

function getRequirementEntryCount(
  requirements: StripeV2Requirements | null | undefined,
  status: "currently_due" | "eventually_due" | "past_due",
) {
  const entries = requirements?.entries;
  if (!Array.isArray(entries)) return 0;

  return entries.filter((entry) => {
    if (entry.status === status) return true;
    if (entry.minimum_deadline?.status === status) return true;
    return Boolean(
      entry.requested_reasons?.some((reason) => reason.code === status),
    );
  }).length;
}

function getRequirementCounts(requirements: StripeV2Requirements | null | undefined) {
  const currentlyDue =
    getRequirementArrayCount(requirements, "currently_due") ??
    getRequirementEntryCount(requirements, "currently_due");
  const eventuallyDue =
    getRequirementArrayCount(requirements, "eventually_due") ??
    getRequirementEntryCount(requirements, "eventually_due");
  const pastDue =
    getRequirementArrayCount(requirements, "past_due") ??
    getRequirementEntryCount(requirements, "past_due");

  return { currentlyDue, eventuallyDue, pastDue };
}

function getTransferCapabilityStatus(account: StripeV2Account) {
  const capability =
    account.configuration?.recipient?.capabilities?.stripe_balance
      ?.stripe_transfers;
  const status = capability?.status?.toLowerCase();
  const detailCode = capability?.status_details?.code?.toLowerCase();

  if (status === "active") return StripeTransferCapabilityStatus.ACTIVE;
  if (detailCode === "requirements_past_due") {
    return StripeTransferCapabilityStatus.REQUIREMENTS_PAST_DUE;
  }
  if (status === "pending") return StripeTransferCapabilityStatus.PENDING;
  if (status === "inactive") return StripeTransferCapabilityStatus.INACTIVE;
  if (status === "disabled") return StripeTransferCapabilityStatus.DISABLED;
  return StripeTransferCapabilityStatus.UNKNOWN;
}

function getConnectedAccountStatus(input: {
  account: StripeV2Account;
  onboardingStartedAt: Date | null | undefined;
}) {
  const transferStatus = getTransferCapabilityStatus(input.account);
  const requirements = getRequirementCounts(input.account.requirements);

  if (transferStatus === StripeTransferCapabilityStatus.ACTIVE) {
    return StripeConnectedAccountStatus.ONBOARDING_COMPLETE;
  }
  if (
    transferStatus === StripeTransferCapabilityStatus.DISABLED ||
    transferStatus === StripeTransferCapabilityStatus.REQUIREMENTS_PAST_DUE
  ) {
    return StripeConnectedAccountStatus.RESTRICTED;
  }
  if (requirements.pastDue > 0) {
    return StripeConnectedAccountStatus.RESTRICTED;
  }
  if (input.onboardingStartedAt) {
    return StripeConnectedAccountStatus.ONBOARDING_STARTED;
  }
  return StripeConnectedAccountStatus.CREATED;
}

function toRequirementsJson(
  requirements: StripeV2Requirements | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (!requirements) return undefined;
  return requirements as unknown as Prisma.InputJsonValue;
}

function mapAccountUpdateData(
  account: StripeV2Account,
  existing?: Pick<StripeConnectedAccount, "onboardingStartedAt"> | null,
) {
  const requirementCounts = getRequirementCounts(account.requirements);
  const transfersCapabilityStatus = getTransferCapabilityStatus(account);
  const status = getConnectedAccountStatus({
    account,
    onboardingStartedAt: existing?.onboardingStartedAt ?? null,
  });
  const now = new Date();

  return {
    contactEmail: trimToNull(account.contact_email, 320),
    countryCode: normalizeCountryCode(account.identity?.country),
    dashboardAccess: account.dashboard ?? "express",
    displayName: trimToNull(account.display_name, 200),
    lastSyncedAt: now,
    onboardingCompletedAt:
      status === StripeConnectedAccountStatus.ONBOARDING_COMPLETE
        ? now
        : undefined,
    requirementsCurrentlyDueCount: requirementCounts.currentlyDue,
    requirementsEventuallyDueCount: requirementCounts.eventuallyDue,
    requirementsJson: toRequirementsJson(account.requirements),
    requirementsPastDueCount: requirementCounts.pastDue,
    status,
    transfersCapabilityStatus,
  } satisfies Prisma.StripeConnectedAccountUpdateInput;
}

function getAccountIncludeQuery() {
  const params = new URLSearchParams();
  params.append("include[]", "configuration.recipient");
  params.append("include[]", "identity");
  params.append("include[]", "requirements");
  return params.toString();
}

async function retrieveStripeV2Account(stripeAccountId: string) {
  return stripeV2Request<StripeV2Account>(
    `/v2/core/accounts/${encodeURIComponent(stripeAccountId)}?${getAccountIncludeQuery()}`,
  );
}

export async function syncStripeConnectedAccount(
  stripeAccountId: string,
  db: StripeConnectedAccountDb = prisma,
) {
  const existing = await db.stripeConnectedAccount.findUnique({
    where: { stripeAccountId },
    select: {
      id: true,
      onboardingStartedAt: true,
    },
  });
  if (!existing) {
    throw new Error("Stripe connected account not found.");
  }

  const account = await retrieveStripeV2Account(stripeAccountId);
  return db.stripeConnectedAccount.update({
    where: { id: existing.id },
    data: mapAccountUpdateData(account, existing),
  });
}

export async function getOrCreateStripeConnectedAccount(
  userId: string,
  db: StripeConnectedAccountDb = prisma,
) {
  const existing = await db.stripeConnectedAccount.findUnique({
    where: { userId },
  });
  if (existing && !existing.deletedAt) {
    return existing;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      countryCode: true,
      email: true,
      id: true,
      personId: true,
      person: {
        select: {
          displayName: true,
          handle: true,
        },
      },
    },
  });
  if (!user) {
    throw new Error("User not found.");
  }

  const countryCode = normalizeCountryCode(user.countryCode);
  const displayName =
    trimToNull(user.person?.displayName, 200) ??
    trimToNull(user.person?.handle, 200) ??
    trimToNull(user.email, 200) ??
    "Optimitron contractor";

  const account = await stripeV2Request<StripeV2Account>("/v2/core/accounts", {
    method: "POST",
    body: {
      contact_email: user.email,
      display_name: displayName,
      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      dashboard: "express",
      identity: {
        country: countryCode,
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                requested: true,
              },
            },
          },
        },
      },
      include: ["configuration.recipient", "identity", "requirements"],
    },
  });

  const syncedData = mapAccountUpdateData(account, null);
  const createData = {
    ...syncedData,
    configuration: "recipient",
    metadata: {
      createdBy: "optimitron-task-payouts",
    } satisfies Prisma.InputJsonValue,
    personId: user.personId,
    stripeAccountId: account.id,
    userId,
  } satisfies Prisma.StripeConnectedAccountUncheckedCreateInput;

  if (existing) {
    return db.stripeConnectedAccount.update({
      where: { id: existing.id },
      data: {
        ...syncedData,
        configuration: "recipient",
        deletedAt: null,
        metadata: {
          createdBy: "optimitron-task-payouts",
        } satisfies Prisma.InputJsonValue,
        personId: user.personId,
        stripeAccountId: account.id,
      },
    });
  }

  return db.stripeConnectedAccount.create({ data: createData });
}

function assertHttpsUrl(url: string, label: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    throw new Error(`Stripe Connect ${label} must use HTTPS.`);
  }
  return parsed.toString();
}

export async function createStripeConnectOnboardingLink(input: {
  refreshUrl: string;
  returnUrl: string;
  userId: string;
}) {
  const connectedAccount = await getOrCreateStripeConnectedAccount(input.userId);
  const returnUrl = assertHttpsUrl(input.returnUrl, "return_url");
  const refreshUrl = assertHttpsUrl(input.refreshUrl, "refresh_url");

  const accountLink = await stripeV2Request<StripeV2AccountLink>(
    "/v2/core/account_links",
    {
      method: "POST",
      body: {
        account: connectedAccount.stripeAccountId,
        use_case: {
          type: "account_onboarding",
          account_onboarding: {
            collection_options: {
              fields: "eventually_due",
              future_requirements: "include",
            },
            configurations: ["recipient"],
            refresh_url: refreshUrl,
            return_url: returnUrl,
          },
        },
      },
    },
  );

  await prisma.stripeConnectedAccount.update({
    where: { id: connectedAccount.id },
    data: {
      onboardingStartedAt: new Date(),
      status: StripeConnectedAccountStatus.ONBOARDING_STARTED,
    },
  });

  return {
    connectedAccountId: connectedAccount.id,
    url: accountLink.url,
  };
}

export async function getStripeConnectStatus(
  userId: string,
  options: { sync?: boolean } = {},
  db: StripeConnectedAccountDb = prisma,
): Promise<StripeConnectStatus> {
  const account = await db.stripeConnectedAccount.findUnique({
    where: { userId },
  });
  if (!account || account.deletedAt) {
    return {
      connectedAccountId: null,
      onboardingCompletedAt: null,
      onboardingStartedAt: null,
      requirementsCurrentlyDueCount: 0,
      requirementsEventuallyDueCount: 0,
      requirementsPastDueCount: 0,
      status: "NOT_CREATED",
      transferReady: false,
      transfersCapabilityStatus: StripeTransferCapabilityStatus.UNKNOWN,
    };
  }

  let current = account;
  if (options.sync) {
    try {
      current = await syncStripeConnectedAccount(account.stripeAccountId, db);
    } catch (error) {
      log.error("Failed to sync Stripe connected account", {
        error,
        stripeAccountId: account.stripeAccountId,
        userId,
      });
    }
  }

  const transferReady =
    current.status === StripeConnectedAccountStatus.ONBOARDING_COMPLETE &&
    current.transfersCapabilityStatus === StripeTransferCapabilityStatus.ACTIVE;

  return {
    connectedAccountId: current.id,
    onboardingCompletedAt: current.onboardingCompletedAt,
    onboardingStartedAt: current.onboardingStartedAt,
    requirementsCurrentlyDueCount: current.requirementsCurrentlyDueCount,
    requirementsEventuallyDueCount: current.requirementsEventuallyDueCount,
    requirementsPastDueCount: current.requirementsPastDueCount,
    status: current.status,
    transferReady,
    transfersCapabilityStatus: current.transfersCapabilityStatus,
  };
}

export async function isUserStripeTransferReady(
  userId: string,
  db: Pick<PrismaClient, "stripeConnectedAccount"> = prisma,
) {
  const account = await db.stripeConnectedAccount.findUnique({
    where: { userId },
    select: {
      deletedAt: true,
      status: true,
      transfersCapabilityStatus: true,
    },
  });

  return Boolean(
    account &&
      !account.deletedAt &&
      account.status === StripeConnectedAccountStatus.ONBOARDING_COMPLETE &&
      account.transfersCapabilityStatus === StripeTransferCapabilityStatus.ACTIVE,
  );
}
