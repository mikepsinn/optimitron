import { Resend } from "resend";
import { z } from "zod";

import { escapeHtml } from "@/lib/escape-html";
import { SUPPORTER_ROLES, US_STATES } from "@/lib/right-to-try";
import { storeRightToTrySupport } from "@/lib/right-to-try-support-store";

const stateNames = US_STATES.map(([name]) => name) as [string, ...string[]];

export const supportPositionSchema = z.enum(["yes", "unsure", "no"]);
export const supporterRoleSchema = z.enum(SUPPORTER_ROLES);

export const rightToTrySupportSchema = z
  .object({
    submissionKey: z.string().uuid(),
    intent: z.literal("state-support"),
    state: z.enum(stateNames),
    position: supportPositionSchema,
    role: supporterRoleSchema,
    email: z.string().trim().email().max(320).optional().or(z.literal("")),
    story: z.string().trim().max(2000).optional().or(z.literal("")),
    updates: z.boolean().default(false),
    companyWebsite: z.string().max(500).optional().default(""),
  })
  .superRefine((input, context) => {
    if (input.updates && !input.email) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter an email address to receive updates.",
        path: ["email"],
      });
    }
  });

export type RightToTrySupportInput = z.infer<typeof rightToTrySupportSchema>;

const positionLabels: Record<z.infer<typeof supportPositionSchema>, string> = {
  yes: "Supports the proposal",
  unsure: "Wants more information",
  no: "Does not support the proposal",
};

const roleLabels: Record<RightToTrySupportInput["role"], string> = {
  "patient-or-caregiver": "Patient or caregiver",
  clinician: "Clinician",
  researcher: "Researcher",
  "public-educator": "Public educator or state organizer",
  "state-legislator-or-staff": "State legislator or staff",
  other: "Other",
};

export function buildSupportNotification(input: RightToTrySupportInput) {
  const email = input.email || "Not provided";
  const story = input.story || "Not provided";
  const subject =
    input.role === "state-legislator-or-staff"
      ? `[Right to Trial LEGISLATOR] ${input.state}: ${positionLabels[input.position]}`
      : `[Right to Trial] ${input.state}: ${positionLabels[input.position]}`;
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
    <h1>Right to Trial response</h1>
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
  const subject = `We recorded your ${input.state} Right to Trial response`;
  const text = [
    `Your ${input.state} response has been recorded.`,
    "",
    "Montana has already shown that a broader, licensed treatment path can become law. Your response helps the Institute bring Right to Trial education to every state.",
    "",
    "See the Montana precedent: https://acceleratedmedicine.org/montana",
    "Review the model framework: https://acceleratedmedicine.org/model-act",
    "",
    "Institute for Accelerated Medicine",
    "A DBA of the Accelerated Medicine Foundation Inc",
  ].join("\n");
  const html = `
    <main style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:auto;padding:24px">
      <h1 style="text-transform:uppercase">Your ${state} response is recorded.</h1>
      <p>Montana has already shown that a broader, licensed treatment path can become law. Your response helps the Institute bring Right to Trial education to every state.</p>
      <p><a href="https://acceleratedmedicine.org/montana">See the Montana precedent</a></p>
      <p><a href="https://acceleratedmedicine.org/model-act">Review the model framework</a></p>
      <p><strong>Institute for Accelerated Medicine</strong><br>A DBA of the Accelerated Medicine Foundation Inc</p>
    </main>
  `.trim();

  return { html, subject, text };
}

export async function sendRightToTrySupport(
  rawInput: unknown,
  options: {
    clientKey: string;
    store?: typeof storeRightToTrySupport;
  },
): Promise<{ sentConfirmation: boolean }> {
  const input = rightToTrySupportSchema.parse(rawInput);
  const store = options.store ?? storeRightToTrySupport;

  // Silently accept bot submissions. The response reveals nothing useful to
  // form-filling bots and prevents spam from reaching the Institute inbox.
  if (input.companyWebsite) {
    return { sentConfirmation: false };
  }

  const { created } = await store(
    input,
    input.submissionKey,
    options.clientKey,
  );
  // A retry of a stored response already sent its emails.
  if (!created) {
    return { sentConfirmation: false };
  }

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

  if (input.updates && input.email) {
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      console.error(
        "RESEND_AUDIENCE_ID is not configured; the updates opt-in was stored but the contact was not subscribed",
      );
    } else {
      try {
        const contactResult = await resend.contacts.create({
          audienceId,
          email: input.email,
          unsubscribed: false,
        });
        if (contactResult.error) {
          throw new Error(contactResult.error.message);
        }
      } catch (error) {
        console.error("Right to Try audience subscription failed", error);
      }
    }
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
