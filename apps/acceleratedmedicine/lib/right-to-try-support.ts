import { Resend } from "resend";
import { z } from "zod";

import { US_STATES } from "@/lib/right-to-try";
import { storeRightToTrySupport } from "@/lib/right-to-try-support-store";

const stateNames = US_STATES.map(([name]) => name) as [
  string,
  ...string[],
];

export const supportPositionSchema = z.enum(["yes", "unsure", "no"]);
export const supporterRoleSchema = z.enum([
  "patient-or-caregiver",
  "clinician",
  "researcher",
  "public-educator",
  "other",
]);

export const rightToTrySupportSchema = z.object({
  submissionKey: z.string().uuid(),
  state: z.enum(stateNames),
  position: supportPositionSchema,
  role: supporterRoleSchema,
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  story: z.string().trim().max(2000).optional().or(z.literal("")),
  updates: z.boolean().default(false),
  companyWebsite: z.string().max(500).optional().default(""),
});

export type RightToTrySupportInput = z.infer<
  typeof rightToTrySupportSchema
>;

const positionLabels: Record<RightToTrySupportInput["position"], string> = {
  yes: "Supports the proposal",
  unsure: "Wants more information",
  no: "Does not support the proposal",
};

const roleLabels: Record<RightToTrySupportInput["role"], string> = {
  "patient-or-caregiver": "Patient or caregiver",
  clinician: "Clinician",
  researcher: "Researcher",
  "public-educator": "Public educator or state organizer",
  other: "Other",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildSupportNotification(input: RightToTrySupportInput) {
  const email = input.email || "Not provided";
  const story = input.story || "Not provided";
  const subject = `[Right to Try] ${input.state}: ${positionLabels[input.position]}`;
  const text = [
    `State: ${input.state}`,
    `Position: ${positionLabels[input.position]}`,
    `Role: ${roleLabels[input.role]}`,
    `Email: ${email}`,
    `Requested updates: ${input.updates ? "Yes" : "No"}`,
    "",
    "Why this matters:",
    story,
  ].join("\n");
  const html = `
    <h1>Universal Right to Try response</h1>
    <p><strong>State:</strong> ${escapeHtml(input.state)}</p>
    <p><strong>Position:</strong> ${escapeHtml(positionLabels[input.position])}</p>
    <p><strong>Role:</strong> ${escapeHtml(roleLabels[input.role])}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Requested updates:</strong> ${input.updates ? "Yes" : "No"}</p>
    <h2>Why this matters</h2>
    <p>${escapeHtml(story).replaceAll("\n", "<br>")}</p>
  `.trim();

  return { html, subject, text };
}

export function buildSupportConfirmation(input: RightToTrySupportInput) {
  const state = escapeHtml(input.state);
  const subject = `We recorded your ${input.state} Right to Try response`;
  const text = [
    `Your ${input.state} response has been recorded.`,
    "",
    "Montana has already shown that a broader, licensed treatment path can become law. Your response helps the Institute decide where public education is most useful next.",
    "",
    "See the Montana precedent: https://acceleratedmedicine.org/montana",
    "Review the model framework: https://acceleratedmedicine.org/model-act",
    "",
    "Institute for Accelerated Medicine",
    "A DBA of the Accelerated Medicine Foundation",
  ].join("\n");
  const html = `
    <main style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:auto;padding:24px">
      <h1 style="text-transform:uppercase">Your ${state} response is recorded.</h1>
      <p>Montana has already shown that a broader, licensed treatment path can become law. Your response helps the Institute decide where public education is most useful next.</p>
      <p><a href="https://acceleratedmedicine.org/montana">See the Montana precedent</a></p>
      <p><a href="https://acceleratedmedicine.org/model-act">Review the model framework</a></p>
      <p><strong>Institute for Accelerated Medicine</strong><br>A DBA of the Accelerated Medicine Foundation</p>
    </main>
  `.trim();

  return { html, subject, text };
}

export async function sendRightToTrySupport(
  rawInput: unknown,
  store: typeof storeRightToTrySupport = storeRightToTrySupport,
): Promise<{ sentConfirmation: boolean }> {
  const input = rightToTrySupportSchema.parse(rawInput);

  // Silently accept bot submissions. The response reveals nothing useful to
  // form-filling bots and prevents spam from reaching the Institute inbox.
  if (input.companyWebsite) {
    return { sentConfirmation: false };
  }

  await store(input, input.submissionKey);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Right to Try email service is not configured");
    return { sentConfirmation: false };
  }

  const resend = new Resend(apiKey);
  const fromAddress =
    process.env.EMAIL_FROM_ADDRESS || "no-reply@updates.dfda.earth";
  const from = `Institute for Accelerated Medicine <${fromAddress}>`;
  const notification = buildSupportNotification(input);
  try {
    const notificationResult = await resend.emails.send({
      from,
      to: "hello@acceleratedmedicine.org",
      replyTo: input.email || undefined,
      ...notification,
    });

    if (notificationResult.error || !notificationResult.data?.id) {
      throw new Error("The support response email was not accepted");
    }
  } catch (error) {
    console.error("Right to Try notification email failed", error);
    return { sentConfirmation: false };
  }

  if (!input.email) {
    return { sentConfirmation: false };
  }

  const confirmation = buildSupportConfirmation(input);
  try {
    const confirmationResult = await resend.emails.send({
      from,
      to: input.email,
      ...confirmation,
    });
    return {
      sentConfirmation: Boolean(
        !confirmationResult.error && confirmationResult.data?.id,
      ),
    };
  } catch (error) {
    console.error("Right to Try confirmation email failed", error);
    return { sentConfirmation: false };
  }
}
