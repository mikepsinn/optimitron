import { Resend } from "resend";
import { z } from "zod";

import { escapeHtml } from "@/lib/escape-html";
import { PARTNER_TYPE_OPTIONS, PARTNER_TYPES } from "@/lib/partner-signup-options";
import { storePartnerSignup } from "@/lib/partner-signup-store";

export const partnerSignupSchema = z.object({
  submissionKey: z.string().uuid(),
  type: z.enum(PARTNER_TYPES),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  companyWebsite: z.string().max(500).optional().default(""),
});

export type PartnerSignupInput = z.infer<typeof partnerSignupSchema>;

export function buildPartnerSignupNotification(input: PartnerSignupInput) {
  const type = PARTNER_TYPE_OPTIONS[input.type].label;
  const organization = input.organization || "Not provided";
  const message = input.message || "Not provided";
  const subject = `[Partner sign-up] ${type}: ${input.name}${input.organization ? ` (${input.organization})` : ""}`;
  const text = [
    `Type: ${type}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Organization: ${organization}`,
    "",
    "Message:",
    message,
  ].join("\n");
  const html = `
    <h1>Partner sign-up</h1>
    <p><strong>Type:</strong> ${escapeHtml(type)}</p>
    <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Organization:</strong> ${escapeHtml(organization)}</p>
    <h2>Message</h2>
    <p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>
  `.trim();

  return { html, subject, text };
}

/**
 * Stores a sign-up and emails it to the Institute. Reply to the alert to answer the sender.
 * A failed alert fails the request, so the sender's retry sends it again. The retry uses the
 * same idempotency key, so Resend delivers each alert once.
 */
export async function sendPartnerSignup(
  rawInput: unknown,
  options: {
    clientKey: string;
    store?: typeof storePartnerSignup;
  },
): Promise<{ notified: boolean }> {
  const input = partnerSignupSchema.parse(rawInput);
  const store = options.store ?? storePartnerSignup;

  // Silently accept bot submissions, so bots learn nothing and spam stays out of the inbox.
  if (input.companyWebsite) {
    return { notified: false };
  }

  await store(input, input.submissionKey, options.clientKey);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Partner sign-up email service is not configured");
    return { notified: false };
  }

  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "no-reply@updates.dfda.earth";
  const result = await new Resend(apiKey).emails.send(
    {
      from: `Institute for Accelerated Medicine <${fromAddress}>`,
      to: "hello@acceleratedmedicine.org",
      replyTo: input.email,
      ...buildPartnerSignupNotification(input),
    },
    { idempotencyKey: `partner-signup/${input.submissionKey}` },
  );
  if (result.error || !result.data?.id) {
    throw new Error(`The partner sign-up alert was not accepted: ${result.error?.message ?? "no email id"}`);
  }
  return { notified: true };
}
