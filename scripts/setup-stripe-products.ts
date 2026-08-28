/**
 * setup-stripe-products.ts
 *
 * Creates the donation products, prices, and Payment Links on the Stripe
 * account that STRIPE_SECRET_KEY belongs to, then regenerates BOTH derived
 * files so the runtime can never disagree with Stripe:
 *
 *   packages/site-kit/src/lib/stripe-payment-links.ts
 *   packages/site-kit/src/lib/stripe-config.ts
 *
 * Donations belong to Accelerated Medicine Foundation Inc (EIN 41-2555651),
 * Stripe account acct_1TPCJFD5epyB9qRx. Two guards keep it that way:
 *
 *   1. This script retrieves the account BEFORE writing anything and aborts
 *      unless business_type === "non_profit".
 *   2. stripe-payment-links.test.ts fails if the generated IDs belong to any
 *      other account, or if any generated file contains a localhost URL.
 *
 * Idempotent: products are found by metadata, prices by amount+interval, and
 * Payment Links by their price metadata; existing objects are reused and only
 * missing ones are created. Redirect URLs are converged on every run.
 *
 * Usage (never commit the key, never leave it uncommented in .env):
 *   STRIPE_SECRET_KEY=sk_live_... pnpm --dir apps/optimitron exec tsx ../../scripts/setup-stripe-products.ts
 */
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type Stripe from "stripe";

const repoRoot = path.resolve(__dirname, "..");

const AMOUNTS = [1, 5, 10, 25, 50, 100, 250, 500, 1000] as const;
const DONATION_TYPES = ["oneTime", "monthly"] as const;
type DonationTypeKey = (typeof DONATION_TYPES)[number];

const MANAGED_BY = "setup-stripe-products";
const PRODUCT_DESCRIPTION =
  "Accelerated Medicine Foundation (dba Institute for Accelerated Medicine), a 501(c)(3) nonprofit. EIN 41-2555651. Donations are tax-deductible.";
const SUCCESS_REDIRECT_URL =
  "https://acceleratedmedicine.org/donate/success?session_id={CHECKOUT_SESSION_ID}";
const PRODUCT_NAMES: Record<DonationTypeKey, string> = {
  oneTime: "One-Time Donation",
  monthly: "Monthly Donation",
};

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Pass it explicitly for this one-off run; do not put it in .env uncommented.",
    );
  }
  // Resolve the SDK through an app that depends on it, so this script works
  // from the repo root, which has no stripe dependency of its own.
  const requireFromApp = createRequire(
    path.join(repoRoot, "apps", "optimitron", "package.json"),
  );
  const StripeCtor = requireFromApp("stripe") as typeof Stripe;
  return new StripeCtor(key);
}

/**
 * Refuse to write anything unless the target account is registered as a
 * nonprofit — donation products belong only on the foundation's account.
 */
async function assertNonProfitAccount(stripe: Stripe): Promise<string> {
  const account = await stripe.accounts.retrieve();
  const name =
    account.business_profile?.name ??
    account.settings?.dashboard?.display_name ??
    "(unnamed)";
  if (account.business_type !== "non_profit") {
    throw new Error(
      `REFUSING TO CONTINUE: account ${account.id} ("${name}") has business_type "${account.business_type}", not "non_profit". ` +
        "Donation products must only ever be created on the foundation's nonprofit account.",
    );
  }
  console.log(`Target account: ${account.id} ("${name}") — non_profit ✓`);
  return account.id;
}

async function findOrCreateProduct(
  stripe: Stripe,
  donationType: DonationTypeKey,
): Promise<Stripe.Product> {
  const existing = (
    await stripe.products.list({ active: true, limit: 100 })
  ).data.find(
    (product) =>
      product.metadata.managed_by === MANAGED_BY &&
      product.metadata.donation_type === donationType,
  );
  if (existing) {
    if (existing.description !== PRODUCT_DESCRIPTION) {
      console.log(`  updating description on ${existing.id}`);
      return stripe.products.update(existing.id, {
        description: PRODUCT_DESCRIPTION,
      });
    }
    console.log(`  product ${donationType}: reusing ${existing.id}`);
    return existing;
  }
  const created = await stripe.products.create({
    name: PRODUCT_NAMES[donationType],
    description: PRODUCT_DESCRIPTION,
    metadata: { managed_by: MANAGED_BY, donation_type: donationType },
  });
  console.log(`  product ${donationType}: created ${created.id}`);
  return created;
}

async function findOrCreatePrice(
  stripe: Stripe,
  product: Stripe.Product,
  donationType: DonationTypeKey,
  amount: number,
): Promise<Stripe.Price> {
  const unitAmount = amount * 100;
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  });
  const existing = prices.data.find(
    (price) =>
      price.currency === "usd" &&
      price.unit_amount === unitAmount &&
      (donationType === "monthly"
        ? price.recurring?.interval === "month"
        : !price.recurring),
  );
  if (existing) return existing;
  return stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: unitAmount,
    ...(donationType === "monthly"
      ? { recurring: { interval: "month" } }
      : {}),
    metadata: { managed_by: MANAGED_BY, donation_type: donationType },
  });
}

async function findOrCreatePaymentLink(
  stripe: Stripe,
  price: Stripe.Price,
  donationType: DonationTypeKey,
  amount: number,
): Promise<Stripe.PaymentLink> {
  const existing = (
    await stripe.paymentLinks.list({ active: true, limit: 100 })
  ).data.find(
    (link) =>
      link.metadata.managed_by === MANAGED_BY &&
      link.metadata.price_id === price.id,
  );
  const afterCompletion: Stripe.PaymentLinkCreateParams.AfterCompletion = {
    type: "redirect",
    redirect: { url: SUCCESS_REDIRECT_URL },
  };
  if (existing) {
    const redirectUrl =
      existing.after_completion?.type === "redirect"
        ? existing.after_completion.redirect?.url
        : undefined;
    if (redirectUrl !== SUCCESS_REDIRECT_URL) {
      console.log(`  fixing redirect on ${existing.id}`);
      return stripe.paymentLinks.update(existing.id, {
        after_completion: afterCompletion,
      });
    }
    return existing;
  }
  return stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    after_completion: afterCompletion,
    metadata: {
      managed_by: MANAGED_BY,
      donation_type: donationType,
      amount: String(amount),
      price_id: price.id,
    },
  });
}

type PerAmount<T> = Record<(typeof AMOUNTS)[number], T>;

function renderRecord(record: PerAmount<string>, indent: string): string {
  return AMOUNTS.map(
    (amount) => `${indent}${amount}: "${record[amount]}",`,
  ).join("\n");
}

function paymentLinksFileContents(
  accountId: string,
  urls: Record<DonationTypeKey, PerAmount<string>>,
  linkIds: Record<DonationTypeKey, PerAmount<string>>,
): string {
  return `// Stripe Payment Links - Auto-generated by scripts/setup-stripe-products.ts
// Direct links to Stripe-hosted checkout pages. DO NOT HAND-EDIT: rerun the
// script instead, so Stripe and this file cannot disagree.
//
// Every link below was created on the Stripe account named in
// STRIPE_PAYMENT_LINKS_ACCOUNT_ID after the script verified the account's
// business_type is "non_profit". stripe-payment-links.test.ts enforces this.

/** The Stripe account every Payment Link in this file was created on. */
export const STRIPE_PAYMENT_LINKS_ACCOUNT_ID = "${accountId}" as const

export const PAYMENT_LINKS = {
  oneTime: {
${renderRecord(urls.oneTime, "    ")}
  },
  monthly: {
${renderRecord(urls.monthly, "    ")}
  },
} as const

/**
 * Payment Link object IDs, same shape as PAYMENT_LINKS. Stripe object IDs
 * embed the owning account's suffix, which lets tests verify the account
 * without an API call.
 */
export const PAYMENT_LINK_IDS = {
  oneTime: {
${renderRecord(linkIds.oneTime, "    ")}
  },
  monthly: {
${renderRecord(linkIds.monthly, "    ")}
  },
} as const

export type PresetAmount = ${AMOUNTS.join(" | ")}
export type DonationType = "oneTime" | "monthly"

/**
 * Get the Payment Link URL for a preset amount
 */
export function getPaymentLink(
  amount: PresetAmount,
  type: DonationType,
  email?: string,
  name?: string
): string {
  const baseUrl = PAYMENT_LINKS[type][amount]

  if (!baseUrl) {
    throw new Error(\`No payment link found for \${type} donation of $\${amount}\`)
  }

  // Add prefilled email and client reference ID
  const params = new URLSearchParams()
  if (email) {
    params.set("prefilled_email", email)
  }
  if (name) {
    params.set("client_reference_id", name)
  }

  return params.toString() ? \`\${baseUrl}?\${params.toString()}\` : baseUrl
}

/**
 * Check if an amount is a preset amount with a Payment Link
 */
export function isPresetAmount(amount: number): amount is PresetAmount {
  return [${AMOUNTS.join(", ")}].includes(amount)
}
`;
}

function configFileContents(
  accountId: string,
  products: Record<DonationTypeKey, string>,
  prices: Record<DonationTypeKey, PerAmount<string>>,
): string {
  return `/**
 * Stripe Product and Price Configuration
 * Auto-generated by scripts/setup-stripe-products.ts. DO NOT HAND-EDIT:
 * rerun the script instead. All IDs belong to the account below, which the
 * script verified is registered as a nonprofit before writing this file.
 */

export const STRIPE_CONFIG = {
  accountId: "${accountId}",
  products: {
    oneTime: "${products.oneTime}",
    monthly: "${products.monthly}",
  },
  prices: {
    oneTime: {
${renderRecord(prices.oneTime, "      ")}
    },
    monthly: {
${renderRecord(prices.monthly, "      ")}
    },
  },
} as const

export const PRESET_AMOUNTS = [${AMOUNTS.join(", ")}] as const

export type PresetAmount = (typeof PRESET_AMOUNTS)[number]
export type DonationType = "one-time" | "monthly"
`;
}

async function main() {
  const stripe = getStripe();
  const accountId = await assertNonProfitAccount(stripe);

  const urls = { oneTime: {}, monthly: {} } as Record<
    DonationTypeKey,
    PerAmount<string>
  >;
  const linkIds = { oneTime: {}, monthly: {} } as Record<
    DonationTypeKey,
    PerAmount<string>
  >;
  const priceIds = { oneTime: {}, monthly: {} } as Record<
    DonationTypeKey,
    PerAmount<string>
  >;
  const productIds = {} as Record<DonationTypeKey, string>;

  for (const donationType of DONATION_TYPES) {
    const product = await findOrCreateProduct(stripe, donationType);
    productIds[donationType] = product.id;
    for (const amount of AMOUNTS) {
      const price = await findOrCreatePrice(
        stripe,
        product,
        donationType,
        amount,
      );
      const link = await findOrCreatePaymentLink(
        stripe,
        price,
        donationType,
        amount,
      );
      priceIds[donationType][amount] = price.id;
      linkIds[donationType][amount] = link.id;
      urls[donationType][amount] = link.url;
      console.log(`  ${donationType} $${amount}: ${link.id} ${link.url}`);
    }
  }

  const linksPath = path.join(
    repoRoot,
    "packages/site-kit/src/lib/stripe-payment-links.ts",
  );
  const configPath = path.join(
    repoRoot,
    "packages/site-kit/src/lib/stripe-config.ts",
  );
  await writeFile(
    linksPath,
    paymentLinksFileContents(accountId, urls, linkIds),
    "utf8",
  );
  await writeFile(
    configPath,
    configFileContents(accountId, productIds, priceIds),
    "utf8",
  );
  console.log(`Wrote ${path.relative(repoRoot, linksPath)}`);
  console.log(`Wrote ${path.relative(repoRoot, configPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
